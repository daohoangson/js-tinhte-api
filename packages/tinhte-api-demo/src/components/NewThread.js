import React from 'react'
import { apiHoc } from 'tinhte-api-react'

class NewThread extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      forum_id: 2,
      thread_title: 'Hello',
      post_body: 'World.'
    }

    this.handleInputChange = this.handleInputChange.bind(this)
  }

  handleInputChange (event) {
    const { name, value } = event.target
    this.setState({ [name]: value })
  }

  render () {
    const { api, forums } = this.props
    if (!api || !Array.isArray(forums)) {
      return null
    }

    const postParams = () => api.post({
      uri: 'threads',
      params: { ...this.state }
    })

    const postFormData = () => {
      // eslint-disable-next-line
      const body = new FormData()
      Object.keys(this.state).forEach((k) => body.append(k, this.state[k]))
      api.post({ uri: 'threads', body })
    }

    return (
      <form>
        <p>
          <label>
            Forum ID:
            <select name='forum_id' onChange={this.handleInputChange} value={this.state.forum_id}>
              {forums.map((forum) => <option value={forum.node_id} key={forum.node_id}>{forum.title}</option>)}
            </select>
          </label>
        </p>

        <p>
          <label>
            Thread Title:
            <input name='thread_title' onChange={this.handleInputChange} value={this.state.thread_title} />
          </label>
        </p>

        <p>
          <label>
            Post Body:
            <textarea name='post_body' onChange={this.handleInputChange} value={this.state.post_body} />
          </label>
        </p>

        <p><input onClick={postParams} readOnly type='button' value='POST with params' /></p>
        <p><input onClick={postFormData} readOnly type='button' value='POST with FormData' /></p>
      </form>
    )
  }
}

NewThread.apiFetchesWithAuth = {
  forums: {
    uri: 'navigation',
    success: (json) => {
      const forums = []

      if (Array.isArray(json.elements)) {
        json.elements.forEach((element) => {
          if (!element.navigation_type ||
            element.navigation_type !== 'forum' ||
            !element.permissions.create_thread) {
            return
          }

          const forum = {
            node_id: element.navigation_id,
            title: element.forum_title
          }

          forums.push(forum)
        })
      }

      return forums
    }
  }
}

export default apiHoc.ApiConsumer(NewThread)
