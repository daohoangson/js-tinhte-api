import React from 'react'
import { filter } from 'lodash'
import { apiHoc } from '../../../src'

const getLink = (element) => {
  if (!element.links) {
    return ''
  }

  const { links } = element
  switch (element.navigation_type) {
    case 'linkforum':
      return links.target
    default:
      return links.permalink
  }
}

const getTitle = (element) => {
  let titleKey
  Object.keys(element).forEach((key) => {
    if (key.match(/_title$/)) {
      titleKey = key
    }
  })

  return titleKey ? element[titleKey] : `#${element.navigation_id}`
}

class Item extends React.Component {
  constructor (props) {
    super(props)
    this.state = { expand: false }
  }

  render () {
    const { element, elements } = this.props
    const toggle = () => {
      this.setState((prevState) => ({expand: !prevState.expand}))
    }

    let childrenCount = 0
    elements.forEach((child) => {
      if (child.navigation_parent_id !== element.navigation_id) {
        return
      }

      childrenCount++
    })

    return (
      <li>
        {`${element.navigation_type}: ${getTitle(element)} `}
        <a href={getLink(element)} target='_blank'>link</a>
        {childrenCount > 0 && <span onClick={toggle} style={{cursor: 'pointer'}}>{` -> ${childrenCount}`}</span>}
        {this.state.expand && <List elements={elements} parentId={element.navigation_id} />}
      </li>
    )
  }
}

const List = ({ elements, parentId }) => {
  const filtered = filter(elements, (element) => element.navigation_parent_id === parentId)
  if (filtered.length === 0) {
    return null
  }

  return (
    <ul>
      { filtered.map((element) => <Item element={element} elements={elements} key={element.navigation_id} />) }
    </ul>
  )
}

const Navigation = ({ apiData }) => {
  const { elements } = apiData
  if (!elements) {
    return null
  }

  return <List elements={elements} parentId={0} />
}

Navigation.apiFetches = {
  'elements': {
    uri: 'navigation?fields_exclude=forum_prefixes,permissions,links&fields_include=*,links.permalink,links.target',
    success: (json) => json.elements
  }
}

export default apiHoc.ApiConsumer(Navigation)
