import React from 'react'
import { apiHoc } from '../../../src'

const FeaturePage = ({ page }) => (
  <li>
    {'Feature page: '}
    {(page.links && page.links.image)
      ? <img src={page.links.image} style={{ maxHeight: '18px', verticalAlign: 'bottom' }} title={page.fullName} />
      : page.fullName}
    {' '}
    <a href={page.links && page.links.permalink} target='_blank'>link</a>
  </li>
)

const FeaturePages = ({ pages }) => (
  (pages && typeof pages.map === 'function')
    ? <ul>
      { pages.map((page) => <FeaturePage page={page} key={page.tagText} />) }
    </ul>
    : null
)

FeaturePages.apiFetches = {
  pages: {
    // this request won't work without OTT
    uri: 'feature-pages',
    success: (json) => json.pages
  }
}

export default apiHoc.ApiConsumer(FeaturePages)
