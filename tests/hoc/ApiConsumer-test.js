import expect from 'expect'
import React from 'react'
import {render, unmountComponentAtNode} from 'react-dom'

import { apiFactory, hoc } from 'src/'

describe('hoc', () => {
  describe('ApiConsumer', () => {
    let node

    beforeEach(() => {
      node = document.createElement('div')
    })

    afterEach(() => {
      unmountComponentAtNode(node)
    })

    it('populates props.api', () => {
      const userId = Math.random()
      const api = apiFactory({auth: {user_id: userId}})

      const Parent = ({children}) => <div>{children}</div>
      const ApiProvider = api.ProviderHoc(Parent)

      const Child = ({api}) => <span className='userId'>{api.getUserId()}</span>
      const ApiConsumer = hoc.ApiConsumer(Child)

      const Test = () => (
        <ApiProvider>
          <ApiConsumer />
        </ApiProvider>
      )

      render(<Test />, node, () => {
        expect(node.innerHTML).toContain(`<span class="userId">${userId}</span>`)
      })
    })
  })
})
