import React, { Component } from 'react'
import { render } from 'react-dom'
import { BrowserRouter as Router, Route } from 'react-router-dom'
import querystring from 'querystring'

import { apiFactory } from '../../src'
import Buttons from './components/Buttons'
import FeaturePages from './components/FeaturePages'
import Navigation from './components/Navigation'
import NewThread from './components/NewThread'
import Visitor from './components/Visitor'
import VisitorThreads from './components/VisitorThreads'

// in order to load api authentication, a callback route is required
// all pages should render api.ProviderHoc to trigger the auth process
// the callback route must render api.CallbackComponent to complete it
const apiCallbackRoute = '/api-callback'

// extract clientId from request URL for demo reason
// normally it should be set from app config directly
let clientId = ''
const s = querystring.parse(window.location.search.replace(/^\?/, ''))
if (s.client_id) {
  clientId = s.client_id
}

const Home = () => {
  if (!clientId) {
    return <p>Try again with `?client_id=xxx` to continue</p>
  }

  return (
    <div>
      <Buttons />
      <FeaturePages />
      <Navigation />
      <NewThread />
      <Visitor />
      <VisitorThreads />
    </div>
  )
}

class Demo extends Component {
  render () {
    const debug = true
    const api = apiFactory({
      callbackUrl: apiCallbackRoute,
      clientId,
      debug
    })

    return (
      <Router>
        <div className='demo'>
          <Route exact path='/' component={api.ProviderHoc(Home)} />
          <Route path={apiCallbackRoute} component={api.CallbackComponent} />
        </div>
      </Router>
    )
  }
}

render(<Demo />, document.querySelector('#demo'))
