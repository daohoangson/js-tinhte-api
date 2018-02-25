import expect from 'expect'
import React from 'react'
import {render, unmountComponentAtNode} from 'react-dom'

import { apiFactory } from 'src/'

describe('components', () => {
  describe('Callback', () => {
    let node

    beforeEach(() => {
      node = document.createElement('div')
    })

    afterEach(() => {
      unmountComponentAtNode(node)
    })

    it('renders error', () => {
      const api = apiFactory({debug: true})
      const ApiCallback = api.CallbackComponent

      render(<ApiCallback />, node, () => {
        expect(node.innerHTML).toContain('data-success="false"')
      })
    })

    it('renders success', () => {
      window.location.hash = '#access_token=yes'
      const api = apiFactory({debug: true})
      const ApiCallback = api.CallbackComponent

      render(<ApiCallback />, node, () => {
        expect(node.innerHTML).toContain('data-success="true"')
      })
    })
  })
})
