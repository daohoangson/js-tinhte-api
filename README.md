# tinhte-api React Component

[![Travis][build-badge]][build]
[![npm package][npm-badge]][npm]
[![Coveralls][coveralls-badge]][coveralls]

Quickly setup API authentication against [Tinh tế](https://tinhte.vn) for React applications. Demo: [surge.sh](https://tinhte-api.surge.sh/?client_id=2wseo5fywn).

## Usage

### Initialize

```js
import tinhteApi from 'tinhte-api'

const api = tinhteApi('clientId')
```

### Render Loader

```js
import React from 'react'

const Home = () => (
    <div>
        <api.LoaderComponent callbackUrl='http://app.domain.com/api-callback' />
    </div>
)
```

### Render Callback

The `api.LoaderComponent` will attempt to authenticate user using [OAuth2 implicit flow](https://tools.ietf.org/html/rfc6749#section-1.3.2) and that requires serving an additional page as the target redirection URL. We are going to use [React Router](https://reacttraining.com/react-router/) for this:

```js
import React, {Component} from 'react'
import {BrowserRouter as Router, Route} from 'react-router-dom'

// const api = ☝️

// const Home = ☝️

const App = () => (
    <Router>
        <div>
            <Route exact path='/' component={Home} />
            <Route path='/api-callback' component={api.CallbackComponent} />
        </div>
    </Router>
)
```

## References


### tinhteApi

Params:

 - `clientId` default=`''` (empty string)
 - `apiRoot` default=`'https://tinhte.vn/appforo/index.php'`

Return an `api` object.

### api.LoaderComponent

Props:

 - `callbackUrl` required string
 - `scope` default=`'read'`

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

[build-badge]: https://img.shields.io/travis/daohoangson/js-tinhte-api/master.png?style=flat-square
[build]: https://travis-ci.org/daohoangson/js-tinhte-api

[npm-badge]: https://img.shields.io/npm/v/npm-package.png?style=flat-square
[npm]: https://www.npmjs.org/package/npm-package

[coveralls-badge]: https://img.shields.io/coveralls/daohoangson/js-tinhte-api/master.png?style=flat-square
[coveralls]: https://coveralls.io/github/daohoangson/js-tinhte-api
