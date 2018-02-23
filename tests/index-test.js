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
      expect(node.innerHTML).toContain(`scope=read`)
    })
  })

  it('accepts props.scope', () => {
    const scope = 'read post'
    render(<api.LoaderComponent callbackUrl='url' scope={scope} />, node, () => {
      expect(node.innerHTML).toContain('scope=' + encodeURIComponent(scope))
    })
  })
})
