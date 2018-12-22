import React, { Component } from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom';

import LoginPage from './pages/LoginPage';
import ChatPage from "./pages/chatPage";
import RegisterPage from "./pages/RegisterPage";
import NavBar from "./components/NavBar";

import './App.css';

class App extends Component {
  state = {
    accessToken: null,
    userId: null,
    userName: null
  }

  componentDidMount = () => {
    this.getAuthInfo()
  }

  clearAuthInfo = () => {
    this.setState({
      accessToken: null,
      userId: null,
      userName: null
    })
  }
  getAuthInfo = () => {
    this.setState({
      accessToken: sessionStorage.getItem('soundchat-access-token'),
      userId: sessionStorage.getItem('soundchat-user-id'),
      userName: sessionStorage.getItem('soundchat-user')
    })
  }
  setAuthInfo = ({ accessToken, userId, userName }) => {
    this.setState({
      accessToken, userId, userName
    })
  }

  render() {
    return (
      <div className="App">
        <div style={{ display: 'none' }}>{this.state.number}</div>
        <NavBar authInfo={this.state} clearAuthInfo={this.clearAuthInfo}></NavBar>
        <BrowserRouter basename="/">
          <div style={{ height: '100%' }}>
            <Switch>
              <Route
                path="/login"
                render={(props) => <LoginPage {...props} authInfo={this.state} setAuthInfo={this.setAuthInfo} />}
              />
              <Route path="/register"
                render={(props) => <RegisterPage {...props} authInfo={this.state} setAuthInfo={this.setAuthInfo} />}
              ></Route>
              <Route
                render={(props) => <ChatPage {...props} authInfo={this.state} setAuthInfo={this.setAuthInfo} />}
              ></Route>
            </Switch>
          </div>
        </BrowserRouter>
      </div>
    );
  }
}

export default App;
