import apiFactory from './factory'
import { ApiConsumer } from './hoc/ApiConsumer'
import { ApiProvider } from './hoc/ApiProvider'
import { processCallback } from './components/Callback'

const apiHoc = { ApiConsumer, ApiProvider }

export { apiFactory, apiHoc, processCallback }
