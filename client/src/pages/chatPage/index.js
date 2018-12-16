import React from 'react';
import { Redirect } from 'react-router-dom'

class ChatPage extends React.Component {
  render() {
    const accessToken = sessionStorage.getItem('soundchat-access-token')

    if (!accessToken) {
      return <Redirect to='/login' />
    }

    return (
      <div>ChatPage</div>
    )
  }
}

export default ChatPage;