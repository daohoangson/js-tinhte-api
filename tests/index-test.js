import expect from 'expect'
import React from 'react'
import {render, unmountComponentAtNode} from 'react-dom'

import tinhteApi from 'src/'

describe('LoaderComponent', () => {
  const clientId = 'clientId'

  let api
  let node

  beforeEach(() => {
    api = tinhteApi(clientId)
    node = document.createElement('div')
  })

  afterEach(() => {
    unmountComponentAtNode(node)
  })

  it('displays an iframe', () => {
    const callbackUrl = 'callback url'
    render(<api.LoaderComponent callbackUrl={callbackUrl} />, node, () => {
      expect(node.innerHTML).toContain('<iframe')
      expect(node.innerHTML).toContain(`client_id=${clientId}`)
      expect(node.innerHTML).toContain('redirect_uri=' + encodeURIComponent(callbackUrl))
    })
  })
})
