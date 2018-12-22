import React from 'react';

import { Scrollbars } from 'react-custom-scrollbars';

import { API_URL } from '../../utils/config';

import TextField from '@material-ui/core/TextField';

class ChatRoom extends React.Component {
  state = {
    messages: [],
    isFetchingMessages: false,
    inputMessage: '',
    socket: null
  }

  componentWillReceiveProps = (nextProps) => {
    if (
      (!this.props.currentRoom && nextProps.currentRoom)
      || (this.props.currentRoom && nextProps.currentRoom &&
        this.props.currentRoom.id !== nextProps.currentRoom.id)
    ) {
      this.setState({ isFetchingMessages: true })
      this.fetchMessages(nextProps.currentRoom.id)
    }
    if (!this.props.socket && nextProps.socket) {
      nextProps.socket.on('message', (res) => {
        if (res.data.data.sender_id !== this.props.userId
          && res.data.room_id === this.props.currentRoom.id
        ) {
          this.state.messages.push(res.data.data)
          this.setState({ messages: this.state.messages })
        }
      })
    }
  }

  onInputMessageChange = (e) => {
    this.setState({ inputMessage: e.target.value })
  }

  fetchMessages = (roomId) => {
    fetch(`${API_URL}/rooms/${roomId}/messages`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.props.accessToken}`
      }
    })
      .then((response) => {
        return response.json()
      })
      .then((json) => {
        if (json.status === 'success') {
          this.setState({
            messages: json.data,
            isFetchingMessages: false
          })
        }
      }).catch((ex) => {
        console.log('parsing failed', ex)
      })
  }
  onKeyPress = (e) => {
    if (e.charCode === 13) this.sendMessage()
  }
  sendMessage = () => {
    if (this.state.inputMessage.trim() === 0) return;
    fetch(`${API_URL}/rooms/${this.props.currentRoom.id}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.props.accessToken}`
      },
      body: JSON.stringify({
        content: this.state.inputMessage.trim()
      })
    })
      .then((response) => {
        return response.json()
      })
      .then((json) => {
        console.log(json)
        if (json.status === 'success') {
          this.state.messages.push(
            {
              content: this.state.inputMessage,
              time: new Date().getTime(),
              isNew: true
            }
          );
          this.setState({
            messages: this.state.messages,
            isFetchingMessages: false,
            inputMessage: ''
          })
        }
      }).catch((ex) => {
        console.log('parsing failed', ex)
      })
  }

  renderMessages = () => {
    if (this.state.messages.length === 0) {
      return (
        <Scrollbars style={{ width: '100%', height: '100%' }}>
          <p>There are no messages</p>
        </Scrollbars>
      )
    }
    return (
      <Scrollbars style={{ width: '100%', height: '100%' }}>
        {
          this.state.messages.map((message, index) => {
            let currentTime = new Date(message.time);
            if (!message.isNew)
              currentTime = new Date(Date.UTC(
                currentTime.getFullYear(),
                currentTime.getMonth(),
                currentTime.getDate(),
                currentTime.getHours(),
                currentTime.getMinutes(),
                currentTime.getSeconds()
              ))

            return (
              <div style={{
                textAlign: "left", marginLeft: 20,
              }} key={index}>
                <p style={{ fontSize: '60%' }}>{
                  currentTime.getHours()
                  + ':' + currentTime.getMinutes()
                  + ' '
                  + currentTime.getDate()
                  + '-' + currentTime.getMonth()
                  + '-' + currentTime.getFullYear()
                }
                </p>
                <p>&nbsp;&nbsp;{message.content}</p>
              </div>
            )
          })
        }
      </Scrollbars>
    )
  }
  renderReplyBox = () => {
    if (this.props.currentRoom.owner_id.toString() !== sessionStorage.getItem('soundchat-user-id')) {
      return null;
    }
    return (
      <div>
        <TextField
          style={{ width: '100%' }}
          label="Send message"
          margin="normal"
          variant="outlined"
          value={this.state.inputMessage}
          onChange={(e) => this.onInputMessageChange(e)}
          onKeyPress={(e) => this.onKeyPress(e)}
        />
      </div>
    )
  }
  render() {
    if (!this.props.currentRoom) {
      return <p>Join a room to see messages</p>
    }
    if (this.state.isFetchingMessages) {
      return <p>...Loading</p>
    }
    return (
      <div style={{ width: '100%', height: '100%' }}>
        {
          this.renderMessages()
        }
        {
          this.renderReplyBox()
        }
      </div>
    )
  }
}

export default ChatRoom;