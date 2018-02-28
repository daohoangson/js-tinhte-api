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

const UsersMeBase = ({api}) => {
    const onClick = () => api.fetchOne('users/me')
        .then((json) => console.log(json))

    return <button onClick={onClick}>Fetch</button>
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
 - `options` object
   - `cacheJson` default=`false`
   - `triggerHandlers` default=`true`

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

Returns a `func` that can be used to cancel the callback.

Example:

```js
api.onAuthenticated(() => api.fetchOne('users/me'))
```

### api.onProviderMounted

Params:

 - `callback` required function

Returns a `function` that can be used to cancel the callback.

Example:

```js
class Component extends React.Component {
  constructor (props) {
    super(props)
    this.state = { link: '' }
  }

  componentWillMount () {
    const { api } = this.props
    api.onProviderMounted(() => {
      api.fetchOne('navigation')
        .then((json) => {
          this.setState({ link: json.elements[0].links.permalink })
        })
    })
  }

  render () {
    return <span>link=<a href={this.state.link} target='_blank'>{this.state.link}</a></span>
  }
}
```

### api.setAuth

Params:

 - `auth` required object
   - `access_token` required string
   - `state` required string

Returns the number of auth callbacks that have been notified.

**Note:** This method will not work unless debugging is turned on (`debug=true`). 
It is strongly recommended against altering API states from outside.

[build-badge]: https://img.shields.io/travis/daohoangson/js-tinhte-api/master.png?style=flat-square
[build]: https://travis-ci.org/daohoangson/js-tinhte-api

[npm-badge]: https://img.shields.io/npm/v/tinhte-api.png?style=flat-square
[npm]: https://www.npmjs.org/package/tinhte-api

[coveralls-badge]: https://img.shields.io/coveralls/daohoangson/js-tinhte-api/master.png?style=flat-square
[coveralls]: https://coveralls.io/github/daohoangson/js-tinhte-api
