// Writes fake data/posts.json so the site can be built and previewed without
// Reddit credentials. The build shows a "sample data" banner for it.
import { writeFile, mkdir } from 'node:fs/promises';

const day = 86400;
const now = Math.floor(Date.now() / 1000);
let n = 0;
const post = (daysAgo, author, title, selftext, { url, score = 5, comments = 3, flair = null } = {}) => {
  const id = 'sample' + ++n;
  return {
    id, title, author, selftext, flair, score, num_comments: comments,
    created_utc: now - Math.round(daysAgo * day),
    url: url ?? `https://www.reddit.com/r/MicroSaaSBR/comments/${id}/`,
    is_self: !url,
    permalink: `/r/MicroSaaSBR/comments/${id}/`,
    removed: false,
  };
};

const posts = [
  post(40, 'ana_dev', 'Lancei o AgendaPlus: agendamento online para clínicas pequenas', 'Depois de 3 meses construindo, está no ar: https://agendaplus.example. Lembretes por WhatsApp, agenda para psicólogos e nutricionistas.', { score: 48, comments: 22, flair: 'Lançamento' }),
  post(6, 'ana_dev', 'AgendaPlus: chegamos a R$ 2.300 de MRR', 'Atualização do https://agendaplus.example — 41 clientes pagantes, MRR de R$ 2.300. O que funcionou foi tráfego orgânico.', { score: 91, comments: 37, flair: 'Atualização' }),
  post(2, 'ana_dev', 'AgendaPlus agora tem integração com Google Agenda', 'Novidade no https://agendaplus.example: sincronização com o calendário.', { score: 14, comments: 4 }),
  post(1.2, 'joaobuilds', 'Feedback: NotaFácil, emissão de nota fiscal para MEI em 1 clique', 'Estou em beta fechado. Lista de espera em https://notafacil.example', { score: 33, comments: 18, flair: 'Feedback' }),
  post(12, 'mariana_c', 'Criei um CRM no WhatsApp para corretores de imóveis', 'O https://zapcorretor.example organiza leads do WhatsApp e já tem 12 clientes pagantes.', { score: 27, comments: 9 }),
  post(0.3, 'pedro_ia', 'Resumidor de reuniões com IA em português', 'MVP no ar: https://atasia.example. Usa GPT para gerar atas e tarefas.', { score: 6, comments: 2, flair: 'Lançamento' }),
  post(3, 'lu_ecom', 'Ferramenta de precificação para quem vende no Mercado Livre', 'Lancei https://precificai.example — calcula margem com taxas e frete. Faturando R$ 800/mês.', { score: 19, comments: 11 }),
  post(25, 'thiagodev', 'Open source: boilerplate SaaS em Next.js com Pix e Stripe', 'Repo: https://github.com/thiagodev/saas-starter-br', { score: 64, comments: 15 }),
  post(9, 'carla_rh', 'Validando ideia: triagem de currículos com IA para pequenas empresas', 'Landing page: https://triagem.example — ainda é ideia, quero saber se vale a pena criar.', { score: 8, comments: 13, flair: 'Ideia' }),
  post(15, 'gui_edu', 'App de estudos para concurso com repetição espaçada', 'Lançamos o https://revisa.example, já são 300 alunos usando.', { score: 22, comments: 6 }),
  post(0.8, 'felipe_law', 'Gerador de contratos para freelancers (LGPD incluso)', 'Está no ar: https://contratofreela.example', { score: 3, comments: 1 }),
  post(30, 'bia_fit', 'Lancei um app de treino para personal trainers', 'https://personalapp.example — gestão de alunos e treinos, MVP.', { score: 12, comments: 7 }),
  post(4, 'semlink', 'Qual stack vocês usam para micro-SaaS?', 'Estou começando e queria saber o que vocês usam.', { score: 40, comments: 60 }),
  post(5, 'semlink2', 'Como conseguir os primeiros clientes?', 'Dicas?', { score: 30, comments: 25 }),
];

await mkdir(new URL('../data/', import.meta.url), { recursive: true });
await writeFile(new URL('../data/posts.json', import.meta.url),
  JSON.stringify({ fetchedAt: Date.now(), sample: true, posts: Object.fromEntries(posts.map((p) => [p.id, p])) }, null, 1));
console.log(`wrote ${posts.length} sample posts`);
