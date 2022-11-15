# Yet Another node-fetch (YANFRT) with native node-fetch

Inspired by node-fetch-retry-timeout.

Minimalistic drop-in replacement for node-fetch.

## Installation
`npm i @netly/node-fetch`

## Example
```js
  const fetch = require('@netly/node-fetch').default;
  let response = await fetch('https://google.com', {
    method: 'GET', 
    retry: 2, // number attempts to retry
    timeout: 5000,  // timeout PER 1 REQUEST (ms)
    retryOnHttpResponse: r => r.status >= 500, // this is the default implementation of retryOnHttpResponse, pass false to disable
  })
```
