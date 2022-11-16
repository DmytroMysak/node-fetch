import timers from 'timers/promises';

export class HTTPResponseError extends Error {
  response: globalThis.Response;

  constructor(response: globalThis.Response) {
    super(`HTTP Error Response: ${response.status} ${response.statusText}`);
    this.response = response;
  }
}

export interface IRequestOptions extends globalThis.RequestInit {
  retry?: number;
  timeout?: number;
  retryStrategy?: (numberOfRetry: number) => number;
  retryOnHttpResponse?: false | ((response: globalThis.Response) => boolean);
}

const DEFAULT_RETRY = 3;
const DEFAULT_TIMEOUT = 20_000;

const defaultRetryFn = (response: globalThis.Response) => response.status >= 500;

const defaultExponentialBackoff = (times: number): number => Math.min((2 ** times - 1) * 1000, DEFAULT_TIMEOUT);

export default async (url: string, options: IRequestOptions = {}) => {
  const { retry = DEFAULT_RETRY, retryStrategy = defaultExponentialBackoff, timeout = DEFAULT_TIMEOUT } = options;
  const retryOnHttpResponse =
    options.retryOnHttpResponse === false ? () => false : options.retryOnHttpResponse ?? defaultRetryFn;

  if (typeof retryOnHttpResponse !== 'function') {
    throw new Error(`'retryOnHttpResponse' must be a function: ${options.retryOnHttpResponse}`);
  }
  if (typeof retryStrategy !== 'function') {
    throw new Error(`'retryStrategy' must be a function: ${options.retryStrategy}`);
  }

  let retriesLeft = retry;
  do {
    const controller = new AbortController();
    const timeoutClear = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await globalThis.fetch(url, { redirect: 'manual', ...options, signal: controller.signal });

      if (retryOnHttpResponse(response)) {
        throw new HTTPResponseError(response);
      }

      clearTimeout(timeoutClear);
      return response;
    } catch (error) {
      clearTimeout(timeoutClear);
      retriesLeft--;

      if (retriesLeft <= 0) {
        throw error;
      }

      await timers.setTimeout(retryStrategy(retry));
    }
  } while (retriesLeft > 0);
};
