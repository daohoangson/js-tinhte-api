import React, {Component} from 'react'
import {render} from 'react-dom'
import {BrowserRouter as Router, Route} from 'react-router-dom'
import querystring from 'querystring'

import { apiFactory, apiHoc } from '../../src'

// in order to load api authentication, a callback route is required
// all pages should render api.LoaderComponent to trigger the auth process
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

  const get = (api, uri) => {
    api.fetchOne(uri)
      .then((json) => console.log(uri, 'success', json))
      .catch((reason) => console.warn(uri, 'error', reason))
  }

  const ButtonOneBase = ({api, uri}) => {
    const onClick = () => get(api, uri)
    return <button onClick={onClick}>GET `{uri}`</button>
  }

  const ButtonOne = apiHoc.ApiConsumer(ButtonOneBase)

  const ButtonMultipleBase = ({api}) => {
    const onClick = () => api.fetchMultiple(() => {
      get(api, 'threads/1')
      get(api, 'threads/2')
      get(api, 'threads/2')
      get(api, 'threads/3')
      get(api, 'threads/3')
      get(api, 'threads/3')
      get(api, 'threads/4')
    })
    return <button onClick={onClick}>POST `/batch`</button>
  }

  const ButtonMultiple = apiHoc.ApiConsumer(ButtonMultipleBase)

  const Middleman = ({children}) => (
    <div className='middleman'>Inside middleman: {children}</div>
  )

  class AutoFetchOnAuthenticatedBase extends React.Component {
    componentDidMount () {
      const { api, uri } = this.props
      this.cancel = api.onAuthenticated(() => get(api, uri))
    }

    componentWillUnmount () {
      if (this.cancel) {
        this.cancel()
      }
    }

    render () {
      return <span>GET `{this.props.uri}`</span>
    }
  }

  const AutoFetchOnAuthenticated = apiHoc.ApiConsumer(AutoFetchOnAuthenticatedBase)

  class AutoFetchOnProviderMountedBase extends React.Component {
    componentWillMount () {
      const { api, uri } = this.props
      this.cancel = api.onProviderMounted(() => get(api, uri))
    }

    componentWillUnmount () {
      if (this.cancel) {
        this.cancel()
      }
    }

    render () {
      return <span>GET `{this.props.uri}`</span>
    }
  }

  const AutoFetchOnProviderMounted = apiHoc.ApiConsumer(AutoFetchOnProviderMountedBase)

  return (
    <div>
      <p>
        fetchOne:
        <ButtonOne uri='users/me' />
        <ButtonOne uri='conversations' />
        <ButtonOne uri='notifications' /><br />
      </p>

      <p>
        fetchMultiple:
        <ButtonMultiple />
      </p>

      <Middleman>
        <ButtonOne uri='users/me' />
      </Middleman><br />

      <p>
        auto fetch on authenticated:
        <AutoFetchOnAuthenticated uri='posts/1' />
        <AutoFetchOnAuthenticated uri='posts/2' />
        <AutoFetchOnAuthenticated uri='posts/3' />
      </p>

      <p>
        auto fetch on provider mounted:
        <AutoFetchOnProviderMounted uri='posts/4' />
        <AutoFetchOnProviderMounted uri='posts/5' />
        <AutoFetchOnProviderMounted uri='posts/6' />
      </p>
    </div>
  )
}

class Demo extends Component {
  render () {
    const api = apiFactory({
      callbackUrl: window.location.origin + apiCallbackRoute,
      clientId,
      debug: true
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
