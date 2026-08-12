import assert from 'node:assert/strict';
import middleware from '../middleware.js';

function test(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

function request(url, headers = {}) {
  return new Request(url, { headers });
}

function isNext(response) {
  return response.headers.get('x-middleware-next') === '1';
}

test('public daily query route bypasses Basic auth for today', () => {
  const response = middleware(request('https://example.test/index.html?daily=today'));
  assert.equal(response.status, 200);
  assert.equal(isNext(response), true);
});

test('public daily query route bypasses Basic auth for a mansion detail', () => {
  const response = middleware(request('https://example.test/?daily=%E6%98%B4%E5%AE%BF'));
  assert.equal(response.status, 200);
  assert.equal(isNext(response), true);
});

test('ordinary routes still require Basic auth without credentials', () => {
  const response = middleware(request('https://example.test/index.html'));
  assert.equal(response.status, 401);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.match(response.headers.get('www-authenticate'), /^Basic /);
});
