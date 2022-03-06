import * as React from 'react'
import { render } from 'react-dom'

import Staker from './staker'
import Uploader from './uploader'
import Main from './index'
import Spectator from './spectator'
import HandsOff from './handsoff'


// this is the router
// import and call routToPage(<name of page(string)>) from any component
// pass hackathon actor in props
export default function routToPage(pageName, props={}) {
  switch(pageName) {
    case 'Main':
      render(<Main />, document.getElementById('app'))
      break
    case 'Staker':
      render(React.createElement(Staker, props), document.getElementById('app'))
      break
    case 'Uploader':
      render(React.createElement(Uploader, props), document.getElementById('app'))
      break
    case 'Spectator':
      render(React.createElement(Spectator, props), document.getElementById('app'))
      break
    case 'HandsOff':
      render(React.createElement(HandsOff, props), document.getElementById('app'))
      break
    default:
  }
}
