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
      window.location.hash = ''
    })

    it('renders error', () => {
      const debug = true
      const api = apiFactory({debug})
      const ApiCallback = api.CallbackComponent

      render(<ApiCallback />, node, () => {
        expect(node.innerHTML).toContain('data-success="false"')
      })
    })

    it('renders success', () => {
      window.location.hash = '#access_token=yes'

      const debug = true
      const api = apiFactory({debug})
      const ApiCallback = api.CallbackComponent

      render(<ApiCallback />, node, () => {
        expect(node.innerHTML).toContain('data-success="true"')
      })
    })

    it('renders without debugging info', () => {
      const api = apiFactory()
      const ApiCallback = api.CallbackComponent

      render(<ApiCallback />, node, () => {
        expect(node.innerHTML).toNotContain('data-success')
      })
    })
  })
})
