import React from 'react'
import Head from 'next/head'

import { apiFactory } from '../src'
import Buttons from '../demo/src/components/Buttons'
import FeaturePages from '../demo/src/components/FeaturePages'
import Navigation from '../demo/src/components/Navigation'
import Visitor from '../demo/src/components/Visitor'

const callbackUrl = process.browser ? window.location.origin + '/api-callback' : ''
const debug = true
const api = apiFactory({callbackUrl, debug})

const Index = () => (
  <div>
    <Head>
      <title>tinhte-api Next.js demo</title>
    </Head>
    <Buttons />
    <FeaturePages />
    <Navigation />
    <Visitor />
  </div>
)

const ApiProvider = api.ProviderHoc(Index)

ApiProvider.getInitialProps = async ({ query }) => {
  const clientId = query.client_id
  const apiConfig = {clientId}

  const clientSecret = query.client_secret
  if (typeof clientSecret === 'string') {
    const tempApi = apiFactory(apiConfig)
    apiConfig.ott = tempApi.generateOneTimeToken(clientSecret)
    api.setOneTimeToken(apiConfig.ott)
  }

  return api.fetchApiDataForProvider(<ApiProvider />)
    .then((apiData) => {
      Head.rewind()

      return {apiConfig, apiData}
    })
}

export default ApiProvider
