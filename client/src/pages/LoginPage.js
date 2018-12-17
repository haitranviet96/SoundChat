import React from 'react';
import { Link, Redirect } from 'react-router-dom'
import 'whatwg-fetch'

import FormControl from '@material-ui/core/FormControl';
import TextField from '@material-ui/core/TextField';
import FormHelperText from '@material-ui/core/FormHelperText';
import Button from '@material-ui/core/Button';

import { API_URL } from "../utils/config";

class LoginPage extends React.Component {
  state = {
    username: '',
    usernameError: false,
    usernameErrorText: '',
    password: '',
    passwordError: false,
    passwordErrorText: '',
  }

  onUsernameChange = (e) => {
    this.setState({
      usernameError: false,
      username: e.target.value.trim()
    })
  }
  onPasswordChange = (e) => {
    this.setState({
      passwordError: false,
      password: e.target.value
    })
  }
  onKeyPress = (e) => {
    if (e.charCode === 13) this.login()
  }
  login = () => {
    const newState = { ...this.state }
    let error = false;

    if (newState.username.trim() === '') {
      newState.usernameError = true;
      newState.usernameErrorText = 'You must enter username';
      error = true;
    }
    if (newState.password === '') {
      newState.passwordError = true;
      newState.passwordErrorText = 'You must enter password';
      error = true;
    }

    if (error) {
      this.setState(newState);
      return;
    }

    fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: newState.username,
        password: newState.password,
      })
    })
      .then((response) => {
        return response.json()
      })
      .then((json) => {
        console.log(json)
        if (json.status === 'error') {
          this.setState({
            usernameError: true,
            usernameErrorText: 'Wrong username or password'
          })
        } else if (json.status === 'success') {
          sessionStorage.setItem('soundchat-user-id', json.user_id)
          sessionStorage.setItem('soundchat-access-token', json.access_token)
          sessionStorage.setItem('soundchat-refresh-token', json.refresh_token)
          sessionStorage.setItem('soundchat-user', newState.username)
          this.setState({ password: '' })
        }
      }).catch((ex) => {
        console.log('parsing failed', ex)
      })
  }

  render() {
    const accessToken = sessionStorage.getItem('soundchat-access-token')

    if (!!accessToken) {
      return <Redirect to='/' />
    }

    return (
      <div>
        <div>
          <FormControl error>
            <TextField
              label="Username"
              className="login-text-field"
              type="text"
              margin="normal"
              variant="filled"
              value={this.state.username}
              onChange={(e) => this.onUsernameChange(e)}
              onKeyPress={(e) => this.onKeyPress(e)}
            />
            <FormHelperText style={{ display: this.state.usernameError ? '' : 'none' }}>
              {this.state.usernameErrorText}
            </FormHelperText>
          </FormControl>
        </div>
        <div>
          <FormControl>
            <TextField
              label="Password"
              className="login-text-field"
              type="password"
              margin="normal"
              variant="filled"
              value={this.state.password}
              onChange={(e) => this.onPasswordChange(e)}
              onKeyPress={(e) => this.onKeyPress(e)}
            />
            <FormHelperText style={{ display: this.state.passwordError ? '' : 'none' }}>
              {this.state.passwordErrorText}
            </FormHelperText>
          </FormControl>
        </div>
        <br></br>
        <div>
          <Button variant="contained" color="primary" onClick={() => this.login()}>Login</Button>
        </div>
        <br></br>
        <Link to="/register">Register a new account</Link>
      </div>
    )
  }
}

export default LoginPage;