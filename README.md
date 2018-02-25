# tinhte-api React Component

[![Travis][build-badge]][build]
[![npm package][npm-badge]][npm]
[![Coveralls][coveralls-badge]][coveralls]

Quickly setup API authentication against [Tinh tế](https://tinhte.vn) for React applications. Demo: [surge.sh](https://tinhte-api.surge.sh/?client_id=2wseo5fywn).

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

### Fetch from API

In children components, use `hoc.ApiConsumer` or `api.ConsumerHoc` to prepare the API context and fetch data.

```js
import { hoc } from 'tinhte-api'

const UsersMeBase = ({api}) => {
    const onClick = () => api.fetchOne('users/me')
        .then((json) => console.log(json))

    return <button onClick={onClick}>Fetch</button>
}

const UsersMeComponent = hoc.ApiConsumer(UsersMeBase)
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
   - `auth` default=`null`
     - `access_token` default=`''`
     - `user_id` default=`0`
   - `callbackUrl` default=`''`
   - `clientId` default=`''`
   - `debug` default=`false`
   - `delayMs` default=`10`
   - `scope` default=`'read'`

Returns an `api` object.

### api.CallbackComponent

Returns a React component.

### api.ConsumerHoc

Params:

 - `Component` required React component

Returns a higher order React component.

### api.LoaderComponent

Returns a React component.

### api.ProviderHoc

Params:

 - `Component` required React component

Returns a higher order React component.

### api.getFetchCount

Returns a number.

### api.getUserId

Returns a number.

### api.fetchOne

Params:

 - `uri` required string
 - `method` default=`'GET'`
 - `headers` default=`{}`
 - `body` default=`null`

Returns a `Promise`.

Example:

```js
api.fetchOne('users/me')
    .then((json) => console.log('success', json.user))
    .catch((reason) => console.warn('error', reason))
```

### api.fetchMultiple

Params:

 - `fetches` required func

Returns a `Promise`.

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

### api.onAuthenticated

Params:

 - `callback` required func

Example:

```js
api.onAuthenticated(() => api.fetchOne('users/me'))
```

[build-badge]: https://img.shields.io/travis/daohoangson/js-tinhte-api/master.png?style=flat-square
[build]: https://travis-ci.org/daohoangson/js-tinhte-api

[npm-badge]: https://img.shields.io/npm/v/tinhte-api.png?style=flat-square
[npm]: https://www.npmjs.org/package/tinhte-api

[coveralls-badge]: https://img.shields.io/coveralls/daohoangson/js-tinhte-api/master.png?style=flat-square
[coveralls]: https://coveralls.io/github/daohoangson/js-tinhte-api
