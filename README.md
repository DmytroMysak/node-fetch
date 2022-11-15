# Yet Another node-fetch-retry-timeout (YANFRT) with native node-fetch

Inspired by node-fetch-retry-timeout.

Minimalistic drop-in replacement for node-fetch.

## Installation
`npm i node-fetch-retry-timeout`

## Example
```js
  const fetch = require('node-fetch-retry-timeout')
  let response = await fetch('https://google.com', {
    method: 'GET', 
    retry: 2, // number attempts to retry
    pause: 500, // pause between requests (ms)
    timeout: 5000,  // timeout PER 1 REQUEST (ms)
    retryOnHttpResponse: r => r.status >= 500, // this is the default implementation of retryOnHttpResponse, pass false to disable
    beforeRetry: (retryNum, error) => { // switch opts on retry (retryNum == 1 before first retry is initiated, check the existence of error.response for advanced logic)
      return { headers: { 'Switch header': 'header-value' }, agent: SomeRandomAgent }
    }
  })
```
