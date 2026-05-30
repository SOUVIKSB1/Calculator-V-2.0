
// ---- State ----
let expr       = '';
let justCalced = false;
let history    = JSON.parse(localStorage.getItem('calc_history') || '[]');
let currentMode = 'basic';

const exprBox   = document.getElementById('exprBox');
const resultBox = document.getElementById('resultBox');
const histList  = document.getElementById('historyList');

// ---- Init ----
renderHistory();

// ---- Core Display ----
function updateDisplay(value) {
  // Beautify: replace raw operators with symbols in display
  const pretty = value
    .replace(/\*/g, '×')
    .replace(/\//g, '÷')
    .replace(/Math\.sin\(/g, 'sin(')
    .replace(/Math\.cos\(/g, 'cos(')
    .replace(/Math\.tan\(/g, 'tan(')
    .replace(/Math\.log10\(/g, 'log(')
    .replace(/Math\.log\(/g, 'ln(')
    .replace(/Math\.sqrt\(/g, '√(')
    .replace(/Math\.PI/g, 'π')
    .replace(/Math\.E/g, 'e')
    .replace(/\*\*2/g, '²')
    .replace(/\*\*/g, '^');

  exprBox.textContent = pretty || '0';
  exprBox.classList.remove('error');

  // Live preview
  if (expr && !justCalced) {
    try {
      const preview = Function('"use strict"; return (' + expr + ')')();
      if (isFinite(preview) && expr.match(/[\+\-\*\/\^]/)) {
        resultBox.textContent = '= ' + formatNum(preview);
      } else {
        resultBox.textContent = '';
      }
    } catch {
      resultBox.textContent = '';
    }
  } else {
    resultBox.textContent = '';
  }
}

function formatNum(n) {
  if (Math.abs(n) >= 1e12 || (Math.abs(n) < 1e-6 && n !== 0)) {
    return n.toExponential(4);
  }
  const s = parseFloat(n.toPrecision(12));
  return s.toString();
}

// ---- Input ----
function appendToExpr(val) {
  // If user starts typing after a result, clear (unless operator)
  if (justCalced) {
    if (['+', '-', '*', '/', '%', '**'].includes(val)) {
      justCalced = false;
    } else {
      expr = '';
      justCalced = false;
    }
  }
  expr += val;
  updateDisplay(expr);
  rippleLastClicked();
}

function appendSci(val) {
  if (justCalced) {
    if (['**', '%'].includes(val)) {
      // attach to result
      justCalced = false;
    } else {
      expr = '';
      justCalced = false;
    }
  }
  expr += val;
  updateDisplay(expr);
}

function clearAll() {
  expr = '';
  justCalced = false;
  exprBox.classList.remove('error');
  exprBox.classList.add('flash');
  setTimeout(() => exprBox.classList.remove('flash'), 300);
  updateDisplay('');
}

function deleteLast() {
  if (justCalced) { clearAll(); return; }
  // Remove last token intelligently
  const tokens = [
    'Math.sin(', 'Math.cos(', 'Math.tan(',
    'Math.log10(', 'Math.log(', 'Math.sqrt(',
    'Math.PI', 'Math.E', '**2', '**'
  ];
  let deleted = false;
  for (const tok of tokens) {
    if (expr.endsWith(tok)) {
      expr = expr.slice(0, -tok.length);
      deleted = true;
      break;
    }
  }
  if (!deleted) expr = expr.slice(0, -1);
  updateDisplay(expr);
}

function calculate() {
  if (!expr) return;

  // Auto-close unclosed parens
  let open = (expr.match(/\(/g) || []).length;
  let close = (expr.match(/\)/g) || []).length;
  while (open > close) { expr += ')'; close++; }

  try {
    const result = Function('"use strict"; return (' + expr + ')')();

    if (!isFinite(result)) {
      showError('Cannot divide by zero');
      return;
    }

    const formatted = formatNum(result);

    // Save to history
    saveHistory(expr, formatted);

    // Animate result
    exprBox.classList.add('flash');
    setTimeout(() => exprBox.classList.remove('flash'), 400);

    expr = formatted;
    justCalced = true;
    exprBox.textContent = formatted;
    resultBox.textContent = '';
  } catch (e) {
    showError('Syntax Error');
  }
}

function showError(msg) {
  exprBox.textContent = msg;
  exprBox.classList.add('error');
  setTimeout(() => {
    if (exprBox.classList.contains('error')) {
      exprBox.classList.remove('error');
      updateDisplay(expr);
    }
  }, 1800);
}

// ---- History ----
function saveHistory(expression, result) {
  const pretty = expression
    .replace(/Math\.sin\(/g, 'sin(')
    .replace(/Math\.cos\(/g, 'cos(')
    .replace(/Math\.tan\(/g, 'tan(')
    .replace(/Math\.log10\(/g, 'log(')
    .replace(/Math\.log\(/g, 'ln(')
    .replace(/Math\.sqrt\(/g, '√(')
    .replace(/Math\.PI/g, 'π')
    .replace(/Math\.E/g, 'e')
    .replace(/\*\*/g, '^')
    .replace(/\*/g, '×')
    .replace(/\//g, '÷');

  history.unshift({ expr: pretty, result });
  if (history.length > 20) history.pop();
  localStorage.setItem('calc_history', JSON.stringify(history));
  renderHistory();
}

function renderHistory() {
  histList.innerHTML = '';
  if (history.length === 0) {
    histList.innerHTML = '<li style="color:rgba(255,255,255,0.2);font-size:0.75rem;justify-content:center;">No history yet</li>';
    return;
  }
  history.forEach((item, i) => {
    const li = document.createElement('li');
    li.innerHTML = `<span>${item.expr}</span><span class="res">${item.result}</span>`;
    li.title = 'Tap to reuse result';
    li.addEventListener('click', () => {
      expr = item.result;
      justCalced = true;
      updateDisplay(expr);
    });
    histList.appendChild(li);
  });
}

function clearHistory() {
  history = [];
  localStorage.removeItem('calc_history');
  renderHistory();
}

function toggleHistory() {
  const panel = document.getElementById('historyPanel');
  panel.classList.toggle('open');
}

// ---- Mode ----
function setMode(mode) {
  currentMode = mode;
  const sciPad  = document.getElementById('sciPad');
  const btnBasic = document.getElementById('btn-basic');
  const btnSci   = document.getElementById('btn-sci');

  if (mode === 'sci') {
    sciPad.classList.add('visible');
    btnSci.classList.add('active');
    btnBasic.classList.remove('active');
  } else {
    sciPad.classList.remove('visible');
    btnBasic.classList.add('active');
    btnSci.classList.remove('active');
  }
}

// ---- Ripple Effect ----
let lastClickedBtn = null;
document.querySelectorAll('.btn').forEach(btn => {
  btn.addEventListener('click', function (e) {
    lastClickedBtn = this;
    const ripple = document.createElement('span');
    ripple.classList.add('ripple');
    const size = Math.max(this.offsetWidth, this.offsetHeight);
    ripple.style.width = ripple.style.height = size + 'px';
    const rect = this.getBoundingClientRect();
    ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
    ripple.style.top  = (e.clientY - rect.top  - size / 2) + 'px';
    this.appendChild(ripple);
    setTimeout(() => ripple.remove(), 500);
  });
});

function rippleLastClicked() {
  // handled by click listener above
}

// ---- Keyboard Support ----
document.addEventListener('keydown', (e) => {
  if (e.key >= '0' && e.key <= '9') { appendToExpr(e.key); highlightBtn(e.key); }
  else if (e.key === '+') { appendToExpr('+'); highlightBtn('+'); }
  else if (e.key === '-') { appendToExpr('-'); highlightBtn('-'); }
  else if (e.key === '*') { appendToExpr('*'); highlightBtn('*'); }
  else if (e.key === '/') { e.preventDefault(); appendToExpr('/'); highlightBtn('/'); }
  else if (e.key === '%') { appendToExpr('%'); }
  else if (e.key === '.') { appendToExpr('.'); }
  else if (e.key === 'Enter' || e.key === '=') { calculate(); highlightBtn('='); }
  else if (e.key === 'Backspace') { deleteLast(); }
  else if (e.key === 'Escape') { clearAll(); }
  else if (e.key === '(') { appendToExpr('('); }
  else if (e.key === ')') { appendToExpr(')'); }
});

function highlightBtn(key) {
  document.querySelectorAll('.btn').forEach(btn => {
    const t = btn.textContent.trim();
    // Match visual labels to key
    const match =
      t === key ||
      (key === '*' && t === '×') ||
      (key === '/' && t === '÷') ||
      (key === '-' && t === '−') ||
      (key === '=' && t === '=') ||
      (key === 'Enter' && t === '=');
    if (match) {
      btn.classList.add('key-active');
      setTimeout(() => btn.classList.remove('key-active'), 150);
    }
  });
}

// Extra CSS for key highlight (injected once)
const kStyle = document.createElement('style');
kStyle.textContent = `.key-active { outline: 2px solid var(--neon-gold) !important; outline-offset: 2px; }`;
document.head.appendChild(kStyle);
