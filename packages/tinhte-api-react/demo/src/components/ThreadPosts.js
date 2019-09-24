import React from 'react'
import sanitizeHtml from 'sanitize-html'

import { apiHoc } from '../../../src'

const preparePostBody = (post) => {
  return { __html: sanitizeHtml(post.post_body_html) }
}

const ThreadPosts = ({ posts }) => (Array.isArray(posts) ? (
  <ul>
    {posts.map((post) => (
      <li key={post.post_id}>
        Post #{post.post_id}:
        <article dangerouslySetInnerHTML={preparePostBody(post)} />
      </li>
    ))}
  </ul>
) : null)

ThreadPosts.apiFetches = {
  posts: (api, { threadId }) => {
    if (!threadId) {
      return null
    }

    return {
      uri: 'posts',
      params: {
        thread_id: threadId,
        fields_include: [
          'post_id',
          'post_body_html'
        ].join(',')
      },
      success: (json) => json.posts
    }
  }
}

export default apiHoc.ApiConsumer(ThreadPosts)
