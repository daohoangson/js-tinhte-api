import React from 'react'
import { apiHoc } from '../../../src'

const Visitor = ({ apiData }) => {
  const { user } = apiData
  if (!user) {
    return null
  }

  return <h1>Hello {user.username}</h1>
}

Visitor.apiFetchesWithAuth = {
  'user': {
    uri: 'users/me?fields_include=username',
    success: (json) => json.user
  }
}

export default apiHoc.ApiConsumer(Visitor)
