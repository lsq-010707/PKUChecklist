'use strict';
// DOM helpers and checklist state
const STATUS = Object.freeze({
  CONFIRMED: '确认',
  PROBABLE: '可能',
  UNLABELED: '未标注',
});
const $ = (id) => document.getElementById(id);
let birds = [],
  records = [],
  active = '';
const status = (b) => b.status.trim() || STATUS.UNLABELED;

// Text escaping, CSV parsing and evidence URL validation
const h = (s) =>
  String(s ?? '').replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ],
  );
function parseCSV(text) {
  const rows = [];
  let row = [],
    cell = '',
    quoted = false;
  text = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (quoted || cell === '') quoted = !quoted;
      else throw Error('CSV 引号格式错误');
    } else if (!quoted && (c === ',' || c === '\n' || c === '\r')) {
      row.push(cell);
      cell = '';
      if (c !== ',') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        rows.push(row);
        row = [];
      }
    } else cell += c;
  }
  if (quoted) throw Error('CSV 引号未闭合');
  if (cell !== '' || row.length) {
    row.push(cell);
    rows.push(row);
  }
  const headers = rows.shift() || [];
  if (new Set(headers).size !== headers.length) throw Error('CSV 表头重复');
  return {
    headers,
    rows: rows
      .filter((r) => r.some((v) => v !== ''))
      .map((r, i) => {
        if (r.length !== headers.length)
          throw Error(`CSV 第 ${i + 2} 行列数不正确`);
        return Object.fromEntries(headers.map((k, j) => [k, r[j]]));
      }),
  };
}
function mediaURL(raw) {
  if (!raw) return null;
  try {
    if (/^[a-z][a-z\d+.-]*:/i.test(raw))
      return /^https?:/i.test(raw) ? new URL(raw) : null;
    if (
      raw.includes('\\') ||
      raw.startsWith('/') ||
      raw.split('/').some((p) => {
        try {
          return decodeURIComponent(p) === '..';
        } catch {
          return true;
        }
      })
    )
      return null;
    return new URL(raw, location.href);
  } catch {
    return null;
  }
}
// Filter options and species list
function options(id, values, title) {
  const el = $(id),
    old = el.value;
  el.replaceChildren(
    new Option(title, ''),
    ...values.map((v) => new Option(v, v)),
  );
  el.value = values.includes(old) ? old : '';
}
function updateFamilies() {
  options(
    'family',
    [
      ...new Set(
        birds
          .filter((b) => !$('order').value || b.order === $('order').value)
          .map((b) => b.family),
      ),
    ],
    '全部科',
  );
}
function render() {
  const q = $('search').value.trim().toLocaleLowerCase();
  const result = birds.filter(
    (b) =>
      (!active || status(b) === active) &&
      (!$('order').value || b.order === $('order').value) &&
      (!$('family').value || b.family === $('family').value) &&
      Object.values(b).join(' ').toLocaleLowerCase().includes(q),
  );
  result.sort((a, b) => Number(a.taxon_id) - Number(b.taxon_id));
  $('count').textContent = `显示 ${result.length} / ${birds.length} 个条目`;
  $('list').innerHTML = result.length
    ? result
        .map(
          (b) =>
            `<button class="speciesrow" data-id="${h(b.taxon_id)}"><span><span class="speciesName"><small>${h(b.taxon_id)}</small>${h(b.cn_name)}</span><span class="scientific">${h(b.sci_name)}</span><span class="noteSmall">${h(b.en_name)}</span></span><span class="taxo">${h(b.family)}<span>${h(b.order)}</span></span><span class="status status-${h(status(b))}">${h(status(b))}</span><span>›</span></button>`,
        )
        .join('')
    : '<div class="empty">没有符合条件的物种。</div>';
  document.querySelectorAll('#states button').forEach((b) => {
    b.classList.toggle('selected', b.dataset.status === active);
    b.setAttribute('aria-pressed', String(b.dataset.status === active));
  });
}
// Evidence and species details
function evidence(raw, name) {
  const u = mediaURL(raw);
  if (!u) return raw ? '<p>证据地址无效，暂无法打开。</p>' : '';
  const ext = u.pathname.split('.').pop().toLowerCase();
  const src = h(u.href);
  return (
    `<p><a href="${src}" target="_blank" rel="noopener noreferrer">查看证据 ↗</a></p>` +
    (/^(jpg|jpeg|png|gif|webp)$/.test(ext)
      ? `<img src="${src}" alt="${h(name)}的记录照片" loading="lazy">`
      : /^(mp3|wav|ogg|m4a)$/.test(ext)
        ? `<audio controls preload="none" src="${src}">浏览器不支持音频，请使用证据链接。</audio>`
        : '')
  );
}
function show(id) {
  const b = birds.find((b) => b.taxon_id === id);
  if (!b) return;
  const rr = records
    .filter((r) => r.taxon_id === id)
    .sort((a, b) =>
      a.date
        .replace(/年|月/g, '-')
        .replace('日', '')
        .localeCompare(b.date.replace(/年|月/g, '-').replace('日', '')),
    );
  $('content').innerHTML =
    `<div class="detailOrder">${h(b.order)} / ${h(b.family)}</div><h2 id="detailName" class="detailName">${h(b.cn_name)}</h2><p class="detailLatin">${h(b.sci_name)}</p><p>${h(b.en_name)}</p><span class="status status-${h(status(b))}">${h(status(b))}</span><p class="noteSmall">物种编号 ${h(b.taxon_id)}</p><section class="detailSection"><h3>状态说明与概述</h3><p class="remarks">${h(b.remarks || '暂无补充说明。')}</p></section>${rr.length ? `<section class="detailSection"><h3>重要记录</h3>${rr.map((r) => `<article class="record"><h4>${h(r.date)} ${h(r.location)}</h4><p>${h(r.description)}</p><p>观察者：${h(r.observer)}</p>${r.note ? `<p>备注：${h(r.note)}</p>` : ''}${evidence(r.evidence, b.cn_name)}<small>记录编号：${h(r.record_id)}</small></article>`).join('')}</section>` : ''}`;
  if (!$('detail').open) $('detail').showModal();
  document.body.style.overflow = 'hidden';
}
// Hash routing
function route() {
  const id = new URLSearchParams(location.hash.slice(1)).get('species');
  if (id) show(id);
  else if ($('detail').open) $('detail').close();
}
// CSV validation and summary rendering
function validateData(data) {
  const required = [
    [
      'taxon_id',
      'order',
      'family',
      'cn_name',
      'sci_name',
      'en_name',
      'status',
      'remarks',
      'avibase_code',
    ],
    [
      'record_id',
      'taxon_id',
      'cn_name',
      'date',
      'location',
      'observer',
      'description',
      'evidence',
      'note',
    ],
  ];
  data.forEach((d, i) => {
    if (!required[i].every((k) => d.headers.includes(k)))
      throw Error('CSV 缺少必要列');
  });
  [birds, records] = data.map((d) => d.rows);
  const ids = new Set();
  birds.forEach((b) => {
    if (!/^\d+$/.test(b.taxon_id) || ids.has(b.taxon_id))
      throw Error('物种编号无效或重复');
    ids.add(b.taxon_id);
  });
  const recordIds = new Set();
  records.forEach((r) => {
    if (!ids.has(r.taxon_id) || recordIds.has(r.record_id))
      throw Error('记录关联无效或记录编号重复');
    recordIds.add(r.record_id);
  });
  birds.sort((a, b) => Number(a.taxon_id) - Number(b.taxon_id));
}

