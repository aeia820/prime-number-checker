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
  const usesLongLabels = String(number).length >= 7;
  chart.classList.toggle('uses-long-labels', usesLongLabels);
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
    label.textContent = value.toLocaleString('ja-JP');
    point.append(bar, label); chart.appendChild(point);
  }
  $('#visualization-range').textContent = `${start.toLocaleString('ja-JP')}〜${end.toLocaleString('ja-JP')}`;
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

function isPerfectSquare(number) {
  return Number.isInteger(Math.sqrt(number));
}

function isPerfectCube(number) {
  const root = Math.round(Math.cbrt(number));
  return root ** 3 === number;
}

function isTriangular(number) {
  return Number.isInteger(Math.sqrt(8 * number + 1));
}

function isFibonacci(number) {
  let previous = 0, current = 1;
  while (current < number) [previous, current] = [current, previous + current];
  return number === 0 || current === number;
}

function renderNumberProfile(number, divisors, prime) {
  const tags = [];
  tags.push([number % 2 === 0 ? '偶数' : '奇数', number % 2 === 0 ? '2で割り切れる整数' : '2で割り切れない整数']);
  tags.push([prime ? '素数' : number === 1 ? '単数' : '合成数', prime ? '正の約数が1とその数自身だけ' : number === 1 ? '乗法の単位元' : '1と自身以外にも約数を持つ整数']);
  if (isPerfectSquare(number)) tags.push(['平方数', 'ある整数の2乗で表せる数']);
  if (isPerfectCube(number)) tags.push(['立方数', 'ある整数の3乗で表せる数']);
  if (isTriangular(number)) tags.push(['三角数', '1からある整数までの和で表せる数']);
  if (String(number) === [...String(number)].reverse().join('')) tags.push(['回文数', '数字を逆から読んでも同じ数']);
  if (isFibonacci(number)) tags.push(['フィボナッチ数', 'フィボナッチ数列に現れる数']);
  if (number > 1 && !prime) {
    const properSum = divisors.slice(0, -1).reduce((sum, divisor) => sum + divisor, 0);
    if (properSum === number) tags.push(['完全数', '自分自身を除く約数の和が元の数と等しい']);
    else if (properSum > number) tags.push(['過剰数', '自分自身を除く約数の和が元の数より大きい']);
    else tags.push(['不足数', '自分自身を除く約数の和が元の数より小さい']);
    const factorMultiplicity = getPrimeFactors(number).reduce((sum, [, exponent]) => sum + exponent, 0);
    if (factorMultiplicity === 2) tags.push(['半素数', '2つの素数の積で表せる数']);
  }
  const container = $('#profile-tags');
  container.replaceChildren();
  tags.forEach(([label, description]) => {
    const tag = document.createElement('span'); tag.textContent = label; tag.title = description; tag.setAttribute('aria-label', `${label}：${description}`); container.appendChild(tag);
  });
  $('#profile-count').textContent = `${tags.length}項目`;
}

function primesUpTo(limit) {
  if (limit < 2) return [];
  const composite = new Uint8Array(limit + 1);
  const primes = [];
  for (let value = 2; value <= limit; value += 1) {
    if (composite[value]) continue;
    primes.push(value);
    if (value * value <= limit) for (let multiple = value * value; multiple <= limit; multiple += value) composite[multiple] = 1;
  }
  return primes;
}

function renderPrimeCertificate(number, prime) {
  const area = $('#certificate-area');
  area.hidden = !prime;
  if (!prime) return;
  const limit = Math.floor(Math.sqrt(number));
  const testedPrimes = primesUpTo(limit);
  const approximateRoot = Math.sqrt(number).toLocaleString('ja-JP', { maximumFractionDigits: 3 });
  $('#certificate-summary').textContent = `√${number.toLocaleString('ja-JP')} ≈ ${approximateRoot}。この範囲の素数で割り切れないことを確認しました。`;
  const details = $('#certificate-details'); details.replaceChildren();
  const theorem = document.createElement('p'); theorem.textContent = '合成数なら平方根以下の素因数を少なくとも1つ持つため、この確認で素数だと結論できます。'; details.appendChild(theorem);
  const tested = document.createElement('p');
  if (!testedPrimes.length) tested.textContent = '確認対象：なし（2は最小の素数）';
  else if (testedPrimes.length <= 16) tested.textContent = `確認した素数：${testedPrimes.map((value) => value.toLocaleString('ja-JP')).join('、')}`;
  else tested.textContent = `確認した素数：2、3、5、7、11、…、${testedPrimes.at(-1).toLocaleString('ja-JP')}（計${testedPrimes.length.toLocaleString('ja-JP')}個）`;
  details.appendChild(tested);
}

function createSvgElement(name, attributes = {}) {
  const element = document.createElementNS('http://www.w3.org/2000/svg', name);
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
  return element;
}

function sampleNetworkDivisors(number, divisors, primeFactors, limit = 24) {
  const candidates = divisors.filter((value) => value !== number);
  if (candidates.length <= limit) return candidates;
  const required = [...new Set([1, ...primeFactors])];
  const selected = new Set(required);
  const slots = Math.max(1, limit - selected.size);
  for (let index = 0; index < slots; index += 1) {
    const position = Math.round(index * (candidates.length - 1) / Math.max(1, slots - 1));
    selected.add(candidates[position]);
  }
  return [...selected].sort((a, b) => a - b).slice(0, limit);
}

