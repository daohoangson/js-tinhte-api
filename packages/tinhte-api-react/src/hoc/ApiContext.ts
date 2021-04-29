import React from 'react'
import { ReactApiContext } from '../types'

export default React.createContext<ReactApiContext>({
  apiData: {}
})
