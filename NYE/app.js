/* The Garden of Earthly Delights — interactions */
(() => {
  'use strict';
  const D = window.NYE;
  const PINS = window.PINS || [];
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = matchMedia('(hover: hover)').matches;

  const store = {
    get(k, fallback) { try { const v = localStorage.getItem('gaed:' + k); return v == null ? fallback : JSON.parse(v); } catch { return fallback; } },
    set(k, v) { try { localStorage.setItem('gaed:' + k, JSON.stringify(v)); } catch { /* private mode */ } },
  };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const toast = (msg) => {
    $$('.toast').forEach((t) => t.remove());
    const t = document.createElement('div');
    t.className = 'toast'; t.textContent = msg; t.setAttribute('role', 'status');
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2300);
  };
  const hash = (s) => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };

  /* ======================= Hero ======================= */
  const heroBits = ['.hero__pre', '.hero__the', '.hero__line:nth-of-type(2)', '.hero__line:nth-of-type(3)', '.hero__sub', '.hero__dates', '.countdown', '.countdown__label'];
  heroBits.forEach((sel, i) => {
    const el = $(sel);
    if (!el) return;
    el.classList.add('reveal-word');
    el.style.animationDelay = (0.25 + i * 0.22) + 's';
  });

  // Countdown
  const cd = { d: $('[data-cd="d"]'), h: $('[data-cd="h"]'), m: $('[data-cd="m"]'), s: $('[data-cd="s"]') };
  const cdLabel = $('[data-cd-label]');
  const midnight = new Date(D.midnight).getTime();
  const departure = new Date(D.departure).getTime();
  const pad = (n) => String(n).padStart(2, '0');
  function tick() {
    const now = Date.now();
    let diff = Math.max(0, midnight - now);
    if (diff === 0) {
      cdLabel.textContent = now < departure ? 'Happy New Year ✦ 2027 has arrived' : 'Happy New Year — see you in the garden again';
    }
    const d = Math.floor(diff / 864e5); diff -= d * 864e5;
    const h = Math.floor(diff / 36e5); diff -= h * 36e5;
    const m = Math.floor(diff / 6e4); diff -= m * 6e4;
    const s = Math.floor(diff / 1e3);
    cd.d.textContent = d; cd.h.textContent = pad(h); cd.m.textContent = pad(m); cd.s.textContent = pad(s);
  }
  tick(); setInterval(tick, 1000);

  /* ======================= Atmosphere ======================= */
  const lantern = $('.atmos__lantern');
  let tx = innerWidth / 2, ty = innerHeight * 0.4, lx = tx, ly = ty, lastMove = 0;
  addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') { tx = e.clientX; ty = e.clientY; lastMove = performance.now(); } }, { passive: true });
  function lanternLoop(t) {
    if (!canHover || t - lastMove > 6000) { // wander like a carried candle
      tx = innerWidth * (0.5 + 0.32 * Math.sin(t / 5200)) ;
      ty = innerHeight * (0.42 + 0.22 * Math.sin(t / 3700 + 1.3));
    }
    lx += (tx - lx) * 0.07; ly += (ty - ly) * 0.07;
    const r = lantern.getBoundingClientRect();
    lantern.style.setProperty('--lx', ((lx - r.left) / r.width * 100).toFixed(2) + '%');
    lantern.style.setProperty('--ly', ((ly - r.top) / r.height * 100).toFixed(2) + '%');
    requestAnimationFrame(lanternLoop);
  }
  requestAnimationFrame(lanternLoop);

  // Embers
  (function embers() {
    if (reduceMotion) return;
    const c = $('.atmos__embers'); const ctx = c.getContext('2d');
    let W, H, dpr; const N = innerWidth < 700 ? 22 : 46; const ps = [];
    const resize = () => { dpr = Math.min(devicePixelRatio || 1, 2); W = c.width = innerWidth * dpr; H = c.height = innerHeight * dpr; };
    resize(); addEventListener('resize', resize);
    const spawn = (p = {}) => Object.assign(p, {
      x: Math.random() * W, y: H + Math.random() * H * 0.5, r: (Math.random() * 1.6 + 0.5) * dpr,
      vy: (Math.random() * 0.35 + 0.15) * dpr, vx: (Math.random() - 0.5) * 0.2 * dpr,
      life: 0, max: 500 + Math.random() * 600, ph: Math.random() * 6.28, hue: 22 + Math.random() * 22,
    });
    for (let i = 0; i < N; i++) { const p = spawn(); p.y = Math.random() * H; ps.push(p); }
    let running = true;
    document.addEventListener('visibilitychange', () => { running = !document.hidden; if (running) requestAnimationFrame(draw); });
    function draw() {
      if (!running) return;
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      for (const p of ps) {
        p.life++; p.y -= p.vy; p.x += p.vx + Math.sin((p.life + p.ph * 100) / 60) * 0.25 * dpr;
        const a = Math.max(0, Math.sin(Math.PI * p.life / p.max)) * (0.55 + 0.45 * Math.sin(p.life / 7 + p.ph));
        if (p.life > p.max || p.y < -10) spawn(p);
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
        g.addColorStop(0, `hsla(${p.hue},100%,70%,${a})`);
        g.addColorStop(1, `hsla(${p.hue},100%,50%,0)`);
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 4, 0, 6.283); ctx.fill();
      }
      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  })();

  // Deepen background once past the hero
  const hero = $('.hero');
  new IntersectionObserver(([e]) => document.body.classList.toggle('is-deep', !e.isIntersecting), { rootMargin: '-35% 0px 0px 0px' }).observe(hero);

  /* ======================= Scroll reveal ======================= */
  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); revealIO.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px' });
  const reveal = (els) => els.forEach((el) => { el.setAttribute('data-reveal', ''); revealIO.observe(el); });

  /* ======================= Tabs ======================= */
  const tabs = $$('.tabs button[data-tab]');
  const ink = $('.tabs__ink');
  const tabNav = $('#tabs');
  const TAB_IDS = tabs.map((t) => t.dataset.tab);
  let currentTab = null;
  const tabHooks = {};
  function moveInk() {
    const sel = tabs.find((t) => t.getAttribute('aria-selected') === 'true');
    if (!sel) return;
    ink.style.left = sel.offsetLeft + 'px';
    ink.style.width = sel.offsetWidth + 'px';
  }
  function showTab(id, { scroll = false } = {}) {
    if (!TAB_IDS.includes(id)) id = 'schedule';
    tabs.forEach((t) => t.setAttribute('aria-selected', String(t.dataset.tab === id)));
    $$('[data-panel]').forEach((p) => {
      const on = p.dataset.panel === id;
      if (on && p.hidden) { p.hidden = false; p.classList.remove('is-entering'); void p.offsetWidth; p.classList.add('is-entering'); }
      else if (!on) p.hidden = true;
    });
    moveInk();
    const btn = tabs.find((t) => t.dataset.tab === id);
    if (btn) { const bar = btn.parentElement; bar.scrollTo({ left: btn.offsetLeft - (bar.clientWidth - btn.offsetWidth) / 2, behavior: 'smooth' }); }
    if (currentTab !== id) { currentTab = id; tabHooks[id] && tabHooks[id](); }
    if (scroll) {
      const top = hero.offsetTop + hero.offsetHeight;
      if (scrollY < top - 2 || scroll === 'force') scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });
    }
  }
  tabs.forEach((t) => t.addEventListener('click', () => {
    history.replaceState(null, '', '#' + t.dataset.tab);
    showTab(t.dataset.tab, { scroll: 'force' });
  }));
  $('.tabs__inner').addEventListener('keydown', (e) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    const i = TAB_IDS.indexOf(currentTab) + (e.key === 'ArrowRight' ? 1 : -1);
    const next = tabs[(i + tabs.length) % tabs.length]; next.focus(); next.click();
  });
  document.addEventListener('click', (e) => {
    const go = e.target.closest('[data-goto]');
    if (!go) return;
    e.preventDefault();
    history.replaceState(null, '', '#' + go.dataset.goto);
    showTab(go.dataset.goto, { scroll: 'force' });
  });
  addEventListener('hashchange', () => showTab(location.hash.slice(1), { scroll: true }));
  addEventListener('resize', moveInk);
  document.fonts && document.fonts.ready.then(moveInk);

  /* ======================= Schedule ======================= */
  const daysEl = $('.days');
  const stage = $('.day-stage');
  const londonDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const todayIdx = D.days.findIndex((d) => d.date === londonDate);
  daysEl.innerHTML = D.days.map((d, i) => `
    <button class="day-btn${d.feature ? ' day-btn--feature' : ''}" role="tab" data-day="${i}" aria-selected="false" aria-controls="day-stage">
      ${i === todayIdx ? '<span class="day-btn__today">today</span>' : ''}
      <span class="day-btn__wd">${esc(d.weekday)}</span>
      <span class="day-btn__num">${esc(d.day)}</span>
      <span class="day-btn__mo">${esc(d.month)}</span>
      <span class="day-btn__title">${esc(d.title)}</span>
    </button>`).join('');
  stage.id = 'day-stage';
  function showDay(i) {
    const d = D.days[i];
    $$('.day-btn', daysEl).forEach((b) => b.setAttribute('aria-selected', String(+b.dataset.day === i)));
    const attire = d.attire ? `
      <div class="attire">
        <span class="attire__icon" aria-hidden="true">${d.feature ? '🎭' : '✦'}</span>
        <div>
          <span class="attire__label">Attire</span>
          <span class="attire__name">${esc(d.attire.label)}</span>
          <span class="attire__note">${esc(d.attire.note)}</span>
          ${d.feature ? '<button class="btn btn--ghost" data-goto="moodboard">Open the mood board</button>' : ''}
        </div>
      </div>` : '';
    stage.innerHTML = `
      <article class="day" aria-label="${esc(d.weekday + ' ' + d.day + ' ' + d.month)}">
        <div class="day__img">
          <img src="${d.image}" alt="" loading="lazy">
          <div class="day__img-cap"><p class="fell">${esc(d.weekday)} · ${esc(d.day)} ${esc(d.month)}</p><h3>${esc(d.title)}</h3></div>
        </div>
        <div class="day__body">
          ${attire}
          <ol class="timeline-ev">
            ${d.events.map((ev, k) => `
              <li class="ev${ev.highlight ? ' ev--hl' : ''}${ev.midnight ? ' ev--midnight' : ''}" style="animation-delay:${0.08 + k * 0.07}s">
                <span class="ev__time">${esc(ev.time)}</span>
                <span class="ev__dot" aria-hidden="true"></span>
                <span><span class="ev__title">${esc(ev.title)}</span>${ev.text ? `<span class="ev__text">${esc(ev.text)}</span>` : ''}</span>
              </li>`).join('')}
          </ol>
        </div>
      </article>`;
  }
  daysEl.addEventListener('click', (e) => { const b = e.target.closest('.day-btn'); if (b) showDay(+b.dataset.day); });
  daysEl.addEventListener('keydown', (e) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    const cur = $$('.day-btn', daysEl).findIndex((b) => b.getAttribute('aria-selected') === 'true');
    const n = (cur + (e.key === 'ArrowRight' ? 1 : -1) + D.days.length) % D.days.length;
    showDay(n); $$('.day-btn', daysEl)[n].focus();
  });
  showDay(todayIdx >= 0 ? todayIdx : 0);

  // Travel
  const travelList = $('.travel-list');
  const renderTravel = (mode) => {
    $$('.seg__btn').forEach((b) => b.classList.toggle('is-on', b.dataset.mode === mode));
    travelList.innerHTML = D.travel[mode].map((t, i) => `<li style="animation-delay:${i * 0.06}s">${esc(t)}</li>`).join('');
  };
  $$('.seg__btn').forEach((b) => b.addEventListener('click', () => renderTravel(b.dataset.mode)));
  renderTravel('train');

  // Packing
  const packed = new Set(store.get('packed', []));
  const packList = $('.pack-list');
  packList.innerHTML = D.packing.map((p) => `
    <li><label><input type="checkbox" data-pack="${p.id}" ${packed.has(p.id) ? 'checked' : ''}><span>${p.strong ? `<strong>${esc(p.text)}</strong>` : esc(p.text)}</span></label></li>`).join('');
  const packCount = () => { $('[data-pack-count]').textContent = packed.size; $('[data-pack-total]').textContent = D.packing.length; };
  packList.addEventListener('change', (e) => {
    const id = e.target.dataset.pack; if (!id) return;
    e.target.checked ? packed.add(id) : packed.delete(id);
    store.set('packed', [...packed]); packCount();
    if (packed.size === D.packing.length) toast('All packed — see you in the garden ✦');
  });
  packCount();

  // Calendar (.ics)
  $('[data-ics]').addEventListener('click', () => {
    const where = D.address.replace(/,/g, '\\,');
    const evs = [
      ['20261229T130000Z', '20270101T130000Z', 'NYE at North Cadbury Court — The Garden of Earthly Delights', 'Arrivals from 1pm on 29 Dec. Departures by 1pm on 1 Jan.'],
      ['20261229T190000Z', '20261229T235900Z', 'Villains party (fancy dress)', "Villains fancy dress — real or fictional. Prize for best dressed. Dinner: Cheeky Nando's at the house."],
      ['20261231T190000Z', '20261231T203000Z', 'Cocktail hour — Black Tie Masquerade', 'Garden of Earthly Delights — Black Tie Masquerade. Mask required.'],
      ['20261231T203000Z', '20261231T223000Z', 'Sit-down black tie dinner', ''],
      ['20261231T223000Z', '20270101T000000Z', 'Drinks & dancing', ''],
      ['20270101T000000Z', '20270101T000100Z', 'Welcome in 2027 with bubbles', ''],
      ['20270101T000100Z', '20270101T081300Z', 'Cellar disco till the break of dawn', 'Sunrise in Somerset is about 8:13am.'],
      ['20270101T120000Z', '20270101T130000Z', 'Departures — please depart by 1pm', 'Trains run a reduced service on New Year’s Day.'],
    ];
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Garden of Earthly Delights//NYE//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
    evs.forEach(([s, e, title, desc], i) => {
      lines.push('BEGIN:VEVENT', `UID:gaed-nye-${i}@north-cadbury-court`, `DTSTAMP:${stamp}`, `DTSTART:${s}`, `DTEND:${e}`,
        `SUMMARY:${title.replace(/,/g, '\\,')}`, `LOCATION:${where}`, `DESCRIPTION:${desc.replace(/,/g, '\\,')}`, 'END:VEVENT');
    });
    lines.push('END:VCALENDAR');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([lines.join('\r\n')], { type: 'text/calendar' }));
    a.download = 'NYE-North-Cadbury-Court.ics';
    document.body.appendChild(a); a.click(); a.remove();
    toast('Calendar file downloaded');
  });

  reveal($$('.info-grid .card'));

  /* ======================= Names & Faces ======================= */
  const facesEl = $('[data-faces]');
  const slug = (n) => n.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  let guests = D.guests.map((name) => {
    const parts = name.split(' ');
    const h = hash(name);
    return {
      name, first: parts[0], last: parts.slice(1).join(' '),
      initials: (parts[0][0] + (parts[parts.length - 1][0] || '')).toUpperCase(),
      slug: slug(name),
      // each guest gets their own little corner of the painting
      px: [4 + (h % 17), 30 + (h % 41), 81 + (h % 15)][(h >>> 16) % 3], py: 22 + ((h >>> 8) % 74),
    };
  });
  const PHOTOS = new Set(D.photos || []);
  let photosLoaded = 0;
  function renderFaces(list) {
    if (!list.length) { facesEl.innerHTML = '<p class="faces-empty">No one by that name in the garden… yet.</p>'; return; }
    facesEl.innerHTML = list.map((g, i) => `
      <figure class="face" style="animation-delay:${Math.min(i * 0.025, 0.8)}s" data-slug="${g.slug}">
        <div class="face__frame">
          <div class="face__oval">
            <div class="face__paint" style="background-position:${g.px}% ${g.py}%"></div>
            <span class="face__initials" aria-hidden="true">${esc(g.initials)}</span>
            ${PHOTOS.has(g.slug) ? `<img class="face__photo" alt="${esc(g.name)}" loading="lazy" src="faces/${g.slug}.jpg">` : ''}
          </div>
        </div>
        <figcaption class="face__name"><span class="face__first">${esc(g.first)}</span><span class="face__last">${esc(g.last)}</span></figcaption>
      </figure>`).join('');
    $$('.face__photo', facesEl).forEach((img) => {
      const ok = () => { img.classList.add('is-loaded'); img.parentElement.querySelector('.face__initials').hidden = true; photosLoaded++; if (photosLoaded >= 6) $('[data-quiz]').hidden = false; };
      if (img.complete && img.naturalWidth) ok();
      else { img.addEventListener('load', ok, { once: true }); img.addEventListener('error', () => img.remove(), { once: true }); }
    });
    $('[data-face-count]').textContent = list.length === guests.length ? `${guests.length} revellers` : `${list.length} of ${guests.length}`;
  }
  const searchEl = $('[data-face-search]');
  const filterFaces = () => {
    const q = searchEl.value.trim().toLowerCase();
    renderFaces(q ? guests.filter((g) => g.name.toLowerCase().includes(q)) : guests);
  };
  searchEl.addEventListener('input', () => { photosLoaded = 0; filterFaces(); });
  $('[data-shuffle-faces]').addEventListener('click', () => {
    guests = guests.map((g) => [Math.random(), g]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
    photosLoaded = 0; filterFaces();
  });
  $('[data-quiz]').addEventListener('click', (e) => {
    const on = facesEl.classList.toggle('is-quiz');
    e.currentTarget.setAttribute('aria-pressed', String(on));
    $$('.face.is-revealed', facesEl).forEach((f) => f.classList.remove('is-revealed'));
    if (on) toast('Who’s behind the mask? Tap to reveal');
  });
  facesEl.addEventListener('click', (e) => { const f = e.target.closest('.face'); if (f && facesEl.classList.contains('is-quiz')) f.classList.add('is-revealed'); });
  tabHooks.faces = () => { if (!facesEl.children.length) renderFaces(guests); };

  /* ======================= Mood board ======================= */
  const TAGS = [
    ['m', 'Masks'], ['g', 'Gowns'], ['b', 'Gents'], ['h', 'Headpieces & Feathers'],
    ['a', 'The Painting'], ['t', 'Candlelit Tables'], ['p', 'The Party'], ['c', 'Collages'],
  ];
  const TAGNAME = Object.fromEntries(TAGS);
  const pinImg = (h, size) => `https://i.pinimg.com/${size}/${h.slice(0, 2)}/${h.slice(2, 4)}/${h.slice(4, 6)}/${h}.jpg`;
  const pins = PINS.map(([h, r, tags, id], i) => ({ h, r: r || 1.3, tags, id, i }));
  const favs = new Set(store.get('favs', []));
  const boardEl = $('[data-board]');
  const chipsEl = $('[data-chips]');
  const emptyEl = $('[data-board-empty]');
  const favBtn = $('[data-board-favs]');
  let filter = 'all', favOnly = false, order = pins.slice(), visible = [];

  chipsEl.innerHTML = [['all', 'All'], ...TAGS].map(([k, label]) => {
    const n = k === 'all' ? pins.length : pins.filter((p) => p.tags.includes(k)).length;
    return n ? `<button class="chip" data-chip="${k}" aria-pressed="${k === 'all'}">${esc(label)}<small>${n}</small></button>` : '';
  }).join('');
  chipsEl.addEventListener('click', (e) => {
    const c = e.target.closest('.chip'); if (!c) return;
    filter = c.dataset.chip;
    $$('.chip', chipsEl).forEach((x) => x.setAttribute('aria-pressed', String(x === c)));
    layoutBoard();
  });
  favBtn.addEventListener('click', () => {
    favOnly = !favOnly; favBtn.setAttribute('aria-pressed', String(favOnly));
    if (favOnly && !favs.size) toast('Tap ♡ on any image to save it here');
    layoutBoard();
  });
  $('[data-board-shuffle]').addEventListener('click', () => {
    order = order.map((p) => [Math.random(), p]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
    layoutBoard();
  });
  const updateFavCount = () => { $('[data-fav-count]').textContent = favs.size; };
  updateFavCount();

  const pinIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      setTimeout(() => el.classList.add('is-in'), (+el.dataset.k % 5) * 70);
      pinIO.unobserve(el);
    });
  }, { rootMargin: '0px 0px 120px 0px' });

  let lastCols = 0;
  function colCount() {
    const w = boardEl.clientWidth || innerWidth;
    return w < 520 ? 2 : w < 860 ? 3 : w < 1200 ? 4 : 5;
  }
  function layoutBoard() {
    if (!pins.length) {
      emptyEl.hidden = false;
      emptyEl.textContent = 'The board is being gathered — check back very soon.';
      return;
    }
    visible = order.filter((p) => (filter === 'all' || p.tags.includes(filter)) && (!favOnly || favs.has(p.h)));
    emptyEl.hidden = !!visible.length;
    if (!visible.length) emptyEl.textContent = favOnly ? 'Nothing hearted yet — tap ♡ on anything that speaks to you.' : 'Nothing here.';
    const n = colCount(); lastCols = n;
    const cols = Array.from({ length: n }, () => ({ h: 0, items: [] }));
    visible.forEach((p, k) => {
      const c = cols.reduce((a, b) => (b.h < a.h - 0.01 ? b : a));
      c.items.push([p, k]); c.h += p.r + 0.08;
    });
    boardEl.innerHTML = cols.map((c) => `<div class="board__col">${c.items.map(([p, k]) => `
      <div class="pin" role="button" tabindex="0" data-k="${k}" data-h="${p.h}" style="aspect-ratio:1/${p.r}" aria-label="Open image ${k + 1}${p.tags ? ': ' + esc(p.tags.split('').map((t) => TAGNAME[t]).filter(Boolean).join(', ')) : ''}">
        <img src="${pinImg(p.h, '736x')}" alt="" loading="lazy" decoding="async">
        <button class="pin__fav${favs.has(p.h) ? ' is-on' : ''}" data-fav="${p.h}" aria-label="Favourite" aria-pressed="${favs.has(p.h)}">${favs.has(p.h) ? '♥' : '♡'}</button>
      </div>`).join('')}</div>`).join('');
    $$('.pin', boardEl).forEach((el) => {
      const img = $('img', el);
      const done = () => img.classList.add('is-loaded');
      img.complete && img.naturalWidth ? done() : img.addEventListener('load', done, { once: true });
      pinIO.observe(el);
    });
  }
  function toggleFav(h) {
    favs.has(h) ? favs.delete(h) : favs.add(h);
    store.set('favs', [...favs]); updateFavCount();
    const on = favs.has(h);
    $$(`[data-fav="${h}"]`).forEach((b) => { b.classList.toggle('is-on', on); b.textContent = on ? '♥' : '♡'; b.setAttribute('aria-pressed', String(on)); b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); });
    return on;
  }
  boardEl.addEventListener('click', (e) => {
    const f = e.target.closest('[data-fav]');
    if (f) { e.stopPropagation(); toggleFav(f.dataset.fav); if (favOnly) layoutBoard(); return; }
    const p = e.target.closest('.pin'); if (p) openLightbox(+p.dataset.k, p);
  });
  boardEl.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('pin')) { e.preventDefault(); openLightbox(+e.target.dataset.k, e.target); }
  });
  let resizeT;
  addEventListener('resize', () => { clearTimeout(resizeT); resizeT = setTimeout(() => { if (currentTab === 'moodboard' && colCount() !== lastCols) layoutBoard(); }, 150); });
  tabHooks.moodboard = () => { if (!boardEl.children.length || colCount() !== lastCols) layoutBoard(); };

  // Lightbox
  const lb = $('[data-lightbox]');
  const lbImg = $('img', lb);
  const lbCap = $('.lightbox__cap', lb);
  const lbCount = $('.lightbox__count', lb);
  const lbFav = $('.lightbox__fav', lb);
  let lbIndex = 0, lbReturn = null;
  function lbShow(i) {
    if (!visible.length) return;
    lbIndex = (i + visible.length) % visible.length;
    const p = visible[lbIndex];
    lbImg.src = pinImg(p.h, '736x');
    lbImg.style.animation = 'none'; void lbImg.offsetWidth; lbImg.style.animation = '';
    const hi = new Image();
    hi.onload = () => { if (visible[lbIndex] === p) lbImg.src = hi.src; };
    hi.src = pinImg(p.h, '1200x');
    lbImg.alt = p.tags.split('').map((t) => TAGNAME[t]).filter(Boolean).join(', ');
    lbCap.textContent = p.tags.split('').map((t) => TAGNAME[t]).filter(Boolean).join(' · ');
    lbCount.textContent = `${lbIndex + 1} / ${visible.length}`;
    const on = favs.has(p.h); lbFav.textContent = on ? '♥' : '♡'; lbFav.classList.toggle('is-on', on); lbFav.setAttribute('aria-pressed', String(on));
    [1, -1].forEach((d) => { const n = visible[(lbIndex + d + visible.length) % visible.length]; if (n) new Image().src = pinImg(n.h, '736x'); });
  }
  function openLightbox(i, from) {
    lbReturn = from || null; lb.hidden = false; document.body.style.overflow = 'hidden'; lbShow(i);
    $('[data-lb="close"]', lb).focus();
  }
  function closeLightbox() { lb.hidden = true; document.body.style.overflow = ''; lbReturn && lbReturn.focus && lbReturn.focus({ preventScroll: true }); }
  lb.addEventListener('click', (e) => {
    const a = e.target.closest('[data-lb]');
    if (!a) { if (e.target === lb || e.target.classList.contains('lightbox__fig')) closeLightbox(); return; }
    const act = a.dataset.lb;
    if (act === 'close') closeLightbox();
    else if (act === 'next') lbShow(lbIndex + 1);
    else if (act === 'prev') lbShow(lbIndex - 1);
    else if (act === 'fav') { const on = toggleFav(visible[lbIndex].h); lbFav.textContent = on ? '♥' : '♡'; lbFav.classList.toggle('is-on', on); }
  });
  let sx = null, sy = null;
  lb.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  lb.addEventListener('touchend', (e) => {
    if (sx == null) return;
    const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) lbShow(lbIndex + (dx < 0 ? 1 : -1));
    else if (dy > 90 && Math.abs(dy) > Math.abs(dx)) closeLightbox();
    sx = sy = null;
  });

  /* ======================= Background ======================= */
  // Triptych
  const trip = $('[data-triptych]');
  const tripBtn = $('[data-trip-toggle]');
  const tripState = $('[data-trip-state]');
  const TRIP_CLOSED = tripState.textContent;
  const TRIP_OPEN = 'Open, it reads left to right: Eden, then the Garden of Earthly Delights, then Hell. We’ll be in the middle.';
  function setTrip(open) {
    trip.classList.toggle('is-open', open);
    tripBtn.textContent = open ? 'Close the triptych' : 'Open the triptych';
    tripState.style.opacity = 0;
    setTimeout(() => { tripState.textContent = open ? TRIP_OPEN : TRIP_CLOSED; tripState.style.opacity = 1; }, 500);
  }
  tripBtn.addEventListener('click', () => setTrip(!trip.classList.contains('is-open')));
  let autoOpened = false;
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !autoOpened) { autoOpened = true; setTimeout(() => setTrip(true), 900); }
  }, { threshold: 0.6 }).observe($('.triptych__stage'));

  // Explorer
  const ex = $('[data-explorer]');
  const exView = $('.explorer__viewport', ex);
  const exCanvas = $('.explorer__canvas', ex);
  const exCard = $('.explorer__card', ex);
  const spotsEl = $('.explorer__spots', ex);
  spotsEl.innerHTML = D.hotspots.map((h, i) => `<button class="spot" style="left:${h.x}%;top:${h.y}%" data-spot="${i}" aria-label="${esc(h.title)}"></button>`).join('');
  let exActive = -1;
  function zoomTo(x, y, s) {
    const W = exView.clientWidth, H = exView.clientHeight;
    let tx = W / 2 - s * (x / 100) * W, ty = H / 2 - s * (y / 100) * H;
    tx = Math.min(0, Math.max(W - s * W, tx)); ty = Math.min(0, Math.max(H - s * H, ty));
    exCanvas.style.transform = `translate(${tx}px, ${ty}px) scale(${s})`;
    exCanvas.style.setProperty('--s', s);
    ex.classList.toggle('is-zoomed', s > 1);
  }
  function showSpot(i) {
    exActive = (i + D.hotspots.length) % D.hotspots.length;
    const h = D.hotspots[exActive];
    zoomTo(h.x, h.y, innerWidth < 640 ? 3.4 : 3);
    $$('.spot', spotsEl).forEach((s, k) => s.classList.toggle('is-active', k === exActive));
    $('.explorer__panel', exCard).textContent = h.panel;
    $('.explorer__title', exCard).textContent = h.title;
    $('.explorer__text', exCard).textContent = h.text;
    exCard.classList.toggle('is-right', h.x < 50);
    exCard.hidden = false; exCard.style.animation = 'none'; void exCard.offsetWidth; exCard.style.animation = '';
  }
  function stepBack() {
    exActive = -1; zoomTo(50, 50, 1); exCard.hidden = true;
    $$('.spot', spotsEl).forEach((s) => s.classList.remove('is-active'));
  }
  exView.addEventListener('click', (e) => {
    const s = e.target.closest('.spot');
    if (s) { showSpot(+s.dataset.spot); return; }
    if (ex.classList.contains('is-zoomed')) { stepBack(); return; }
    // free zoom where you tapped
    const r = exView.getBoundingClientRect();
    zoomTo((e.clientX - r.left) / r.width * 100, (e.clientY - r.top) / r.height * 100, 2.6);
  });
  exCard.addEventListener('click', (e) => {
    const b = e.target.closest('[data-ex]'); if (!b) return;
    if (b.dataset.ex === 'next') showSpot(exActive + 1);
    else if (b.dataset.ex === 'prev') showSpot(exActive - 1);
    else stepBack();
  });
  addEventListener('resize', () => { if (exActive >= 0) showSpot(exActive); });

  // Motifs / palette
  $('[data-motifs]').innerHTML = D.motifs.map((m) => `
    <div class="motif"><span class="motif__from">${esc(m.from)}</span><span class="motif__arrow">wear it as</span><span class="motif__to">${esc(m.to)}</span></div>`).join('');
  $('[data-palette]').innerHTML = D.palette.map((c) => `
    <button class="swatch" data-hex="${c.hex}" aria-label="Copy ${esc(c.name)} ${c.hex}"><span class="swatch__dot" style="background:${c.hex}"></span><span class="swatch__name">${esc(c.name)}</span><span class="swatch__hex">${c.hex}</span></button>`).join('');
  $('[data-palette]').addEventListener('click', async (e) => {
    const s = e.target.closest('.swatch'); if (!s) return;
    try { await navigator.clipboard.writeText(s.dataset.hex); toast(`Copied ${s.dataset.hex}`); } catch { toast(s.dataset.hex); }
  });

  // House
  $('[data-history]').innerHTML = D.history.map((h) => `
    <li><span class="tl__year">${esc(h.year)}</span><span class="tl__title">${esc(h.title)}</span><span class="tl__text">${esc(h.text)}</span></li>`).join('');
  $('[data-rooms]').innerHTML = D.rooms.map((r) => `
    <figure class="room"><img src="${r.img}" alt="${esc(r.name)}" loading="lazy"><figcaption><span class="room__name">${esc(r.name)}</span>${r.note ? `<span class="room__note">${esc(r.note)}</span>` : ''}</figcaption></figure>`).join('');

  tabHooks.background = () => {
    reveal($$('.story, .explore, .motif, .palette, .house__head, .timeline, .room', $('#background')).filter((el) => !el.hasAttribute('data-reveal')));
  };

  /* ======================= Global keys ======================= */
  document.addEventListener('keydown', (e) => {
    if (!lb.hidden) {
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowRight') lbShow(lbIndex + 1);
      else if (e.key === 'ArrowLeft') lbShow(lbIndex - 1);
      return;
    }
    if (currentTab === 'background' && !e.target.closest('input, .tabs, .days')) {
      const r = exView.getBoundingClientRect();
      const inView = r.top < innerHeight * 0.8 && r.bottom > innerHeight * 0.2;
      if (!inView) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); showSpot(exActive + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); showSpot(exActive < 0 ? -1 : exActive - 1); }
      else if (e.key === 'Escape') stepBack();
    }
  });

  /* ======================= Boot ======================= */
  const initial = location.hash.slice(1);
  showTab(TAB_IDS.includes(initial) ? initial : 'schedule', { scroll: TAB_IDS.includes(initial) });
})();
