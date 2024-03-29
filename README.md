# node-fetch with native fetch + retry + timeout

Inspired by node-fetch-retry-timeout.

Tiny replacement for native **fetch** with additional benefits.

## Installation

`npm i @netly/node-fetch`

## Parameters

Same as in native fetch, but with small extension. Everything is **optional**.

| parameter                                     | type   | description                                | default                                                |
| --------------------------------------------- | ------ | ------------------------------------------ | ------------------------------------------------------ |
| [`retry`](#retry)                             | number | number of times to retry the request       | 3                                                      |
| [`timeout`](#timeout)                         | number | number of ms to wait before request cancel | 20_000                                                 |
| [`retryStrategy`](#retryStrategy)             | Function | exponential backoff strategy               | (times) => Math.min((2 \*\* times - 1) \* 1000, 20000) |
| [`retryOnHttpResponse`](#retryOnHttpResponse) | Function | can retry based on http response statuses  | (response) => response.status >= 500;                  |

### retry

```ts
retry?: number
```

### timeout

```ts
timeout?: number
```

### retryStrategy

Calculates how long to wait before next retry. `times` - the number of retry.
To disable retry strategy: `() => 0`

```ts
retryStrategy: (times: number): number => Math.min((2 ** times - 1) * 1000, 20000);
```

### retryOnHttpResponse

Check if response is desired. If no - throw error and send request one more time.

```ts
retryOnHttpResponse: (response: globalThis.Response) => response.status >= 500;
```

## Example

### For `cjs`

```js
const { default: fetch } = require('@netly/node-fetch');
// or 
const { fetch } = require('@netly/node-fetch');

const response = await fetch('https://www.google.com');
```

### For `esm`

```js
import { fetch } from '@netly/node-fetch';
// or
import fetch from '@netly/node-fetch';

const response = await fetch('https://www.google.com');
```
### For `ts`

```ts
import { fetch } from '@netly/node-fetch';
// or 
import fetch from '@netly/node-fetch';

const response = await fetch('https://www.google.com');
```