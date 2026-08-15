const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { Solar } = require('lunar-javascript');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

function sliceBetween(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  assert.notEqual(start, -1, `Missing start marker: ${startMarker}`);
  const end = source.indexOf(endMarker, start);
  assert.notEqual(end, -1, `Missing end marker after ${startMarker}: ${endMarker}`);
  return source.slice(start, end);
}

const shukuBlock = sliceBetween(
  html,
  'const SHUKU = [',
  '/**\n * 竹本流 9グループ × 4エレメント'
);
const calcBlock = sliceBetween(
  html,
  'const LUNAR_MONTH_START = {',
  '/**\n * 月のルネーション（月相）計算ロジック'
);

const context = { console };
vm.createContext(context);
vm.runInContext(
  `${shukuBlock}\n${calcBlock}\nglobalThis.__shukuExports = { SHUKU, LUNAR_MONTH_START, DAILY_SHUKU, KYUREKI_SAKU, kyurekiLookup, calcShukuIndex, getShuku, getLunarDateParts, normalizeShukuName, getDailyShukuInfo, parsePublicDateParam, formatDateParam, addDays };`,
  context,
  { filename: 'index.html#shuku-regression' }
);

const {
  SHUKU,
  LUNAR_MONTH_START,
  DAILY_SHUKU,
  KYUREKI_SAKU,
  kyurekiLookup,
  calcShukuIndex,
  getShuku,
  getLunarDateParts,
  normalizeShukuName,
  getDailyShukuInfo,
  parsePublicDateParam,
  formatDateParam,
  addDays,
} = context.__shukuExports;

function test(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

test('SHUKU master has 27 unique mansions', () => {
  assert.equal(SHUKU.length, 27);
  assert.equal(new Set(SHUKU.map((s) => s.kanji)).size, 27);
});

test('lunar month start table covers all 12 months and points to known mansions', () => {
  assert.deepEqual(Object.keys(LUNAR_MONTH_START).map(Number), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  for (const startName of Object.values(LUNAR_MONTH_START)) {
    assert.ok(SHUKU.some((s) => s.kanji === `${startName}宿`), `Unknown month start mansion: ${startName}`);
  }
});

test('embedded JST kyureki saku table is present and covers lookup range', () => {
  assert.equal(typeof KYUREKI_SAKU, 'string');
  assert.ok(KYUREKI_SAKU.length > 1000, 'Expected multi-century saku table');
  assert.ok(kyurekiLookup(1899, 1, 12), 'Epoch date should resolve');
  assert.ok(kyurekiLookup(2100, 1, 1), 'Late-range date should resolve');
  assert.equal(kyurekiLookup(1800, 1, 1), null);
});

test('public daily shuku data covers all 27 mansions with required guidance', () => {
  assert.equal(Object.keys(DAILY_SHUKU).length, 27);
  for (const shuku of SHUKU) {
    const daily = DAILY_SHUKU[shuku.kanji];
    assert.ok(daily, `Missing public daily data for ${shuku.kanji}`);
    assert.equal(typeof daily.theme, 'string');
    assert.ok(daily.theme.trim().length > 0, `Missing theme for ${shuku.kanji}`);
    assert.equal(typeof daily.meaning, 'string');
    assert.ok(daily.meaning.trim().length > 0, `Missing meaning for ${shuku.kanji}`);
    assert.ok(Array.isArray(daily.actions), `Actions must be an array for ${shuku.kanji}`);
    assert.ok(daily.actions.length >= 2, `Expected multiple actions for ${shuku.kanji}`);
    assert.ok(daily.actions.every((item) => typeof item === 'string' && item.trim()), `Blank action for ${shuku.kanji}`);
    assert.ok(Array.isArray(daily.cautions), `Cautions must be an array for ${shuku.kanji}`);
    assert.ok(daily.cautions.length >= 2, `Expected multiple cautions for ${shuku.kanji}`);
    assert.ok(daily.cautions.every((item) => typeof item === 'string' && item.trim()), `Blank caution for ${shuku.kanji}`);
  }
});

test('daily shuku lookup accepts stable public route names', () => {
  assert.equal(normalizeShukuName('昴'), '昴宿');
  assert.equal(normalizeShukuName('昴宿'), '昴宿');
  assert.equal(getDailyShukuInfo('昴').shuku.kanji, '昴宿');
  assert.equal(getDailyShukuInfo('昴宿').shuku.kanji, '昴宿');
  assert.equal(getDailyShukuInfo(12).shuku.kanji, '亢宿');
  assert.equal(getDailyShukuInfo('存在しない宿'), null);
});

test('public date helper exposes the Japanese lunar date used by daily shuku logic', () => {
  const lunar = getLunarDateParts(2026, 8, 12);
  assert.equal(lunar.month, 6);
  assert.equal(lunar.day, 30);
  assert.equal(lunar.isLeapMonth, false);
  assert.equal(lunar.dayCount, 30);
});

test('Japanese kyureki differs from Chinese lunar on known boundary date', () => {
  const jp = getLunarDateParts(1976, 12, 8);
  assert.equal(jp.month, 10);
  assert.equal(jp.day, 17);
  const cn = Solar.fromYmd(1976, 12, 8).getLunar();
  assert.equal(Math.abs(cn.getMonth()), 10);
  assert.equal(cn.getDay(), 18);
});

test('public daily date route helpers accept yesterday and tomorrow dates', () => {
  const date = parsePublicDateParam('2026-08-12');
  assert.equal(date.getFullYear(), 2026);
  assert.equal(date.getMonth(), 7);
  assert.equal(date.getDate(), 12);
  assert.equal(formatDateParam(date), '2026-08-12');
  assert.equal(formatDateParam(addDays(date, -1)), '2026-08-11');
  assert.equal(formatDateParam(addDays(date, 1)), '2026-08-13');
  assert.equal(parsePublicDateParam('2026-02-31'), null);
});

const documentedCases = [
  ['1962-03-22', '底宿'],
  ['1975-08-11', '亢宿'],
  ['1973-01-01', '箕宿'],
  ['1976-12-08', '井宿'],
];

for (const [date, expected] of documentedCases) {
  test(`${date} maps to ${expected}`, () => {
    const [year, month, day] = date.split('-').map(Number);
    const shuku = getShuku(year, month, day);
    assert.equal(shuku.kanji, expected);
    assert.equal(SHUKU[calcShukuIndex(year, month, day)].kanji, expected);
    assert.equal(shuku.index, calcShukuIndex(year, month, day));
    const dailyInfo = getDailyShukuInfo(calcShukuIndex(year, month, day));
    assert.equal(dailyInfo.shuku.kanji, expected);
    assert.ok(dailyInfo.daily.meaning.trim());
  });
}

test('getShuku returns a copy with a stable index into SHUKU', () => {
  const shuku = getShuku(1975, 8, 11);
  assert.notEqual(shuku, SHUKU[shuku.index]);
  assert.equal(SHUKU[shuku.index].kanji, shuku.kanji);
  assert.ok(Number.isInteger(shuku.index));
  assert.ok(shuku.index >= 0 && shuku.index < SHUKU.length);
});
