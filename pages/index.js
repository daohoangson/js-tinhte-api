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
  const reqConfig = {clientId}
  const reqApi = api.clone(reqConfig)

  if (!process.browser) {
    const clientSecret = query.client_secret
    if (typeof clientSecret === 'string') {
      reqConfig.ott = reqApi.generateOneTimeToken(clientSecret)
    }
  }

  const ReqApiProvider = reqApi.ProviderHoc(Index)

  return reqApi.fetchApiDataForProvider(<ReqApiProvider apiConfig={reqConfig} />)
    .then((apiData) => {
      Head.rewind()
      return {apiConfig: reqConfig, apiData}
    })
}

export default ApiProvider
