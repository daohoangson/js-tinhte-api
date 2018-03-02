import React from 'react'
import { apiHoc } from '../../../src'

const Visitor = ({ user }) => user ? <h1>Hello {user.username}</h1> : null

Visitor.apiFetchesWithAuth = {
  'user': {
    uri: 'users/me?fields_include=username',
    success: (json) => json.user
  }
}

export default apiHoc.ApiConsumer(Visitor)
