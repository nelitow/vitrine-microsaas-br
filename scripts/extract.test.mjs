import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findProductLink, productKey, nameFromKey, detectStage, detectRevenue, detectCategories, excerpt, buildProjects } from './lib/extract.mjs';

test('productKey ignores social/reddit links and keeps path on shared hosts', () => {
  assert.equal(productKey('https://www.reddit.com/r/x'), null);
  assert.equal(productKey('https://youtu.be/abc'), null);
  assert.equal(productKey('https://www.meuapp.com.br/precos'), 'meuapp.com.br');
  assert.equal(productKey('https://github.com/Foo/Bar/tree/main'), 'github.com/foo/bar');
  assert.equal(productKey('https://play.google.com/store/apps/details?id=br.com.app'), 'play.google.com/br.com.app');
});

test('nameFromKey skips generic labels', () => {
  assert.equal(nameFromKey('meu-app.vercel.app'), 'Meu App');
  assert.equal(nameFromKey('agendaplus.com.br'), 'Agendaplus');
  assert.equal(nameFromKey('github.com/foo/saas-kit'), 'Saas Kit');
});

test('stage, revenue and category detection', () => {
  assert.equal(detectStage('chegamos a R$ 2k de MRR'), 'Com receita');
  assert.equal(detectStage('Lancei meu app'), 'Lançado');
  assert.equal(detectStage('ainda é um MVP'), 'MVP / Beta');
  assert.equal(detectRevenue('MRR de R$ 2.300 agora'), 'R$ 2.300');
  assert.equal(detectRevenue('faturando R$ 800/mês'), 'R$ 800');
  assert.equal(detectRevenue('sem receita'), null);
  assert.deepEqual(detectCategories('eu ia fazer um app'), []);
  assert.ok(detectCategories('Ferramenta de IA para clínicas').includes('IA'));
});

test('excerpt strips links and markdown and truncates', () => {
  assert.equal(excerpt('**Oi** veja https://x.com aqui'), 'Oi veja aqui');
  assert.ok(excerpt('palavra '.repeat(100)).endsWith('…'));
});

test('posts sharing a product link merge into one project with updates', () => {
  const base = { author: 'a', score: 1, num_comments: 0, flair: null, is_self: true, permalink: '/p', removed: false };
  const { projects, skipped } = buildProjects({
    a: { ...base, id: 'a', title: 'Lancei X', selftext: 'https://x.example', created_utc: 1 },
    b: { ...base, id: 'b', title: 'X tem MRR de R$ 1k', selftext: 'https://www.x.example/blog', created_utc: 2, score: 4 },
    c: { ...base, id: 'c', title: 'Pergunta', selftext: 'sem link', created_utc: 3 },
  });
  assert.equal(skipped, 1);
  assert.equal(projects.length, 1);
  assert.equal(projects[0].updates.length, 2);
  assert.equal(projects[0].score, 5);
  assert.equal(projects[0].stage, 'Com receita');
  assert.equal(projects[0].pitch, 'Lancei X');
});

test('excerpt drops the dangling lead-in left by a removed link', () => {
  assert.equal(excerpt('Está no ar: https://x.example'), 'Está no ar');
  assert.equal(excerpt('Lista de espera em https://x.example'), 'Lista de espera');
});

test('own domain is preferred over a GitHub link in the same post', () => {
  const link = findProductLink({ is_self: true, selftext: 'GitHub: https://github.com/a/b\nSite: https://b.app' });
  assert.equal(link.key, 'b.app');
});

import { assess, classifyResponse } from './lib/health.mjs';
const D = 86400;
const proj = { key: 'x.app', firstSeen: 0, lastUpdate: 0 };
const chk = (at, ok, kind = ok ? 'ok' : 'server') => ({ at: at * D, ok, kind });

test('one failed check is "fora do ar", not dead', () => {
  assert.equal(assess(proj, { 'x.app': { checks: [chk(10, true), chk(20, false)] } }, 20 * D).status, 'instavel');
});

test('failing for 14+ days across checks is dead, with death date at first failure', () => {
  const h = assess(proj, { 'x.app': { checks: [chk(10, true), chk(20, false), chk(35, false)] } }, 35 * D);
  assert.equal(h.status, 'morto');
  assert.equal(h.diedAt, 20 * D);
});

test('parked/DNS failures kill faster, but still need two checks', () => {
  const db = { 'x.app': { checks: [chk(20, false, 'dns'), chk(23, false, 'dns')] } };
  assert.equal(assess(proj, db, 23 * D).status, 'morto');
});

test('alive with no activity for 6 months is stale; 6 months alive is a survivor', () => {
  const h = assess(proj, { 'x.app': { checks: [chk(200, true)] } }, 200 * D);
  assert.equal(h.status, 'parado');
  assert.equal(h.survivor, true);
});

test('response classification', () => {
  assert.equal(classifyResponse({ status: 200, body: 'This domain is for sale' }).kind, 'parked');
  assert.equal(classifyResponse({ status: 403 }).ok, true);
  assert.equal(classifyResponse({ error: 'TypeError fetch failed ENOTFOUND' }).kind, 'dns');
});
