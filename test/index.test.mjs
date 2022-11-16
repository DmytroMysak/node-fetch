// eslint-disable-next-line import/no-unresolved
import { describe, it, before, after } from 'node:test';
import { promisify } from 'node:util';
import assert from 'node:assert';
import { URL } from 'node:url';
import { setTimeout } from 'node:timers/promises';
import { createServer } from 'http';
import dist from '../dist/cjs/src/index.js';

const { default: fetch } = dist;

describe('test fetch retry', () => {
  let server;
  let i = 0;
  let url;

  before(async () => {
    server = createServer(async (req, res) => {
      try {
        const query = new URL(req.url, `http://${req.headers.host}`).searchParams;

        let statusCode = Number.parseInt(query.get('status') || 200, 10);
        if (statusCode >= 500) i++;
        if (statusCode >= 500 && i === 3) {
          statusCode = 200;
          i = 0;
        }
        if (statusCode >= 500 && query.has('delay')) {
          await setTimeout(Number(query.get('delay')));
        }
        res.statusCode = statusCode;
        res.end(
          JSON.stringify({
            header: req.headers,
            body: req.body || {},
            statusCode,
            i,
            statusCodeD: query.get('status'),
            delay: statusCode >= 500 && query.has('delay'),
          })
        );
      } catch (e) {
        res.end(JSON.stringify({ header: e.message, body: req.url }));
      }
    });

    await promisify(server.listen.bind(server))();
    url = `http://localhost:${server.address().port}`;
  });

  after(async () => {
    await promisify(server.close.bind(server))();
  });

  it('test fetch get works 200', async () => {
    const response = await fetch(url);
    assert.strictEqual(response.ok, true);
  });

  it('test fetch get works 200 with custom headers (basic auth)', async () => {
    const token = 'Basic thisShouldBeAnAuthHeader';

    const response = await fetch(url, {
      method: 'GET',
      headers: { Authorization: token },
    });
    const data = await response.json();

    assert.strictEqual(response.ok, true);
    assert.strictEqual(data.header.authorization, token);
  });

  it('test fetch get works 200 with custom headers (bearer token)', async () => {
    const token = 'Bearer thisShouldBeAToken';

    const response = await fetch(url, {
      method: 'GET',
      headers: { Authorization: token },
    });
    const data = await response.json();

    assert.strictEqual(response.ok, true);
    assert.strictEqual(data.header.authorization, token);
  });

  it('test fetch get works 202', async () => {
    const queryParams = new URLSearchParams({ status: 202 });
    const response = await fetch(`${url}?${queryParams}`, { method: 'GET' });

    assert.strictEqual(response.ok, true);
    assert.strictEqual(response.status, 202);
  });

  it('test fetch put works 200', async () => {
    const response = await fetch(url, { method: 'PUT', body: 'hello' });

    assert.strictEqual(response.ok, true);
  });

  it('test fetch put works 202', async () => {
    const queryParams = new URLSearchParams({ status: 202 });

    const response = await fetch(`${url}?${queryParams}`, { method: 'PUT', body: 'hello' });

    assert.strictEqual(response.ok, true);
    assert.strictEqual(response.status, 202);
  });

  it('test fetch stops on 401 with custom headers (basic auth)', async () => {
    const token = 'Basic thisShouldBeAnAuthHeader';
    const queryParams = new URLSearchParams({ status: 401 });

    const response = await fetch(`${url}?${queryParams}`, {
      method: 'GET',
      headers: { Authorization: token },
    });
    const data = await response.json();

    assert.strictEqual(response.ok, false);
    assert.strictEqual(data.header.authorization, token);
  });

  it('test disable retry', async () => {
    const queryParams = new URLSearchParams({ status: 401 });
    const response = await fetch(`${url}?${queryParams}`, {
      method: 'GET',
      retry: 0,
      retryOnHttpResponse: false,
    });

    assert.strictEqual(response.statusText, 'Unauthorized');
  });

  it('test get retry with default settings 500 then 200', async () => {
    const queryParams = new URLSearchParams({ status: 500 });

    const response = await fetch(`${url}?${queryParams}`, {
      method: 'GET',
      retryStrategy: () => () => 0,
    });

    assert.strictEqual(response.statusText, 'OK');
    assert.strictEqual(response.status, 200);
  });

  it('test get retry with default settings 500 then 200 with auth headers set', async () => {
    const token = 'Basic thisShouldBeAnAuthHeader';
    const queryParams = new URLSearchParams({ status: 500 });

    const response = await fetch(`${url}?${queryParams}`, {
      method: 'GET',
      headers: { Authorization: token },
      retryStrategy: () => () => 0,
    });

    assert.strictEqual(response.statusText, 'OK');
    assert.strictEqual(response.status, 200);
  });

  it('test retry with default settings 400', async () => {
    const queryParams = new URLSearchParams({ status: 400 });
    const response = await fetch(`${url}?${queryParams}`, { method: 'GET' });

    assert.strictEqual(response.statusText, 'Bad Request');
    assert.strictEqual(response.status, 400);
  });

  it('test retry with default settings 404', async () => {
    const queryParams = new URLSearchParams({ status: 404 });
    const response = await fetch(`${url}?${queryParams}`, { method: 'GET' });

    assert.strictEqual(response.statusText, 'Not Found');
    assert.strictEqual(response.status, 404);
  });

  it('test retry with default settings 300', async () => {
    const queryParams = new URLSearchParams({ status: 300 });
    const response = await fetch(`${url}?${queryParams}`, { method: 'GET' });

    assert.strictEqual(response.statusText, 'Multiple Choices');
    assert.strictEqual(response.status, 300);
  });

  it('test retry with error 3 times 503', async () => {
    const queryParams = new URLSearchParams({ status: 503 });
    const response = await fetch(`${url}?${queryParams}`, {
      method: 'GET',
      retry: 3,
      retryOnHttpResponse: (r) => r.status >= 500,
      retryStrategy: () => () => 0,
    });

    assert.strictEqual(response.statusText, 'OK');
    assert.strictEqual(response.status, 200);
  });

  it('test retry timeout 503', async () => {
    const queryParams = new URLSearchParams({ status: 503, delay: 1000 });
    const response = await fetch(`${url}?${queryParams}`, {
      method: 'GET',
      timeout: 500,
      retryStrategy: () => () => 0,
    });

    assert.strictEqual(response.statusText, 'OK');
    assert.strictEqual(response.status, 200);
  });

  it('test retry timeout on error 503', async () => {
    const queryParams = new URLSearchParams({ status: 503 });

    try {
      await fetch(`${url}?${queryParams}`, {
        method: 'GET',
        retry: 2,
        timeout: 500,
        retryStrategy: () => () => 0,
      });
    } catch (e) {
      assert.strictEqual(e.message, 'HTTP Error Response: 503 Service Unavailable');
      i = 0;
    }
  });

  it('verifies handling of socket timeout when socket times out (after first failure)', async () => {
    const queryParams = new URLSearchParams({ status: 503, delay: 1000 });

    try {
      await fetch(`${url}?${queryParams}`, {
        method: 'GET',
        retry: 1,
        timeout: 200,
        retryStrategy: () => () => 0,
      });
    } catch (e) {
      assert.strictEqual(e.message, 'The operation was aborted.');
    }
  });
});
