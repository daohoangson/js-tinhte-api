# tinhte-api React Component

[![Travis][build-badge]][build]
[![npm package][npm-badge]][npm]
[![Coveralls][coveralls-badge]][coveralls]

Quickly setup API authentication against [Tinh tế](https://tinhte.vn) for React applications. Demo:

 - [Client-only app](https://tinhte-api.surge.sh/?client_id=2wseo5fywn)
 - [Server side rendering app](https://tinhte-api-nextjs.herokuapp.com/?client_id=2wseo5fywn)
 - The demos both use the same [components](https://github.com/daohoangson/js-tinhte-api/tree/master/demo/src/componenets)

## Usage

### Install

Use npm...

```bash
npm install --save tinhte-api
```

...or yarn:

```bash
yarn add tinhte-api
```

### Initialize

For proper operation, clientId and callbackUrl are both required. See below for callback explanation.

```js
import { apiFactory } from 'tinhte-api'

const api = apiFactory({
    clientId: 'clientId',
    callbackUrl: 'http://app.domain.com/api-callback'
})
```

### Render Page

Use ApiProvider higher order component to prepare parent component. The API context will be available for all children components.

```js
import React from 'react'

const Home = () => (
    <div>
        <ChildOne />
        <ChildTwo />
        ...
    </div>
)

const HomeWithApi = api.ProviderHoc(Home)
```

### Render Callback

The Provider HOC will attempt to authenticate user using [OAuth2 implicit flow](https://tools.ietf.org/html/rfc6749#section-1.3.2) and that requires serving an additional page as the target redirection URL. We are going to use [React Router](https://reacttraining.com/react-router/) below but you can use anything (next.js page, expressjs route, etc.):

```js
import {BrowserRouter as Router, Route} from 'react-router-dom'

// const api = ☝️

// const HomeWithApi = ☝️

const App = () => (
    <Router>
        <div>
            <Route exact path='/' component={HomeWithApi} />
            <Route path='/api-callback' component={api.CallbackComponent} />
        </div>
    </Router>
)
```

You can also trigger the function `processCallback` directly on the callback page, 

```html
<script type="text/javascript" src="https://unpkg.com/react@^16/umd/react.production.min.js"></script>
<script type="text/javascript" src="https://unpkg.com/tinhte-api@^2.2.3/umd/tinhte-api.min.js" />
<script type="text/javascript">TinhteApi.processCallback();</script>
```

### Fetch from API

In children components, use `apiHoc.ApiConsumer` or `api.ConsumerHoc` to prepare the API context and fetch data.

```js
import { apiHoc } from 'tinhte-api'

const UsersMeBase = ({ api }) => {
    const fetch = () => api.fetchOne('users/me')
        .then((json) => console.log(json))
        .error(reason) => console.error(reason))

    return <button onClick={fetch}>Fetch</button>
}

const UsersMeComponent = apiHoc.ApiConsumer(UsersMeBase)
```

Use the newly built component anywhere under Provider HOC sub-tree and it will have `props.api` setup.

```js
const ContainerComponent = () => (
    <UsersMeComponent />
)
```

## References

### apiFactory

Params:

 - `config` object
   - `apiRoot` default=`'https://tinhte.vn/appforo/index.php'`
   - `auth` object
     - `access_token` default=`''`
     - `user_id` default=`0`
   - `callbackUrl` default=`''`
   - `clientId` default=`''`
   - `cookiePrefix` default=`'auth_'`
   - `debug` default=`false`
   - `ott` default=`''`
   - `scope` default=`'read'`

Returns an `api` object.

Example:

```js
import { apiFactory } from 'tinhte-api'

const api = apiFactory()
```

### api.CallbackComponent

Returns a React component.

### api.ConsumerHoc

Alias: `apiHoc.ApiConsumer`

Params:

 - `Component` required React component

Props:

 - `onFetched` function
 - `onFetchedWithAuth` function

Returns a higher order React component, the underlying component will receive `api` and `apiData` as props.
It can use `api` directly (`api.fetchOne()`, `api.fetchMultiple()`, etc.)
or it can let the HOC make the requests and benefit from multiple requests
from different components being batched together automatically.

Currenty, `ApiConsumer` supports 2 types of requests: `apiFetches` and `apiFetchesWithAuth`.
They can be configured this way:

```js
// const ComponentBase = ...

ComponentBase.apiFetches = {
  someKey: {
    uri: 'some-uri',
    method: 'GET',
    headers: [],
    body: {},
    success: (json) => json.jsonKey,
    error: (reason) => someDefaultValue
  }
}

// ComponentBase.apiFetchesWithAuth = { ... }

const Component = api.ConsumerHoc(ComponentBase)
```

The ones declared in `apiFetches` will be fetched as soon as the parent `ApiProvider` is mounted.
While the ones in `apiFetchesWithAuth` wait until authentication complete before being fetched.
Please note that it's not guaranteed that fetches in `apiFetchesWithAuth` will have a valid token (a non-logged in user visit your app for example).

The HOC will do the fetches and update `apiData` prop for the component to use (in the example above, `apiData.someKey` will become available).
By default, the HOC will use the response `JSON` object as the value, you can do some normalization via `success` to make it easier to render.
Additionally, you can specify the `error` callback to provide some default value in case of a failed request.

### api.ProviderHoc

Params:

 - `Component` required React component

Props:

 - `apiConfig` object
 - `apiData` object

Returns a higher order React component, the underlying component will receive no additional props.

The props are completely optional and using them is considered advanced usage (yes, they are a bit complicated).
The general use case for these props are server side rendering, you can safely ignore them for client only app
(if you use `apiFetches` and `apiFetchesWithAuth`, it will be very easy to add SSR to your app later). A few examples:

 - **You need to pass the one time token from the server to client?** You may generate OTT per request and put it into `apiConfig`:
 ```js
 const ott = api.generateOneTimeToken(clientSecret)

 return <ApiProvider apiConfig={{ott}} />
 ```
 - **You want to render components on the server but they need api data to work?** You may use `fetchApiDataForProvider`, it will give you the `apiData` object, ready to be use with `ApiProvider`.

### api.fetchApiDataForProvider

Params:

 - `rootElement` required React root element

Returns a `Promise` that will resolve to the usable ApiProvider props object.

Example for Next.js:

```js
const ApiProvider = api.ProviderHoc(Page)

ApiProvider.getInitialProps = async () => {
  const props = await api.fetchApiDataForProvider(<ApiProvider />)
  return props
}
```

### api.fetchOne

Params:

 - `uri` required string
 - `method` default=`'GET'`
 - `headers` default=`{}`
 - `body` default=`null`

Returns a `Promise` that will resolve to the response `JSON` object.

Example:

```js
api.fetchOne('users/me')
    .then((json) => console.log('success', json.user))
    .catch((reason) => console.warn('error', reason))
```

### api.fetchMultiple

Params:

 - `fetches` required func
 - `options` object
   - `triggerHandlers` default=`true`

Returns a `Promise` that will resolve to the response `JSON` object.

Example:

```js
api.fetchMultiple(() => {
    api.fetchOne('notifications')
        .then((json) => console.log('notifications', json.notifications))
        .catch((reason) => console.warn('notifications error', reason))

    api.fetchOne('conversations')
        .then((json) => console.log('conversations', json.conversations))
        .catch((reason) => console.warn('conversations error', reason))
})
```

### api.generateOneTimeToken

Params:

 - `clientSecret` string
 - `ttl` number|Date

Returns a string.

**Note:** This method will not work in browser unless debugging is turned on (`debug=true`).
It is strongly recommended against exposing client secret to visitors.

### api.getAccessToken

Returns the authenticated access token or empty string.

### api.getApiRoot

Returns the configured API root string.

### api.getCallbackUrl

Returns the configured callback URL string.

### api.getClientId

Returns the configured client ID string.

### api.getCookieName

Returns cookie name if cookie prefix and client ID have been configured,
or empty string otherwise.

### api.getDebug

Returns `true` if debugging is turned on, or `false` otherwise.

### api.getOtt

Returns the configured one time token string.

### api.getScope

Returns the configured scope string.

### api.getFetchCount

Returns the number of fetches have been made since initialization.

### api.getUniqueId

Returns the unique ID string of this api instance.

### api.getUserId

Returns the authenticated access token or `0`.

### api.setAuth

Params:

 - `auth` required object
   - `access_token` required string
   - `state` required string

Returns a `Promise` that will resolve to the number of auth callbacks.

**Note:** This method will not work unless debugging is turned on (`debug=true`). 
It is strongly recommended against altering API states from outside.

### api.setOneTimeToken

Params:

 - `ott` required string

Returns `true` if ott has been updated, `false` otherwise.

[build-badge]: https://img.shields.io/travis/daohoangson/js-tinhte-api/master.png?style=flat-square
[build]: https://travis-ci.org/daohoangson/js-tinhte-api

[npm-badge]: https://img.shields.io/npm/v/tinhte-api.png?style=flat-square
[npm]: https://www.npmjs.org/package/tinhte-api

[coveralls-badge]: https://img.shields.io/coveralls/daohoangson/js-tinhte-api/master.png?style=flat-square
[coveralls]: https://coveralls.io/github/daohoangson/js-tinhte-api
