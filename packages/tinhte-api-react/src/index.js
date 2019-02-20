import React from 'react'

import ApiReact from './classes/api'
import apiHoc from './hoc'
import { processCallback } from './components/Callback'

// legacy support only
const apiFactory = (config) => new ApiReact(config)

export { ApiReact, apiFactory, apiHoc, processCallback }

export default { ApiReact, apiFactory, apiHoc, processCallback }
