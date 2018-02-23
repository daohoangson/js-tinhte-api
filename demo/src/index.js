import React, {Component} from 'react'
import {render} from 'react-dom'
import {BrowserRouter as Router, Route} from 'react-router-dom'
import querystring from 'querystring'

import tinhteApi from '../../src'

// extract clientId from request URL for demo reason
// normally it should be set from app config directly
let clientId = ''
if (window && window.location && window.location.search) {
  const s = window.location.search
    ? querystring.parse(window.location.search.replace(/^\?/, ''))
    : {}
  if (s.client_id) {
    clientId = s.client_id
  }
}
const api = tinhteApi(clientId)

// in order to load api authentication, a callback route is required
// all pages should render api.LoaderComponent to trigger the auth process
// the callback route must render api.CallbackComponent to complete it
const apiCallbackRoute = '/api-callback'

const Home = () => {
  if (!window || !window.location) {
    return null
  }

  const get = (uri) => {
    api.fetchOne(uri)
      .then((json) => console.log(uri, 'success', json))
      .catch((reason) => console.warn(uri, 'error', reason))
  }

  const getUsersMe = () => get('users/me')
  const getConversations = () => get('conversations')
  const getNotifications = () => get('notifications')

  const getAll = () => {
    api.fetchMultiple(() => {
      getUsersMe()
      getConversations()
      getNotifications()
    })
  }

  if (!clientId) {
    return <p>Try again with `?client_id=xxx` to continue</p>
  }

  return (
    <div>
      <api.LoaderComponent callbackUrl={window.location.origin + apiCallbackRoute} />

      <button onClick={getUsersMe}>GET `/users/me`</button>
      <button onClick={getConversations}>GET `/conversations`</button>
      <button onClick={getNotifications}>GET `/notifications`</button>
      <button onClick={getAll}>POST `/batch`</button>
    </div>
  )
}

class Demo extends Component {
  render () {
    return (
      <Router>
        <div>
          <Route exact path='/' component={Home} />
          <Route path={apiCallbackRoute} component={api.CallbackComponent} />
        </div>
      </Router>
    )
  }
}

render(<Demo />, document.querySelector('#demo'))
