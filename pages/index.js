import React from 'react'
import Head from 'next/head'

import { apiFactory } from '../src'
import Buttons from '../demo/src/components/Buttons'
import FeaturePages from '../demo/src/components/FeaturePages'
import Navigation from '../demo/src/components/Navigation'
import Visitor from '../demo/src/components/Visitor'

const callbackUrl = process.browser ? window.location.origin + '/api-callback' : ''
const debug = true
const apiConfig = {callbackUrl, debug}
const api = apiFactory(apiConfig)

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
  const scopedConfig = {clientId}
  const scopedApi = apiFactory({...apiConfig, ...scopedConfig})

  const clientSecret = query.client_secret
  if (typeof clientSecret === 'string') {
    scopedConfig.ott = scopedApi.generateOneTimeToken(clientSecret)
  }

  const ScopedApiProvider = scopedApi.ProviderHoc(Index)

  return scopedApi.fetchApiDataForProvider(<ScopedApiProvider />)
    .then((apiData) => {
      Head.rewind()
      return {apiConfig: scopedConfig, apiData}
    })
}

export default ApiProvider
