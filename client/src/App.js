import React, { Component } from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom';

import LoginPage from './pages/LoginPage';
import ChatPage from "./pages/chatPage";
import RegisterPage from "./pages/RegisterPage";
import NavBar from "./components/NavBar";

import './App.css';

class App extends Component {
  render() {
    const isLoggedIn = !!sessionStorage.getItem('soundchat-access-token')

    return (
      <div className="App">
        <NavBar isLoggedIn={isLoggedIn}></NavBar>
        <BrowserRouter basename="/">
          <div style={{ height: '100%' }}>
            <Switch>
              <Route path="/login" component={LoginPage} />
              <Route path="/register" component={RegisterPage}></Route>
              <Route component={ChatPage}></Route>
            </Switch>
          </div>
        </BrowserRouter>
      </div>
    );
  }
}

export default App;
