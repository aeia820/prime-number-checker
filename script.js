const $ = (selector) => document.querySelector(selector);
const form = $('#prime-form');
const input = $('#number-input');
const error = $('#error-message');
const result = $('#result');
const nearbyArea = $('#nearby-area');
const visualizationArea = $('#visualization-area');
const MAX = 1_000_000_000_000;
const HISTORY_KEY = 'prime-check-history-v1';

function readHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); }
  catch { return []; }
}

function renderHistory() {
  const list = $('#history-list');
  const history = readHistory();
  list.replaceChildren();
  if (!history.length) {
    const empty = document.createElement('li');
    empty.className = 'empty-state';
    empty.textContent = 'まだ判定履歴はありません。';
    list.appendChild(empty);
    return;
  }
  history.forEach((entry) => {
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.href = '#number-input';
    link.dataset.number = entry.number;
    const value = document.createElement('strong');
    value.textContent = Number(entry.number).toLocaleString('ja-JP');
    const status = document.createElement('span');
    status.className = entry.prime ? 'history-prime' : '';
    status.textContent = entry.prime ? '素数' : '素数ではない';
    const date = document.createElement('time');
    date.dateTime = entry.checkedAt;
    date.textContent = new Intl.DateTimeFormat('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(entry.checkedAt));
    link.append(value, status, date);
    item.appendChild(link);
    list.appendChild(item);
  });
}

function saveHistory(number, prime) {
  const history = readHistory();
  history.unshift({ number, prime, checkedAt: new Date().toISOString() });
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 10))); } catch { /* Storage may be disabled. */ }
  renderHistory();
}

function isPrime(number) {
  if (number < 2) return false;
  if (number === 2) return true;
  if (number % 2 === 0) return false;
  for (let i = 3; i <= Math.sqrt(number); i += 2) if (number % i === 0) return false;
  return true;
}

function getDivisors(number) {
  const lower = [], upper = [];
  for (let i = 1; i <= Math.sqrt(number); i += 1) {
    if (number % i === 0) { lower.push(i); if (i !== number / i) upper.push(number / i); }
  }
  return lower.concat(upper.reverse());
}

function getFactorPairs(number) {
  const pairs = [];
  for (let i = 1; i <= Math.sqrt(number); i += 1) if (number % i === 0) pairs.push([i, number / i]);
  return pairs;
}

function getPrimeFactors(number) {
  const factors = [];
  let remaining = number;
  for (let divisor = 2; divisor <= Math.sqrt(remaining); divisor += divisor === 2 ? 1 : 2) {
    let exponent = 0;
    while (remaining % divisor === 0) { remaining /= divisor; exponent += 1; }
    if (exponent) factors.push([divisor, exponent]);
  }
  if (remaining > 1) factors.push([remaining, 1]);
  return factors;
}

function toSuperscript(number) {
  const digits = '⁰¹²³⁴⁵⁶⁷⁸⁹';
  return String(number).split('').map((digit) => digits[Number(digit)]).join('');
}

function parseInput(value) {
  const normalized = value.trim().replaceAll(',', '').replaceAll('，', '');
  if (!/^\d+$/.test(normalized)) return { error: '半角数字で整数を入力してください。' };
  const number = Number(normalized);
  if (number < 1 || number > MAX) return { error: '1〜1,000,000,000,000の範囲で入力してください。' };
  return { number };
}

function findPreviousPrime(number) {
  for (let candidate = number - 1; candidate >= 2; candidate -= 1) if (isPrime(candidate)) return candidate;
  return null;
}

function findNextPrime(number) {
  for (let candidate = number + 1; ; candidate += 1) if (isPrime(candidate)) return candidate;
}

function renderNearbyIntegers(number) {
  const body = $('#nearby-body');
  body.replaceChildren();
  let displayedCount = 0;
  for (let offset = -5; offset <= 5; offset += 1) {
    const value = number + offset;
    if (value <= 0) continue;
    const prime = isPrime(value);
    const row = document.createElement('tr');
    if (prime) row.className = 'is-prime';
    const position = offset === 0 ? '現在値' : `現在値${offset > 0 ? '+' : ''}${offset}`;
    [position, value.toLocaleString('ja-JP'), prime ? '素数' : '素数ではない'].forEach((text) => {
      const cell = document.createElement('td'); cell.textContent = text; row.appendChild(cell);
    });
    body.appendChild(row);
    displayedCount += 1;
  }
  $('#nearby-count').textContent = `現在値を含む前後5件（計${displayedCount}件）`;
}

function renderPrimeGap(number) {
  const previous = findPreviousPrime(number);
  const next = findNextPrime(number);
  $('#previous-prime').textContent = previous === null ? '—' : previous.toLocaleString('ja-JP');
  $('#previous-gap').textContent = previous === null ? 'これより前に素数はありません' : `現在値との差：${(number - previous).toLocaleString('ja-JP')}`;
  $('#next-prime').textContent = next.toLocaleString('ja-JP');
  $('#next-gap').textContent = `現在値との差：${(next - number).toLocaleString('ja-JP')}`;
  $('#prime-gap').textContent = previous === null ? '—' : `${(next - previous).toLocaleString('ja-JP')}`;
  $('#gap-note').textContent = previous === null ? '素数間隔は、前後に素数が存在するときに計算できます。' : `${previous.toLocaleString('ja-JP')} から ${next.toLocaleString('ja-JP')} までの間隔です。`;
}

