import React from 'react'
import { apiHoc } from 'tinhte-api-react'

const get = (api, uri) => api.get(uri)
  .then(
    (json) => console.log(uri, json),
    (reason) => console.error(uri, 'failed!', reason)
  )

const ButtonOne = apiHoc.ApiConsumer(({ api, uri }) => {
  const fetch = () => get(api, uri)
  return <p><button onClick={fetch}>GET `{uri}`</button></p>
})

const ButtonMultiple = apiHoc.ApiConsumer(({ api, uris }) => {
  const fetch = () => api.batch(() => uris.forEach((uri) => get(api, uri)))
  return (
    <ul>
      {uris.map((uri, i) => <li key={i}>GET `{uri}`</li>)}
      <li>
        {'=> '}
        <button onClick={fetch}>POST `/batch`</button>
      </li>
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
