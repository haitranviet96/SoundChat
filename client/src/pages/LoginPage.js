import React from 'react';
import { Link, Redirect } from 'react-router-dom'
import TextField from '@material-ui/core/TextField';

class LoginPage extends React.Component {
  render() {
    const accessToken = sessionStorage.getItem('soundchat-access-token')

    if (!!accessToken) {
      return <Redirect to='/' />
    }

    return (
      <div>
        <p>Login</p>
        <div>
          <TextField
            label="Username"
            className="login-text-field"
            type="text"
            margin="normal"
            variant="filled"
          />
        </div>
        <div>
          <TextField
            label="Password"
            className="login-text-field"
            type="password"
            margin="normal"
            variant="filled"
          />
        </div>
        <Link to="/register">Register a new account</Link>
      </div>
    )
  }
}

export default LoginPage;