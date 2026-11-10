(() => {
  'use strict';

  const RUNES = window.RUNES;

  /* 배열법 — 해설서 "룬들에게 말을 거는 방법" 기준.
   * order: 뽑는 순서대로 카드가 놓이는 자리 번호. 읽을 때는 항상 1번부터. */
  const SPREADS = {
    one: {
      name: '오딘의 배열법', sub: '원카드', count: 1, order: [1],
      mini: ['"a"', [['a', 1]]],
      intro: '다급한 상황에서 쓰는 배열법. 내가 취할 태도와 근본적인 원인을 알 수 있습니다.',
      positions: { 1: ['태도와 원인', '내가 취할 태도와 근본적인 원인'] }
    },
    three: {
      name: '세 개의 룬 배열', sub: '쓰리카드', count: 3, order: [3, 2, 1],
      mini: ['"c b a"', [['c', 3], ['b', 2], ['a', 1]]],
      intro: '3, 2, 1 순으로 뽑고 1, 2, 3 순서로 읽습니다. 선택의 갈림길에 설 때.',
      positions: {
        1: ['현재', '현재 상황'],
        2: ['태도', '선택해야 할 때 취할 태도'],
        3: ['결과', '선택으로 만들어진 결과의 방향']
      }
    },
    cross: {
      name: '룬 십자가 배열법', sub: '여섯 장', count: 6, order: [1, 2, 3, 4, 5, 6],
      mini: ['". f ." "c e a" ". b ." ". d ."', [['f', 6], ['c', 3], ['e', 5], ['a', 1], ['b', 2], ['d', 4]]],
      intro: '과거에서 미래까지, 문제의 핵심과 그 너머의 승리를 함께 봅니다.',
      positions: {
        1: ['과거', '당신의 과거'],
        2: ['현재', '당신의 현재 상황'],
        3: ['미래', '당신의 미래'],
        4: ['문제의 핵심', '문제의 핵심'],
        5: ['도전과 의욕', '당신의 도전, 하고자 하는 의욕'],
        6: ['결과 뒤의 승리', '긍정적인 결과 뒤에 따르는 도전과 승리']
      }
    }
  };

  const FORTUNES = [['money', '금전운'], ['love', '연애운'], ['work', '직업운'], ['health', '건강운']];

  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* 치우침 없는 난수 (0 이상 n 미만) */
  function rand(n) {
    const buf = new Uint32Array(1);
    const limit = Math.floor(0x100000000 / n) * n;
    do { crypto.getRandomValues(buf); } while (buf[0] >= limit);
    return buf[0] % n;
  }
  function shuffled(list) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = rand(i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /* ── 그림 ─────────────────────────── */
  function glyphSVG(rune, reversed) {
    const inner = rune.blank
      ? '<circle class="blank-moon" cx="50" cy="70" r="5"/><circle class="blank-ring" cx="50" cy="70" r="34"/>'
      : `<path d="${rune.path}"/>`;
    return `<svg class="glyph${reversed ? ' is-reversed' : ''}" viewBox="0 0 100 140" aria-hidden="true">${inner}</svg>`;
  }

  function faceHTML(rune, reversed) {
    return `<span class="face">${reversed ? '<span class="face-rev">역</span>' : ''}${glyphSVG(rune, reversed)}` +
      `<span><span class="face-name">${esc(rune.ko)}</span><span class="face-en">${esc(rune.en)}</span></span></span>`;
  }

  /* 카드 뒷면: 붉은 초승달과 그 둘레를 도는 여덟 개의 룬 획 */
  const BACK_SVG = (() => {
    const marks = ['M0 -4V4M0 -1L3 -4', 'M-2 -4L2 4M2 -4L-2 4', 'M0 -4V4', 'M0 -4V4M-3 -1L0 -4L3 -1',
      'M2 -4L-2 0L2 4', 'M0 -4V4M0 -4L3 -1.5L0 1', 'M0 -4V4M-2 -1L2 1', 'M0 -4L3 0L0 4L-3 0Z'];
    const ring = marks.map((d, i) => {
      const a = (i / marks.length) * Math.PI * 2 - Math.PI / 2;
      const x = (50 + Math.cos(a) * 34).toFixed(1);
      const y = (75 + Math.sin(a) * 34).toFixed(1);
      return `<path class="b-mark" transform="translate(${x} ${y})" d="${d}"/>`;
    }).join('');
    return '<svg class="card-art back-art" viewBox="0 0 100 150" preserveAspectRatio="none" aria-hidden="true">' +
      '<rect class="b-ground" width="100" height="150"/>' +
      '<rect class="b-frame" x="5" y="5" width="90" height="140" rx="4"/>' +
      '<rect class="b-frame" x="9" y="9" width="82" height="132" rx="2"/>' +
      '<circle class="b-ring" cx="50" cy="75" r="24"/>' +
      '<path class="b-moon" d="M55 58A18 18 0 1 0 66 86A14.5 14.5 0 1 1 55 58Z"/>' +
      ring + '</svg>';
  })();

  /* ── 해설 조각 ─────────────────────── */
  function fortuneHTML(o) {
    return '<dl class="fortune">' +
      FORTUNES.map(([k, label]) => `<dt>${label}</dt><dd>${esc(o[k])}</dd>`).join('') + '</dl>';
  }
  function kwHTML(o) {
    return `<div><p class="sub">키워드</p><ul class="kw">${o.kw.map((k) => `<li>${esc(k)}</li>`).join('')}</ul></div>`;
  }
  function adviceHTML(rune) {
    return `<div><p class="sub">조언</p><blockquote class="advice">${rune.advice.map((a) => `<p>${esc(a)}</p>`).join('')}</blockquote></div>`;
  }
  function extrasHTML(rune) {
    let h = '';
    if (rune.shadow) h += `<div><p class="sub">흐름이 막힐 때 함께 살필 점</p>${fortuneHTML(rune.shadow)}</div>`;
    if (rune.tips) h += `<div class="tips"><p class="sub">${esc(rune.tips.title)}</p><ol>${rune.tips.items.map((t) => `<li>${esc(t)}</li>`).join('')}</ol></div>`;
    return h;
  }
  function tagsHTML(rune, reversed, data) {
    const orient = !rune.reversible ? '<span class="tag">방향 없음</span>'
      : reversed ? '<span class="tag is-rev">역방향</span>' : '<span class="tag">정방향</span>';
    return `<div class="tags">${orient}${data.yn ? `<span class="tag yn">${esc(data.yn)}</span>` : ''}</div>`;
  }

  function readingHTML(pos, label, entry) {
    const { rune, reversed } = entry;
    const data = reversed ? rune.rev : rune.up;
    return `<div class="reading-card">${faceHTML(rune, reversed)}</div>` +
      '<div class="reading-body">' +
      `<p class="pos"><b>${pos}</b>${esc(label)}</p>` +
      `<h3>${esc(rune.ko)} <span>${esc(rune.en)}</span></h3>` +
      tagsHTML(rune, reversed, data) +
      `<p class="desc">${esc(rune.desc)}</p>` +
      kwHTML(data) +
      `<div><p class="sub">${rune.reversible ? (reversed ? '역방향 해석' : '정방향 해석') : '해석'}</p>${fortuneHTML(data)}</div>` +
      extrasHTML(rune) + adviceHTML(rune) +
      '</div>';
  }

  function dialogHTML(rune) {
    const block = (title, data, cls) => '<div class="orient-block">' +
      `<h4>${title}${data.yn ? `<span class="tag yn">${esc(data.yn)}</span>` : ''}</h4>` +
      kwHTML(data) + fortuneHTML(data) + '</div>';
    return '<div class="dialog-head">' +
      `<div class="reading-card">${faceHTML(rune, false)}</div>` +
      `<div><h3 id="dialogTitle">${esc(rune.ko)} <span>${esc(rune.en)}</span></h3>` +
      `<div class="tags"><span class="tag">${rune.reversible ? '정방향 · 역방향' : '방향 없음'}</span></div></div></div>` +
      '<div class="dialog-sections">' +
      `<p class="desc">${esc(rune.desc)}</p>` +
      block(rune.reversible ? '정방향' : '해석', rune.up) +
      (rune.rev ? block('역방향', rune.rev) : '') +
      extrasHTML(rune) + adviceHTML(rune) + '</div>';
  }

  /* ── 상태 ─────────────────────────── */
  const state = { spreadKey: 'three', deck: [], picks: [], flipped: new Set(), question: '' };
  const spread = () => SPREADS[state.spreadKey];

  /* ── 들머리: 배열법 고르기 ─────────── */
  function renderSpreadOptions() {
    $('spreadOptions').innerHTML = Object.entries(SPREADS).map(([key, s]) => {
      const cells = s.mini[1].map(([area, n]) => `<i style="grid-area:${area}">${n}</i>`).join('');
      return `<label class="spread-option"><input type="radio" name="spread" id="spread-${key}" value="${key}"${key === state.spreadKey ? ' checked' : ''}>` +
        '<span class="spread-card">' +
        `<span class="mini" style="grid-template-areas:${esc(s.mini[0])}" aria-hidden="true">${cells}</span>` +
        `<span><strong>${esc(s.name)}</strong><em>${esc(s.sub)}</em><p>${esc(s.intro)}</p></span>` +
        '</span></label>';
    }).join('');
  }

  /* ── 테이블 ───────────────────────── */
  function startReading() {
    const s = spread();
    state.deck = shuffled(RUNES).map((rune) => ({ rune, reversed: rune.reversible && rand(2) === 1 }));
    state.picks = [];
    state.flipped = new Set();

    $('table').hidden = false;
    $('tableActions').hidden = true;
    $('spreadTitle').textContent = `${s.name} · ${s.sub}`;
    const asked = $('asked');
    asked.hidden = !state.question;
    asked.textContent = state.question;

    const deck = $('deck');
    deck.classList.remove('is-done');
    deck.innerHTML = state.deck.map((_, i) =>
      `<button type="button" class="deck-card" style="--i:${i}" data-i="${i}" aria-label="${i + 1}번째 카드 뽑기">${BACK_SVG}</button>`).join('');

    const layout = $('layout');
    layout.dataset.spread = state.spreadKey;
    layout.innerHTML = Object.keys(s.positions).map((p) =>
      `<div class="slot" style="grid-area:p${p}" data-pos="${p}">` +
      `<div class="slot-label"><b>${p}</b>${esc(s.positions[p][0])}</div>` +
      `<div class="slot-hole">${p}</div></div>`).join('');

    $('readings').innerHTML = Object.keys(s.positions).map((p) =>
      `<article class="reading" data-pos="${p}" hidden></article>`).join('');

    updateStatus();
  }

  function updateStatus() {
    const s = spread();
    const left = s.count - state.picks.length;
    let msg;
    if (left > 0) {
      msg = state.picks.length === 0
        ? `질문을 떠올리며 마음이 가는 카드를 ${s.count}장 골라 주세요.`
        : `${left}장 더 골라 주세요.`;
    } else if (state.flipped.size < s.count) {
      msg = '카드를 눌러 뒤집어 보세요.';
    } else {
      msg = s.count > 1 ? '1번 자리부터 차례로 읽어 보세요.' : '룬이 건네는 말을 읽어 보세요.';
    }
    $('status').textContent = msg;
  }

  function pick(i) {
    const s = spread();
    if (state.picks.length >= s.count) return;
    const entry = state.deck[i];
    const pos = s.order[state.picks.length];
    state.picks.push({ pos, entry });

    const slot = $('layout').querySelector(`.slot[data-pos="${pos}"]`);
    slot.querySelector('.slot-hole').outerHTML =
      `<button type="button" class="flip" data-pos="${pos}" aria-label="${pos}번 자리 카드 뒤집기">` +
      `<span class="flip-inner"><span class="side back">${BACK_SVG}</span>` +
      `<span class="side front">${faceHTML(entry.rune, entry.reversed)}</span></span></button>`;

    if (state.picks.length === s.count) {
      $('deck').classList.add('is-done');
      $('tableActions').hidden = false;
      $('flipAll').hidden = s.count === 1;
      const first = $('layout').querySelector('.flip[data-pos="1"]');
      if (first) first.focus({ preventScroll: true });
    }
    updateStatus();
  }

  function flip(pos, quiet) {
    pos = Number(pos);
    if (state.flipped.has(pos)) return;
    const picked = state.picks.find((p) => p.pos === pos);
    if (!picked) return;
    state.flipped.add(pos);

    const btn = $('layout').querySelector(`.flip[data-pos="${pos}"]`);
    btn.classList.add('is-flipped');
    const { rune, reversed } = picked.entry;
    btn.setAttribute('aria-label', `${pos}번 자리: ${rune.ko}${rune.reversible ? (reversed ? ' 역방향' : ' 정방향') : ''}`);

    const article = $('readings').querySelector(`.reading[data-pos="${pos}"]`);
    article.innerHTML = readingHTML(pos, spread().positions[pos][1], picked.entry);
    article.hidden = false;

    updateStatus();
    if (!quiet && state.flipped.size === spread().count) {
      const target = spread().count === 1 ? article : $('readings');
      setTimeout(() => target.scrollIntoView({ block: 'start' }), 700);
    }
  }

  /* ── 도감 ─────────────────────────── */
  function renderLibrary() {
    $('runeGrid').innerHTML = RUNES.map((r, i) =>
      `<button type="button" class="rune-tile" data-i="${i}" aria-label="${esc(r.ko)} ${esc(r.en)} 해설 보기">${faceHTML(r, false)}</button>`).join('');
  }

  /* ── 이벤트 ───────────────────────── */
  $('setup').addEventListener('submit', (e) => {
    e.preventDefault();
    const checked = document.querySelector('input[name="spread"]:checked');
    if (checked) state.spreadKey = checked.value;
    state.question = $('question').value.trim();
    startReading();
    $('table').scrollIntoView({ block: 'start' });
  });

  $('deck').addEventListener('click', (e) => {
    const btn = e.target.closest('.deck-card');
    if (!btn || btn.classList.contains('is-taken')) return;
    btn.classList.add('is-taken');
    btn.disabled = true;
    pick(Number(btn.dataset.i));
  });

  $('layout').addEventListener('click', (e) => {
    const btn = e.target.closest('.flip');
    if (btn) flip(btn.dataset.pos);
  });

  $('flipAll').addEventListener('click', () => {
    const rest = state.picks.map((p) => p.pos).filter((p) => !state.flipped.has(p)).sort((a, b) => a - b);
    rest.forEach((p, i) => setTimeout(() => flip(p, i < rest.length - 1), i * 260));
  });

  $('redraw').addEventListener('click', () => {
    startReading();
    $('table').scrollIntoView({ block: 'start' });
  });

  const dialog = $('runeDialog');
  $('runeGrid').addEventListener('click', (e) => {
    const tile = e.target.closest('.rune-tile');
    if (!tile) return;
    $('dialogBody').innerHTML = dialogHTML(RUNES[Number(tile.dataset.i)]);
    dialog.showModal();
    dialog.scrollTop = 0;
  });
  $('dialogClose').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });

  renderSpreadOptions();
  renderLibrary();
})();
