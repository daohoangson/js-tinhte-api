import React from 'react'
import { apiHoc } from '../../../src'

import ThreadPosts from './ThreadPosts'

const VisitorThreads = ({ threads }) => (threads ? (
  <ul>
    {threads.map((thread) => (
      <li key={thread.thread_id}>
        {`Thread #${thread.thread_id}: ${thread.thread_title}`}
        <ThreadPosts threadId={thread.thread_id} />
      </li>
    ))}
  </ul>
) : null)

VisitorThreads.apiFetchesWithAuth = {
  threads: (api) => {
    const userId = api.getUserId()
    if (userId < 1) {
      return null
    }

    return {
      uri: 'threads',
      params: {
        creator_user_id: userId,
        fields_include: [
          'thread_id',
          'thread_title'
        ].join(','),
        order: 'thread_update_date_reverse'
      },
      success: (json) => json.threads || []
    }
  }
}

export default apiHoc.ApiConsumer(VisitorThreads)
