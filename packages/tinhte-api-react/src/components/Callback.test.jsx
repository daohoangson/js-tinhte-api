import { expect } from '@esm-bundle/chai'
import React from 'react'
import ReactDom from 'react-dom'

import { apiFactory } from '..'

const { render, unmountComponentAtNode } = ReactDom

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
      const api = apiFactory({ debug })
      const ApiCallback = api.CallbackComponent

      render(<ApiCallback />, node, () => {
        expect(node.innerHTML).contains('data-success="false"')
      })
    })

    it('renders success', () => {
      window.location.hash = '#state=yes'

      const debug = true
      const api = apiFactory({ debug })
      const ApiCallback = api.CallbackComponent

      render(<ApiCallback />, node, () => {
        expect(node.innerHTML).contains('data-success="true"')
      })
    })

    it('renders without debugging info', () => {
      const api = apiFactory()
      const ApiCallback = api.CallbackComponent

      render(<ApiCallback />, node, () => {
        expect(node.innerHTML).does.not.contain('data-success')
      })
    })
  })
})