function renderStats() {
  $('stats').innerHTML = [
    [birds.length, '物种条目'],
    [
      birds.filter((b) =>
        [STATUS.CONFIRMED, STATUS.PROBABLE].includes(status(b)),
      ).length,
      '校园物种数',
    ],
    [new Set(birds.map((b) => b.family)).size, '科'],
  ]
    .map(
      ([n, t]) =>
        `<div><div class="statnum">${n}</div><div class="statcaption">${t}</div></div>`,
    )
    .join('');
}

function renderStateFilters() {
  const states = [...new Set(birds.map(status))];
  $('states').innerHTML = ['', ...states]
    .map(
      (s) =>
        `<button class="statefilter" data-status="${h(s)}">${h(s || '全部')}<span class="sCount">${s ? birds.filter((b) => status(b) === s).length : birds.length}</span></button>`,
    )
    .join('');
}

// Data loading and initialization
async function init() {
  try {
    const data = await Promise.all(
      ['PKUChecklist.csv', 'PKURecords.csv'].map(async (file) => {
        const res = await fetch(file, { cache: 'no-cache' });
        if (!res.ok) throw Error(`${file}: HTTP ${res.status}`);
        return parseCSV(await res.text());
      }),
    );
    validateData(data);
    renderStats();
    renderStateFilters();
    options('order', [...new Set(birds.map((b) => b.order))], '全部目');
    updateFamilies();
    render();
    route();
  } catch (e) {
    $('count').textContent = '数据读取失败';
    $('error').textContent =
      `${e.message}。请通过 HTTP 网站访问，检查两个 CSV 是否与 index.html 位于同一目录。`;
  }
}
// User interactions
function bindEvents() {
  $('states').onclick = (e) => {
    const b = e.target.closest('button');
    if (b) {
      active = b.dataset.status;
      render();
    }
  };
  $('order').onchange = () => {
    updateFamilies();
    render();
  };
  $('family').onchange = render;
  $('search').oninput = render;
  $('reset').onclick = () => {
    active = '';
    $('search').value = '';
    $('order').value = '';
    updateFamilies();
    $('family').value = '';
    render();
  };
  $('list').onclick = (e) => {
    const b = e.target.closest('[data-id]');
    if (b) location.hash = 'species=' + encodeURIComponent(b.dataset.id);
  };
  $('close').onclick = () => $('detail').close();
  $('detail').onclick = (e) => {
    if (e.target === $('detail')) {
      const r = $('detail').getBoundingClientRect();
      if (
        e.clientX < r.left ||
        e.clientX > r.right ||
        e.clientY < r.top ||
        e.clientY > r.bottom
      )
        $('detail').close();
    }
  };
  $('detail').addEventListener('close', () => {
    document.body.style.overflow = '';
    history.replaceState(null, '', location.pathname + location.search);
  });
  window.addEventListener('hashchange', route);
}

bindEvents();
init();
