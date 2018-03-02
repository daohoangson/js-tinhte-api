import React from 'react'
import { apiHoc } from '../../../src'

const fetch = (api, uri) => {
  api.fetchOne(uri)
    .then((json) => console.log(uri, 'success', json))
    .catch((reason) => console.error(uri, 'error', reason))
}

const ButtonOne = apiHoc.ApiConsumer(({ api, uri }) => {
  const fetchOne = () => fetch(api, uri)
  return <p><button onClick={fetchOne}>GET `{uri}`</button></p>
})

const ButtonMultiple = apiHoc.ApiConsumer(({ api, uris }) => {
  const fetchMultiple = () => api.fetchMultiple(() => {
    uris.forEach((uri) => fetch(api, uri))
  })

  return (
    <ul>
      {uris.map((uri, i) => <li key={i}>GET `{uri}`</li>)}
      <li>{'=> '}<button onClick={fetchMultiple}>POST `/batch`</button></li>
    </ul>
  )
})

const Buttons = () => (
  <div>
    <ButtonOne uri='users/me' />
    <ButtonOne uri='conversations' />
    <ButtonOne uri='notifications' />

    <ButtonMultiple uris={['posts/1', 'posts/2', 'posts/3']} />
  </div>
)

export default Buttons
