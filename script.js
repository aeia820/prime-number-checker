const $ = (selector) => document.querySelector(selector);
const form = $('#prime-form');
const input = $('#number-input');
const error = $('#error-message');
const result = $('#result');
const nearbyArea = $('#nearby-area');
const MAX = 1_000_000_000_000;

function isPrime(number) {
  if (number < 2) return false;
  if (number === 2) return true;
  if (number % 2 === 0) return false;
  for (let i = 3; i <= Math.sqrt(number); i += 2) {
    if (number % i === 0) return false;
  }
  return true;
}

function getDivisors(number) {
  const lower = [], upper = [];
  for (let i = 1; i <= Math.sqrt(number); i += 1) {
    if (number % i === 0) {
      lower.push(i);
      if (i !== number / i) upper.push(number / i);
    }
  }
  return lower.concat(upper.reverse());
}

function getFactorPairs(number) {
  const pairs = [];
  for (let i = 1; i <= Math.sqrt(number); i += 1) {
    if (number % i === 0) pairs.push([i, number / i]);
  }
  return pairs;
}

function parseInput(value) {
  const normalized = value.trim().replaceAll(',', '').replaceAll('，', '');
  if (!/^\d+$/.test(normalized)) return { error: '半角数字で整数を入力してください。' };
  const number = Number(normalized);
  if (number < 1 || number > MAX) return { error: '1〜1,000,000,000,000の範囲で入力してください。' };
  return { number };
}

function renderNearby(number) {
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
    const cells = [position, value.toLocaleString('ja-JP'), prime ? '素数' : '素数ではない'];
    cells.forEach((text) => { const cell = document.createElement('td'); cell.textContent = text; row.appendChild(cell); });
    body.appendChild(row);
    displayedCount += 1;
  }
  $('#nearby-count').textContent = `現在値を含む前後5件（計${displayedCount}件）`;
  nearbyArea.hidden = false;
}

function showResult(number) {
  const divisors = getDivisors(number);
  const factorPairs = getFactorPairs(number);
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
  const divisorList = $('#divisor-list');
  divisorList.replaceChildren();
  if (!prime) {
    $('#divisor-count').textContent = `${divisors.length}個`;
    divisors.forEach((value) => { const chip = document.createElement('span'); chip.textContent = value.toLocaleString('ja-JP'); divisorList.appendChild(chip); });
  }

  $('#factor-count').textContent = `${factorPairs.length}パターン`;
  const factorList = $('#factor-list');
  factorList.replaceChildren();
  factorPairs.forEach(([left, right]) => { const item = document.createElement('div'); item.textContent = `${formatted} = ${left.toLocaleString('ja-JP')} × ${right.toLocaleString('ja-JP')}`; factorList.appendChild(item); });
  renderNearby(number);
  result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  error.textContent = '';
  const parsed = parseInput(input.value);
  if (parsed.error) { result.hidden = true; nearbyArea.hidden = true; error.textContent = parsed.error; input.focus(); return; }
  showResult(parsed.number);
});

$('#random-button').addEventListener('click', () => { input.value = Math.floor(Math.random() * 9999 + 2); error.textContent = ''; showResult(Number(input.value)); });
input.addEventListener('input', () => { error.textContent = ''; });





