import expect from 'expect'
import React from 'react'
import {render, unmountComponentAtNode} from 'react-dom'

import tinhteApi from 'src/'

describe('components', () => {
  describe('Callback', () => {
    let node

    beforeEach(() => {
      node = document.createElement('div')
    })

    afterEach(() => {
      unmountComponentAtNode(node)
    })

    it('renders targetOrigin error', () => {
      const api = tinhteApi()
      const ApiCallback = api.CallbackComponent

      render(<ApiCallback />, node, () => {
        expect(node.innerHTML).toContain('<span class="Callback" data-result="targetOrigin"></span>')
      })
    })
  })
})
