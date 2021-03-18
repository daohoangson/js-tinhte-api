import React from 'react'
import Head from 'next/head'
import { apiFactory } from 'tinhte-api-react'

import Buttons from '../src/components/Buttons'
import FeaturePages from '../src/components/FeaturePages'
import Navigation from '../src/components/Navigation'
import NewThread from '../src/components/NewThread'
import Visitor from '../src/components/Visitor'
import VisitorThreads from '../src/components/VisitorThreads'

const debug = true
const apiConfig = { callbackUrl: '/api-callback', debug }
const api = apiFactory(apiConfig)

const Index = () => (
  <div>
    <Head>
      <title>tinhte-api Next.js demo</title>
    </Head>
    <Buttons />
    <FeaturePages />
    <Navigation />
    <NewThread />
    <Visitor />
    <VisitorThreads />
  </div>
)

export async function getServerSideProps ({ query }) {
  const clientId = query.client_id
  const reqConfig = { clientId }
  const reqApi = apiFactory({ ...apiConfig, ...reqConfig })

  const clientSecret = query.client_secret
  if (typeof clientSecret === 'string') {
    reqConfig.ott = reqApi.generateOneTimeToken(clientSecret)
  }

  const ReqApiProvider = reqApi.ProviderHoc(Index)
  const apiData = await reqApi.fetchApiDataForProvider(<ReqApiProvider apiConfig={reqConfig} />)

  Head.rewind()
  return { props: { apiConfig: reqConfig, apiData } }
}

export default api.ProviderHoc(Index)