function renderVisualization(number) {
  const start = Math.max(1, number - 20);
  const end = Math.min(MAX, number + 20);
  const chart = $('#prime-chart');
  chart.replaceChildren();
  const relativeScale = String(number).length >= 4;
  chart.classList.toggle('uses-relative-scale', relativeScale);
  chart.style.gridTemplateColumns = `repeat(${end - start + 1}, minmax(0, 1fr))`;
  for (let value = start; value <= end; value += 1) {
    const point = document.createElement('div');
    point.className = 'chart-point';
    const prime = isPrime(value);
    if (prime) point.classList.add('is-prime');
    if (value === number) point.classList.add('is-current');
    point.title = `${value.toLocaleString('ja-JP')}：${prime ? '素数' : '素数ではない'}${value === number ? '（現在値）' : ''}`;
    const bar = document.createElement('span'); bar.className = 'chart-bar';
    const label = document.createElement('span');
    label.className = 'chart-label';
    const offset = value - number;
    label.textContent = relativeScale ? (offset === 0 ? '±0' : `${offset > 0 ? '+' : ''}${offset}`) : value.toLocaleString('ja-JP');
    point.append(bar, label); chart.appendChild(point);
  }
  $('#visualization-range').textContent = relativeScale ? `現在値 ${number.toLocaleString('ja-JP')} を基準に ±20` : `${start.toLocaleString('ja-JP')}〜${end.toLocaleString('ja-JP')}`;
  chart.setAttribute('aria-label', `${start}から${end}までの素数分布。赤色が素数、枠線が現在値です。`);
  visualizationArea.hidden = false;
}

function renderFactorDetails(number, formatted) {
  const pairs = getFactorPairs(number);
  $('#factor-count').textContent = `${pairs.length}パターン`;
  const factorList = $('#factor-list'); factorList.replaceChildren();
  pairs.forEach(([left, right]) => {
    const item = document.createElement('div');
    item.textContent = `${formatted} = ${left.toLocaleString('ja-JP')} × ${right.toLocaleString('ja-JP')}`;
    factorList.appendChild(item);
  });
  const factors = getPrimeFactors(number);
  if (number === 1) {
    $('#prime-factor-expression').textContent = '1';
    $('#prime-factor-note').textContent = '1は素因数を持ちません。';
  } else {
    const expression = factors.map(([factor, exponent]) => `${factor.toLocaleString('ja-JP')}${exponent > 1 ? toSuperscript(exponent) : ''}`).join(' × ');
    $('#prime-factor-expression').textContent = `${formatted} = ${expression}`;
    $('#prime-factor-note').textContent = factors.length === 1 && factors[0][1] === 1 ? '素数なので、素因数はその数自身だけです。' : '素数だけの積に分解した標準形です。';
  }
}

function showResult(number) {
  const divisors = getDivisors(number);
  const prime = isPrime(number);
  const formatted = number.toLocaleString('ja-JP');
  result.hidden = false;
  result.className = `result ${prime ? 'prime' : 'composite'}`;
  $('#result-icon').textContent = prime ? '✓' : '÷';
  $('#result-kicker').textContent = prime ? 'PRIME NUMBER' : 'NOT A PRIME NUMBER';
  $('#result-title').textContent = prime ? `${formatted} は素数です` : `${formatted} は素数ではありません`;
  $('#result-description').textContent = prime ? '1とその数自身だけで割り切れます。' : number === 1 ? '1は、素数にも合成数にも分類されません。' : '1とその数自身以外の整数でも割り切れます。';

  const divisorArea = $('#divisor-area');
  divisorArea.hidden = prime;
  const divisorList = $('#divisor-list'); divisorList.replaceChildren();
  if (!prime) {
    $('#divisor-count').textContent = `${divisors.length}個`;
    divisors.forEach((value) => { const chip = document.createElement('span'); chip.textContent = value.toLocaleString('ja-JP'); divisorList.appendChild(chip); });
  }

  saveHistory(number, prime);
  renderFactorDetails(number, formatted);
  renderNearbyIntegers(number);
  renderPrimeGap(number);
  renderVisualization(number);
  nearbyArea.hidden = false;
  result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function activateTab(button) {
  const group = button.dataset.tabGroup;
  document.querySelectorAll(`[data-tab-group="${group}"]`).forEach((tab) => {
    const active = tab === button;
    tab.classList.toggle('is-active', active);
    tab.setAttribute('aria-selected', String(active));
    $(`#${tab.dataset.tabTarget}`).hidden = !active;
  });
}

document.querySelectorAll('.tab').forEach((tab) => tab.addEventListener('click', () => activateTab(tab)));
form.addEventListener('submit', (event) => {
  event.preventDefault(); error.textContent = '';
  const parsed = parseInput(input.value);
  if (parsed.error) { result.hidden = true; nearbyArea.hidden = true; visualizationArea.hidden = true; error.textContent = parsed.error; input.focus(); return; }
  showResult(parsed.number);
});
$('#random-button').addEventListener('click', () => { input.value = Math.floor(Math.random() * 9999 + 2); error.textContent = ''; showResult(Number(input.value)); });
input.addEventListener('input', () => { error.textContent = ''; });




$('#history-list').addEventListener('click', (event) => {
  const link = event.target.closest('a[data-number]');
  if (!link) return;
  input.value = link.dataset.number;
  input.focus();
});
$('#clear-history').addEventListener('click', () => {
  localStorage.removeItem(HISTORY_KEY);
  renderHistory();
});
renderHistory();