function renderDivisorNetwork(number, divisors) {
  const area = $('#network-area');
  const svg = $('#divisor-network');
  svg.replaceChildren();
  const title = createSvgElement('title'); title.textContent = `${number.toLocaleString('ja-JP')}と約数のネットワーク`;
  const description = createSvgElement('desc'); description.textContent = '中央が入力値、周囲が約数です。赤色のノードは素因数です。';
  svg.append(title, description);
  const primeFactors = getPrimeFactors(number).map(([factor]) => factor);
  const compact = window.innerWidth <= 600;
  const shown = sampleNetworkDivisors(number, divisors, primeFactors, compact ? 16 : 24);
  const canvasWidth = compact ? 420 : 760;
  const canvasHeight = compact ? 450 : 390;
  const centerX = canvasWidth / 2, centerY = canvasHeight / 2;
  const radiusX = compact ? 172 : 310, radiusY = compact ? 182 : 142;
  svg.setAttribute('viewBox', `0 0 ${canvasWidth} ${canvasHeight}`);
  const positions = shown.map((value, index) => ({ value, x: centerX + radiusX * Math.cos(-Math.PI / 2 + index * Math.PI * 2 / Math.max(1, shown.length)), y: centerY + radiusY * Math.sin(-Math.PI / 2 + index * Math.PI * 2 / Math.max(1, shown.length)) }));
  const edges = createSvgElement('g', { class: 'network-edges' });
  positions.forEach(({ x, y }) => edges.appendChild(createSvgElement('line', { x1: centerX, y1: centerY, x2: x, y2: y })));
  svg.appendChild(edges);
  const nodes = createSvgElement('g', { class: 'network-nodes' });
  positions.forEach(({ value, x, y }) => {
    const classes = ['network-node', primeFactors.includes(value) ? 'is-prime-factor' : '', String(value).length > 6 ? 'is-long' : ''].filter(Boolean).join(' ');
    const group = createSvgElement('g', { class: classes, transform: `translate(${x} ${y})` });
    const circle = createSvgElement('circle', { r: 18 });
    const text = createSvgElement('text', { 'text-anchor': 'middle', dy: '.32em' }); text.textContent = value.toLocaleString('ja-JP');
    const tooltip = createSvgElement('title'); tooltip.textContent = `${value.toLocaleString('ja-JP')}${primeFactors.includes(value) ? '（素因数）' : '（約数）'}`;
    group.append(circle, text, tooltip); nodes.appendChild(group);
  });
  svg.appendChild(nodes);
  const center = createSvgElement('g', { class: 'network-center', transform: `translate(${centerX} ${centerY})` });
  const width = Math.min(150, Math.max(82, String(number.toLocaleString('ja-JP')).length * 9 + 28));
  center.appendChild(createSvgElement('rect', { x: -width / 2, y: -24, width, height: 48, rx: 6 }));
  const centerText = createSvgElement('text', { 'text-anchor': 'middle', dy: '.34em' }); centerText.textContent = number.toLocaleString('ja-JP'); center.appendChild(centerText); svg.appendChild(center);
  $('#network-count').textContent = `${divisors.length.toLocaleString('ja-JP')}個の約数`;
  $('#network-note').textContent = divisors.length - 1 > shown.length ? `見やすさのため、${divisors.length - 1}個の周辺ノードから${shown.length}個を表示しています。素因数はすべて含まれます。` : '中央が入力値、周囲が約数です。赤色は素因数を示します。';
  area.hidden = false;
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
  renderNumberProfile(number, divisors, prime);
  renderPrimeCertificate(number, prime);
  renderDivisorNetwork(number, divisors);
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
  if (parsed.error) { result.hidden = true; nearbyArea.hidden = true; visualizationArea.hidden = true; $('#network-area').hidden = true; error.textContent = parsed.error; input.focus(); return; }
  showResult(parsed.number);
});
$('#random-button').addEventListener('click', () => { input.value = Math.floor(Math.random() * 9999 + 2); error.textContent = ''; showResult(Number(input.value)); });
input.addEventListener('input', () => { error.textContent = ''; });




$('#history-list').addEventListener('click', (event) => {
  const link = event.target.closest('a[data-number]');
  if (!link) return;
  event.preventDefault();
  input.value = link.dataset.number;
  showResult(Number(link.dataset.number));
});
renderHistory();




const SURPRISING_NON_PRIMES = [
  57, 91, 341, 561, 1105, 1729, 2047, 2465,
  2821, 6601, 8911, 41041, 825265, 3215031751
];
function renderSurprisingPrimes() {
  const verified = SURPRISING_NON_PRIMES.filter((number) => number > 1 && !isPrime(number));
  const selected = [...verified].sort(() => Math.random() - 0.5).slice(0, 4);
  const list = $('#surprising-primes-list');
  list.replaceChildren();
  selected.forEach((number) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = number.toLocaleString('ja-JP');
    const factor = getPrimeFactors(number)[0][0];
    button.title = `${number.toLocaleString('ja-JP')} = ${factor.toLocaleString('ja-JP')} × ${(number / factor).toLocaleString('ja-JP')}`;
    button.addEventListener('click', () => { input.value = number; showResult(number); });
    list.appendChild(button);
  });
}

renderSurprisingPrimes();










