import React from 'react';
import { Link, Redirect } from 'react-router-dom'
import 'whatwg-fetch'

import FormControl from '@material-ui/core/FormControl';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import FormHelperText from '@material-ui/core/FormHelperText';

import { API_URL } from "../utils/config";


class RegisterPage extends React.Component {
  state = {
    username: '',
    usernameError: false,
    usernameErrorText: '',
    password: '',
    passwordError: false,
    passwordErrorText: '',
    confirmPassword: '',
    confirmPasswordError: false,
    confirmPasswordErrorText: ''
  }

  onUsernameChange = (e) => {
    if (e.target.value === '')
      this.setState({
        usernameError: false,
        username: e.target.value.trim()
      })
    else this.setState({
      username: e.target.value.trim(),
      usernameError: !/^[a-zA-Z\d]+$/.test(e.target.value.trim()),
      usernameErrorText: 'Username must only consists of letters (a-z, A-Z) and digits (0-9)'
    })
  }
  onPasswordChange = (e) => {
    this.setState({
      passwordError: false,
      password: e.target.value
    })
  }
  onConfirmPasswordChange = (e) => {
    this.setState({
      confirmPassword: e.target.value,
      confirmPasswordError: this.state.password !== e.target.value,
      confirmPasswordErrorText: 'Password not matched'
    })
  }
  onKeyPress = (e) => {
    if (e.charCode === 13) this.sendRegisterForm();
  }
  sendRegisterForm = (e) => {
    const newState = { ...this.state }
    let error = false;

    if (newState.username.trim() === '') {
      newState.usernameError = true;
      newState.usernameErrorText = 'You must enter username';
      error = true;
    } else if (!/^[a-zA-Z\d]+$/.test(newState.username)) {
      newState.usernameError = true;
      newState.usernameErrorText = 'Username must only consists of letters (a-z, A-Z) and digits (0-9)';
      error = true;
    }

    if (newState.password === '') {
      newState.passwordError = true;
      newState.passwordErrorText = 'You must enter password';
      error = true;
    } else if (newState.password !== newState.confirmPassword) {
      newState.confirmPasswordError = true;
      newState.confirmPasswordErrorText = 'Password not matched';
      error = true;
    }

    if (error) {
      this.setState(newState);
      return;
    }

    fetch(`${API_URL}/registration`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: newState.username,
        password: newState.password,
        confirm_password: newState.confirmPassword
      })
    })
      .then((response) => {
        return response.json()
      })
      .then((json) => {
        if (json.status === 'error') {
          if (json.message.includes('User')) {
            this.setState({
              usernameError: true,
              usernameErrorText: json.message
            })
          } else if (json.message.includes('Password')) {
            this.setState({
              passwordError: true,
              passwordErrorText: json.message
            })
          } else {
            alert(json.message)
          }
        } else if (json.status === 'success') {
          sessionStorage.setItem('soundchat-user-id', json.user_id)
          sessionStorage.setItem('soundchat-access-token', json.access_token)
          sessionStorage.setItem('soundchat-user', newState.username)
          this.setState({ password: '', confirmPassword: '' })
          this.props.setAuthInfo({
            accessToken: json.access_token,
            userId: json.user_id,
            userName: newState.username
          })
        }
      }).catch((ex) => {
        console.log('parsing failed', ex)
      })
  }

  render() {
    const { accessToken } = this.props.authInfo

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
              required
              autoFocus
              value={this.state.username}
              error={this.state.usernameError}
              onKeyPress={(e) => this.onKeyPress(e)}
              onChange={(e) => this.onUsernameChange(e)}
            />
            <FormHelperText style={{ display: this.state.usernameError ? '' : 'none' }}>
              {this.state.usernameErrorText}
            </FormHelperText>
          </FormControl>
        </div>
        <div>
          <FormControl error>
            <TextField
              label="Password"
              className="login-text-field"
              type="password"
              margin="normal"
              variant="filled"
              required
              value={this.state.password}
              error={this.state.passwordError}
              onKeyPress={(e) => this.onKeyPress(e)}
              onChange={(e) => this.onPasswordChange(e)}
            />
            <FormHelperText style={{ display: this.state.passwordError ? '' : 'none' }}>
              {this.state.passwordErrorText}
            </FormHelperText>
          </FormControl>
        </div>
        <div>
          <FormControl error>
            <TextField
              label="Confirm Password"
              className="login-text-field"
              type="password"
              margin="normal"
              variant="filled"
              required
              value={this.state.confirmPassword}
              error={this.state.confirmPasswordError}
              onKeyPress={(e) => this.onKeyPress(e)}
              onChange={(e) => this.onConfirmPasswordChange(e)}
            />
            <FormHelperText style={{ display: this.state.confirmPasswordError ? '' : 'none' }}>
              {this.state.confirmPasswordErrorText}
            </FormHelperText>
          </FormControl>
        </div>
        <br></br>
        <div>
          <Button variant="contained" color="primary" onClick={() => this.sendRegisterForm()}>Register</Button>
        </div>
        <br></br>
        <Link to="/login">Already have an account? Log in here</Link>
      </div>
    )
  }
}

export default RegisterPage;