import React from 'react'
import { ReactApiContext } from '../types'

export default React.createContext<ReactApiContext>({
  api: null as any,
  apiData: {},
  internalApi: null as any
})
