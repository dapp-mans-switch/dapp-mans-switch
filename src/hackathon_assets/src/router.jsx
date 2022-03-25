import * as React from 'react'
import { render } from 'react-dom'

import About from './about'
import HandsOff from './handsoff'
import Main from './index'
import Spectator from './spectator'
import Staker from './staker'
import Uploader from './uploader'


// this is the router
// import and call routeToPage(<name of page(string)>) from any component
// pass hackathon actor in props
export default function routeToPage(pageName, props={}) {
  switch(pageName) {
    case 'Main':
      render(<Main />, document.getElementById('app'))
      break
    case 'Spectator':
      render(React.createElement(Spectator, props), document.getElementById('app'))
      break
    case 'Staker':
      render(React.createElement(Staker, props), document.getElementById('app'))
      break
    case 'Uploader':
      render(React.createElement(Uploader, props), document.getElementById('app'))
      break
    case 'HandsOff':
      render(React.createElement(HandsOff, props), document.getElementById('app'))
      break
    case 'About':
      render(React.createElement(About, props), document.getElementById('app'))
      break
    default:
  }
}
