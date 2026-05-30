let str   = '';       // raw expression string
let fresh = false;    // true right after = was pressed
let hist  = [];

try { hist = JSON.parse(localStorage.getItem('ch') || '[]'); } catch(e){ hist=[]; }

const exprEl    = document.getElementById('expr');
const previewEl = document.getElementById('preview');

/* ── Render display ── */
function render() {
  exprEl.textContent = toPretty(str) || '0';
  exprEl.classList.remove('error');

  // Live preview while typing
  if (str && !fresh) {
    try {
      const v = Function('"use strict";return(' + str + ')')();
      if (isFinite(v) && /[\+\-\*\/]/.test(str)) {
        previewEl.textContent = '= ' + fmt(v);
      } else {
        previewEl.textContent = '';
      }
    } catch { previewEl.textContent = ''; }
  } else {
    previewEl.textContent = '';
  }
}

/* Converts raw expression to human-readable symbols */
function toPretty(s) {
  return s
    .replace(/Math\.sin\(/g,  'sin(')
    .replace(/Math\.cos\(/g,  'cos(')
    .replace(/Math\.tan\(/g,  'tan(')
    .replace(/Math\.log10\(/g,'log(')
    .replace(/Math\.log\(/g,  'ln(')
    .replace(/Math\.sqrt\(/g, '√(')
    .replace(/Math\.PI/g,     'π')
    .replace(/Math\.E\b/g,    'e')
    .replace(/\*\*2/g,        '²')
    .replace(/\*\*/g,         '^')
    .replace(/\*/g,           '×')
    .replace(/\//g,           '÷');
}

/* Smart number formatter */
function fmt(n) {
  if (!isFinite(n)) return 'Error';
  if (Math.abs(n) >= 1e12 || (Math.abs(n) < 1e-7 && n !== 0))
    return n.toExponential(4);
  return parseFloat(n.toPrecision(12)).toString();
}

/* ── Insert value into expression ── */
function ins(v) {
  if (fresh) {
    // Chain result into a new operation, or start fresh
    if (['+','-','*','/','**','%'].includes(v)) { fresh = false; }
    else { str = ''; fresh = false; }
  }
  str += v;
  render();
}

/* ── All Clear ── */
function ac() {
  str = ''; fresh = false;
  exprEl.classList.add('flash');
  setTimeout(() => exprEl.classList.remove('flash'), 300);
  render();
}

/* ── Delete last character / token ── */
function del() {
  if (fresh) { ac(); return; }
  // Remove multi-char tokens as one unit
  const tokens = [
    'Math.sin(','Math.cos(','Math.tan(',
    'Math.log10(','Math.log(','Math.sqrt(',
    'Math.PI','Math.E','**2','**'
  ];
  let done = false;
  for (const t of tokens) {
    if (str.endsWith(t)) { str = str.slice(0, -t.length); done = true; break; }
  }
  if (!done) str = str.slice(0, -1);
  render();
}

/* ── Calculate ── */
function calc() {
  if (!str) return;

  // Auto-close unclosed parentheses
  let open  = (str.match(/\(/g) || []).length;
  let close = (str.match(/\)/g) || []).length;
  while (open > close) { str += ')'; close++; }

  try {
    const v = Function('"use strict";return(' + str + ')')();
    if (!isFinite(v)) { showErr('Cannot divide by zero'); return; }

    const r = fmt(v);
    saveHist(str, r);

    exprEl.classList.add('flash');
    setTimeout(() => exprEl.classList.remove('flash'), 400);

    str   = r;
    fresh = true;
    exprEl.textContent  = r;
    previewEl.textContent = '';
  } catch {
    showErr('Syntax Error');
  }
}

function showErr(msg) {
  exprEl.textContent = msg;
  exprEl.classList.add('error');
  setTimeout(() => {
    exprEl.classList.remove('error');
    render();
  }, 2000);
}

/* ── History ── */
function saveHist(expression, result) {
  hist.unshift({ e: toPretty(expression), r: result });
  if (hist.length > 20) hist.pop();
  try { localStorage.setItem('ch', JSON.stringify(hist)); } catch(e) {}
  renderHist();
}

function renderHist() {
  const ul = document.getElementById('histList');
  if (!hist.length) {
    ul.innerHTML = '<li style="color:rgba(255,255,255,.2);font-size:.75rem;list-style:none;text-align:center">No history yet</li>';
    return;
  }
  ul.innerHTML = '';
  hist.forEach(item => {
    const li = document.createElement('li');
    li.innerHTML = `<span>${item.e}</span><span class="res">${item.r}</span>`;
    li.onclick = () => { str = item.r; fresh = true; render(); };
    ul.appendChild(li);
  });
}

function clearHist() {
  hist = [];
  try { localStorage.removeItem('ch'); } catch(e) {}
  renderHist();
}

function toggleHist() {
  document.getElementById('histPanel').classList.toggle('open');
}

/* ── Mode switch ── */
function setMode(m) {
  document.getElementById('btnBasic').classList.toggle('active', m === 'basic');
  document.getElementById('btnSci').classList.toggle('active',   m === 'sci');
  document.getElementById('sciPad').classList.toggle('show',     m === 'sci');
}

/* ── Ripple effect on every .btn ── */
document.querySelectorAll('.btn').forEach(b => {
  b.addEventListener('click', e => {
    const rip = document.createElement('span');
    rip.className = 'ripple';
    const sz = Math.max(b.offsetWidth, b.offsetHeight);
    const rect = b.getBoundingClientRect();
    rip.style.cssText = `
      width:${sz}px; height:${sz}px;
      left:${e.clientX - rect.left - sz/2}px;
      top:${e.clientY - rect.top  - sz/2}px;
    `;
    b.appendChild(rip);
    setTimeout(() => rip.remove(), 500);
  });
});

/* ── Full keyboard support ── */
document.addEventListener('keydown', e => {
  const k = e.key;
  if (k >= '0' && k <= '9')        { ins(k);   kFlash(k); }
  else if (k === '+')               { ins('+'); kFlash('+'); }
  else if (k === '-')               { ins('-'); kFlash('−'); }
  else if (k === '*')               { ins('*'); kFlash('×'); }
  else if (k === '/')               { e.preventDefault(); ins('/'); kFlash('÷'); }
  else if (k === '%')               { ins('%'); kFlash('%'); }
  else if (k === '.')               { ins('.'); kFlash('.'); }
  else if (k === '(' || k === ')')  { ins(k); }
  else if (k === 'Enter' || k === '=') { calc(); kFlash('='); }
  else if (k === 'Backspace')       { del(); }
  else if (k === 'Escape')          { ac(); }
});

function kFlash(label) {
  document.querySelectorAll('.btn').forEach(b => {
    if (b.textContent.trim() === label) {
      b.classList.add('key-flash');
      setTimeout(() => b.classList.remove('key-flash'), 160);
    }
  });
}

/* ── Init ── */
renderHist();
render();
