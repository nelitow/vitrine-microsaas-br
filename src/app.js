(() => {
  const now = Date.now() / 1000;
  const store = {
    get(k, d) { try { return JSON.parse(localStorage.getItem('vitrine:' + k)) ?? d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem('vitrine:' + k, JSON.stringify(v)); } catch {} },
  };

  // "New since last visit": a visit ends after 30 idle minutes, so reloading
  // the page doesn't wipe the markers.
  const visit = store.get('visit', null);
  let since = now;
  if (visit) since = now - visit.cur > 1800 ? visit.cur : visit.prev;
  store.set('visit', { prev: since, cur: now });

  const following = new Set(store.get('following', []));

  const rtf = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' });
  const ago = (ts) => {
    const s = Math.min(ts - now, 0); // posts dated later today read as "agora"
    if (s > -3600 * 12 && new Date(ts * 1000).toDateString() === new Date().toDateString()) return 'hoje';
    const steps = [[60, 'second'], [3600, 'minute'], [86400, 'hour'], [2592000, 'day'], [31536000, 'month'], [Infinity, 'year']];
    let div = 1;
    for (const [limit, unit] of steps) {
      if (Math.abs(s) < limit) return rtf.format(Math.round(s / div), unit);
      div = limit;
    }
  };
  for (const t of document.querySelectorAll('time.when')) {
    t.title = t.textContent;
    t.textContent = ago(Number(t.dataset.ts));
  }

  const items = [...document.querySelectorAll('[data-key]')];
  const lastUpdateOf = (el) => Number(el.querySelector('time.when')?.dataset.ts ?? 0);

  function paint(el) {
    const on = following.has(el.dataset.key);
    const btn = el.querySelector('.follow');
    if (btn) {
      btn.setAttribute('aria-pressed', String(on));
      btn.textContent = on ? 'seguindo' : 'seguir';
    }
    const mark = el.querySelector('.new');
    if (mark) mark.hidden = !(lastUpdateOf(el) > since);
  }
  items.forEach(paint);

  const list = document.getElementById('list');

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.follow');
    if (!btn) return;
    const el = btn.closest('[data-key]');
    following.has(el.dataset.key) ? following.delete(el.dataset.key) : following.add(el.dataset.key);
    store.set('following', [...following]);
    paint(el);
    if (list) render();
  });

  if (!list) return; // project/about pages stop here

  const filters = document.getElementById('filters');
  const wide = matchMedia('(min-width: 860px)');
  const syncOpen = () => { if (wide.matches) filters.open = true; };
  syncOpen();
  wide.addEventListener('change', syncOpen);

  const data = JSON.parse(document.getElementById('data').textContent);
  const byKey = new Map(items.map((el) => [el.dataset.key, el]));
  const norm = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  for (const p of data.projects) p._text = norm([p.name, p.pitch, p.excerpt, p.author, p.domain, p.categories.join(' ')].join(' '));

  const params = new URLSearchParams(location.search);
  const state = {
    q: params.get('q') ?? '',
    sort: params.get('sort') ?? 'hot',
    stage: new Set(params.getAll('stage')),
    cat: new Set(params.getAll('cat')),
    status: new Set(params.getAll('status')),
    following: params.has('seguindo'),
    unseen: params.has('novidades'),
  };

  const sorters = {
    hot: (a, b) => hotness(b, now) - hotness(a, now),
    new: (a, b) => b.firstSeen - a.firstSeen,
    top: (a, b) => b.score - a.score,
  };

  const q = document.getElementById('q');
  q.value = state.q;
  q.addEventListener('input', () => { state.q = q.value; render(); });

  const boxes = [...document.querySelectorAll('input[data-filter]')];
  const isFlag = (f) => f === 'following' || f === 'unseen';
  for (const b of boxes) {
    b.checked = isFlag(b.dataset.filter) ? state[b.dataset.filter] : state[b.dataset.filter].has(b.value);
    b.addEventListener('change', () => {
      const f = b.dataset.filter;
      if (isFlag(f)) state[f] = b.checked;
      else b.checked ? state[f].add(b.value) : state[f].delete(b.value);
      render();
    });
  }

  document.querySelector('.sorts').addEventListener('click', (e) => {
    const b = e.target.closest('.sort');
    if (!b) return;
    state.sort = b.dataset.sort;
    render();
  });

  const clear = () => {
    state.q = q.value = '';
    state.stage.clear(); state.cat.clear(); state.status.clear();
    state.following = state.unseen = false;
    boxes.forEach((b) => { b.checked = false; });
    render();
  };
  document.querySelectorAll('#clear, [data-clear]').forEach((b) => b.addEventListener('click', clear));

  function render() {
    const terms = norm(state.q).split(/\s+/).filter(Boolean);
    const visible = data.projects.filter((p) =>
      terms.every((t) => p._text.includes(t)) &&
      (!state.stage.size || state.stage.has(p.stage)) &&
      (!state.cat.size || p.categories.some((c) => state.cat.has(c))) &&
      (!state.status.size || state.status.has(p.status)) &&
      (!state.following || following.has(p.key)) &&
      (!state.unseen || p.lastUpdate > since),
    ).sort(sorters[state.sort] ?? sorters.hot);

    const shown = new Set(visible.map((p) => p.key));
    for (const p of visible) list.appendChild(byKey.get(p.key));
    for (const [key, el] of byKey) el.hidden = !shown.has(key);

    const active = state.stage.size + state.cat.size + state.status.size + state.following + state.unseen;
    document.getElementById('empty').hidden = visible.length > 0;
    document.getElementById('clear').hidden = !(active || state.q);
    document.getElementById('filter-count').textContent = active ? `(${active})` : '';
    document.getElementById('result-count').textContent =
      visible.length === data.projects.length ? `${data.projects.length} projetos` : `${visible.length} de ${data.projects.length} projetos`;

    for (const b of document.querySelectorAll('.sort')) b.setAttribute('aria-pressed', String(b.dataset.sort === state.sort));
    document.getElementById('following-count').textContent = following.size;
    document.getElementById('unseen-count').textContent = data.projects.filter((p) => p.lastUpdate > since).length;

    const out = new URLSearchParams();
    if (state.q) out.set('q', state.q);
    if (state.sort !== 'hot') out.set('sort', state.sort);
    state.stage.forEach((s) => out.append('stage', s));
    state.cat.forEach((c) => out.append('cat', c));
    state.status.forEach((c) => out.append('status', c));
    if (state.following) out.set('seguindo', '');
    if (state.unseen) out.set('novidades', '');
    const qs = out.toString();
    history.replaceState(null, '', qs ? '?' + qs : location.pathname);
  }

  render();
})();
