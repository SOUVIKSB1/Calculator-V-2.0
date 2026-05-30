let str = '';
let fresh = false;
let hist = [];

try {
  hist = JSON.parse(localStorage.getItem('ch') || '[]');
} catch (e) {
  hist = [];
}

const exprEl = document.getElementById('expr');
const previewEl = document.getElementById('preview');

function evaluate(expr) {
  return Function(`"use strict"; return (${expr})`)();
}

function render() {
  exprEl.textContent = toPretty(str) || '0';
  exprEl.classList.remove('error');

  if (str && !fresh) {
    try {
      const v = evaluate(str);

      if (isFinite(v) && /[\+\-\*\/]/.test(str)) {
        previewEl.textContent = '= ' + fmt(v);
      } else {
        previewEl.textContent = '';
      }
    } catch {
      previewEl.textContent = '';
    }
  } else {
    previewEl.textContent = '';
  }
}

function toPretty(s) {
  return s
    .replace(/Math\.sin\(/g, 'sin(')
    .replace(/Math\.cos\(/g, 'cos(')
    .replace(/Math\.tan\(/g, 'tan(')
    .replace(/Math\.log10\(/g, 'log(')
    .replace(/Math\.log\(/g, 'ln(')
    .replace(/Math\.sqrt\(/g, '√(')
    .replace(/Math\.PI/g, 'π')
    .replace(/Math\.E\b/g, 'e')
    .replace(/\*\*2/g, '²')
    .replace(/\*\*/g, '^')
    .replace(/\*/g, '×')
    .replace(/\//g, '÷');
}

function fmt(n) {
  if (!isFinite(n)) return 'Error';

  if (
    Math.abs(n) >= 1e12 ||
    (Math.abs(n) < 1e-7 && n !== 0)
  ) {
    return n.toExponential(4);
  }

  return parseFloat(n.toPrecision(12)).toString();
}

function ins(v) {
  if (fresh) {
    if (['+', '-', '*', '/', '**', '%'].includes(v)) {
      fresh = false;
    } else {
      str = '';
      fresh = false;
    }
  }

  str += v;
  render();
}

function ac() {
  str = '';
  fresh = false;

  exprEl.classList.add('flash');

  setTimeout(() => {
    exprEl.classList.remove('flash');
  }, 300);

  render();
}

function del() {
  if (fresh) {
    ac();
    return;
  }

  const tokens = [
    'Math.sin(',
    'Math.cos(',
    'Math.tan(',
    'Math.log10(',
    'Math.log(',
    'Math.sqrt(',
    'Math.PI',
    'Math.E',
    '**2',
    '**'
  ];

  let done = false;

  for (const t of tokens) {
    if (str.endsWith(t)) {
      str = str.slice(0, -t.length);
      done = true;
      break;
    }
  }

  if (!done) {
    str = str.slice(0, -1);
  }

  render();
}

function calc() {
  if (!str) return;

  let open = (str.match(/\(/g) || []).length;
  let close = (str.match(/\)/g) || []).length;

  while (open > close) {
    str += ')';
    close++;
  }

  try {
    const v = evaluate(str);

    if (!isFinite(v)) {
      showErr('Cannot divide by zero');
      return;
    }

    const r = fmt(v);

    saveHist(str, r);

    exprEl.classList.add('flash');

    setTimeout(() => {
      exprEl.classList.remove('flash');
    }, 400);

    str = r;
    fresh = true;

    exprEl.textContent = r;
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

function saveHist(expression, result) {
  hist.unshift({
    e: toPretty(expression),
    r: result
  });

  if (hist.length > 20) {
    hist.pop();
  }

  try {
    localStorage.setItem('ch', JSON.stringify(hist));
  } catch (e) {}

  renderHist();
}

function renderHist() {
  const ul = document.getElementById('histList');

  if (!hist.length) {
    ul.innerHTML =
      '<li style="color:rgba(255,255,255,.2);font-size:.75rem;list-style:none;text-align:center">No history yet</li>';
    return;
  }

  ul.innerHTML = '';

  hist.forEach(item => {
    const li = document.createElement('li');

    li.innerHTML = `
      <span>${item.e}</span>
      <span class="res">${item.r}</span>
    `;

    li.onclick = () => {
      str = item.r;
      fresh = true;
      render();
    };

    ul.appendChild(li);
  });
}

function clearHist() {
  hist = [];

  try {
    localStorage.removeItem('ch');
  } catch (e) {}

  renderHist();
}

function toggleHist() {
  document
    .getElementById('histPanel')
    .classList.toggle('open');
}

function setMode(m) {
  document
    .getElementById('btnBasic')
    .classList.toggle('active', m === 'basic');

  document
    .getElementById('btnSci')
    .classList.toggle('active', m === 'sci');

  document
    .getElementById('sciPad')
    .classList.toggle('show', m === 'sci');
}

document.querySelectorAll('.btn').forEach(btn => {
  btn.addEventListener('click', e => {
    const ripple = document.createElement('span');

    ripple.className = 'ripple';

    const size = Math.max(
      btn.offsetWidth,
      btn.offsetHeight
    );

    const rect = btn.getBoundingClientRect();

    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${e.clientY - rect.top - size / 2}px`;

    btn.appendChild(ripple);

    setTimeout(() => ripple.remove(), 500);
  });
});

document.addEventListener('keydown', e => {
  const k = e.key;

  if (k >= '0' && k <= '9') {
    ins(k);
    kFlash(k);
  } else if (k === '+') {
    ins('+');
    kFlash('+');
  } else if (k === '-') {
    ins('-');
    kFlash('−');
  } else if (k === '*') {
    ins('*');
    kFlash('×');
  } else if (k === '/') {
    e.preventDefault();
    ins('/');
    kFlash('÷');
  } else if (k === '%') {
    ins('%');
    kFlash('%');
  } else if (k === '.') {
    ins('.');
    kFlash('.');
  } else if (k === '(' || k === ')') {
    ins(k);
  } else if (k === 'Enter' || k === '=') {
    calc();
    kFlash('=');
  } else if (k === 'Backspace') {
    del();
  } else if (k === 'Escape') {
    ac();
  }
});

function kFlash(label) {
  document.querySelectorAll('.btn').forEach(btn => {
    if (btn.textContent.trim() === label) {
      btn.classList.add('key-flash');

      setTimeout(() => {
        btn.classList.remove('key-flash');
      }, 160);
    }
  });
}

renderHist();
render();
