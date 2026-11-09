(() => {
  const now = Date.now() / 1000;
  const store = {
    get(k, d) { try { return JSON.parse(localStorage.getItem('vitrine:' + k)) ?? d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem('vitrine:' + k, JSON.stringify(v)); } catch {} },
  };

  // "New since last visit": a visit ends after 30 idle minutes, so reloading
  // the page doesn't wipe the badges.
  const visit = store.get('visit', null);
  let since = now;
  if (visit) since = now - visit.cur > 1800 ? visit.cur : visit.prev;
  store.set('visit', { prev: since, cur: now });

  const following = new Set(store.get('following', []));

  const rtf = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' });
  const ago = (ts) => {
    const s = ts - now;
    const steps = [[60, 'second'], [3600, 'minute'], [86400, 'hour'], [2592000, 'day'], [31536000, 'month'], [Infinity, 'year']];
    let div = 1;
    for (const [limit, unit] of steps) {
      if (Math.abs(s) < limit) return rtf.format(Math.round(s / div), unit);
      div = limit;
    }
  };
  for (const t of document.querySelectorAll('time.when')) t.textContent = ago(Number(t.dataset.ts));

  const cards = [...document.querySelectorAll('.card')];
  const lastUpdateOf = (el) => Number(el.querySelector('time.when')?.dataset.ts ?? 0);

  function paintCard(el) {
    const key = el.dataset.key;
    const btn = el.querySelector('.follow');
    const on = following.has(key);
    btn.setAttribute('aria-pressed', String(on));
    btn.textContent = on ? '★ Seguindo' : 'Seguir';
    el.classList.toggle('is-following', on);
    el.querySelector('.badge-new').hidden = !(lastUpdateOf(el) > since);
  }
  cards.forEach(paintCard);

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.follow');
    if (!btn) return;
    const el = btn.closest('.card');
    following.has(el.dataset.key) ? following.delete(el.dataset.key) : following.add(el.dataset.key);
    store.set('following', [...following]);
    paintCard(el);
    if (list) render();
  });

  const list = document.getElementById('list');
  if (!list) return; // project/about pages stop here

  const data = JSON.parse(document.getElementById('data').textContent);
  const byKey = new Map(cards.map((el) => [el.dataset.key, el]));
  const norm = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  for (const p of data.projects) p._text = norm([p.name, p.pitch, p.excerpt, p.author, p.domain, p.categories.join(' ')].join(' '));

  const params = new URLSearchParams(location.search);
  const state = {
    q: params.get('q') ?? '',
    sort: params.get('sort') ?? 'hot',
    stage: new Set(params.getAll('stage')),
    cat: new Set(params.getAll('cat')),
    following: params.has('seguindo'),
    unseen: params.has('novidades'),
  };

  const sorters = {
    hot: (a, b) => hotness(b, now) - hotness(a, now),
    new: (a, b) => b.firstSeen - a.firstSeen,
    updated: (a, b) => b.lastUpdate - a.lastUpdate,
    top: (a, b) => b.score - a.score,
    comments: (a, b) => b.comments - a.comments,
  };

  const q = document.getElementById('q');
  q.value = state.q;
  q.addEventListener('input', () => { state.q = q.value; render(); });

  document.querySelector('.controls').addEventListener('click', (e) => {
    const sort = e.target.closest('.sort');
    const chip = e.target.closest('.chip');
    if (sort) state.sort = sort.dataset.sort;
    else if (chip) {
      const f = chip.dataset.filter;
      if (f === 'following' || f === 'unseen') state[f] = !state[f];
      else state[f].has(chip.dataset.value) ? state[f].delete(chip.dataset.value) : state[f].add(chip.dataset.value);
    } else return;
    render();
  });

  function render() {
    const terms = norm(state.q).split(/\s+/).filter(Boolean);
    const visible = data.projects.filter((p) =>
      terms.every((t) => p._text.includes(t)) &&
      (!state.stage.size || state.stage.has(p.stage)) &&
      (!state.cat.size || p.categories.some((c) => state.cat.has(c))) &&
      (!state.following || following.has(p.key)) &&
      (!state.unseen || p.lastUpdate > since),
    ).sort(sorters[state.sort] ?? sorters.hot);

    const shown = new Set(visible.map((p) => p.key));
    for (const p of visible) list.appendChild(byKey.get(p.key));
    for (const [key, el] of byKey) el.hidden = !shown.has(key);

    document.getElementById('empty').hidden = visible.length > 0;
    document.getElementById('result-count').textContent =
      visible.length === data.projects.length ? '' : `${visible.length} de ${data.projects.length} projetos`;

    for (const b of document.querySelectorAll('.sort')) b.setAttribute('aria-pressed', String(b.dataset.sort === state.sort));
    for (const c of document.querySelectorAll('.chip')) {
      const f = c.dataset.filter;
      const on = f === 'following' || f === 'unseen' ? state[f] : state[f].has(c.dataset.value);
      c.setAttribute('aria-pressed', String(on));
    }
    const unseenCount = data.projects.filter((p) => p.lastUpdate > since).length;
    document.getElementById('following-count').textContent = following.size ? `(${following.size})` : '';
    document.getElementById('unseen-count').textContent = `(${unseenCount})`;

    const out = new URLSearchParams();
    if (state.q) out.set('q', state.q);
    if (state.sort !== 'hot') out.set('sort', state.sort);
    state.stage.forEach((s) => out.append('stage', s));
    state.cat.forEach((c) => out.append('cat', c));
    if (state.following) out.set('seguindo', '');
    if (state.unseen) out.set('novidades', '');
    const qs = out.toString();
    history.replaceState(null, '', qs ? '?' + qs : location.pathname);
  }

  render();
})();
