import * as React from 'react'
import { render } from 'react-dom'

import Staker from './staker'
import Uploader from './uploader'
import Main from './index'
import Spectator from './spectator'
import LoginForm from './auth/loginform'


// this is the router
// import and call routToPage(<name of page(string)>) from any component
// pass hackathon actor in props
export default function routToPage(pageName, props={}) {
  switch(pageName) {
    case 'Main':
      render(<Main />, document.getElementById('app'))
      break
    case 'LoginForm':
      render(<LoginForm />, document.getElementById('app'))
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
    default:
  }
}
