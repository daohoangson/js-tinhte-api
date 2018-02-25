import React from 'react'

import Callback from './Callback'
import Loader from './Loader'

const components = {
  Callback: (api, internalApi) => <Callback api={api} internalApi={internalApi} />,

  Loader: (api, internalApi) => <Loader api={api} internalApi={internalApi} />
}

export default components
