import { render } from '@testing-library/react'
import React from 'react'

import { apiFactory } from '..'

describe('components', () => {
  describe('Callback', () => {
    it('renders error', async () => {
      const debug = true
      const api = apiFactory({ debug })
      const ApiCallback = api.CallbackComponent

      const { container } = render(<ApiCallback />)
      const element = container.querySelector('.ApiCallback')
      expect(element).toHaveAttribute('data-success', 'false')
    })

    it('renders success', async () => {
      window.location.hash = '#state=yes'

      const debug = true
      const api = apiFactory({ debug })
      const ApiCallback = api.CallbackComponent

      const { container } = render(<ApiCallback />)
      const element = container.querySelector('.ApiCallback')
      expect(element).toHaveAttribute('data-success', 'true')
    })

    it('renders without debugging info', () => {
      const api = apiFactory()
      const ApiCallback = api.CallbackComponent

      const { container } = render(<ApiCallback />)
      const element = container.querySelector('.ApiCallback')
      expect(element).not.toHaveAttribute('data-success')
    })
  })
})
