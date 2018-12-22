import React from 'react';
import { Redirect } from 'react-router-dom'

import io from 'socket.io-client';

import Grid from '@material-ui/core/Grid';

import ChatRoom from "./ChatRoom";
import MusicPlayer from "./musicPlayer";
import RoomList from "./RoomList";

class ChatPage extends React.Component {
  state = {
    currentRoom: null,
    socket: null
  }
  openRoom = (room) => {
    this.setState({ currentRoom: room })
  }

  componentDidMount = () => {
    if (sessionStorage.getItem('soundchat-access-token')) {
      const socket = io('http://3.0.208.25', { query: { jwt: sessionStorage.getItem('soundchat-access-token') } });
      if (socket) {
        socket.connect();
        socket.on('my response', (data) => {
          this.setState({ socket })
        })
      }
    }
  }
  componentDidUpdate = () => {
    const accessToken = sessionStorage.getItem('soundchat-access-token')
    if (!accessToken && this.state.socket) {
      this.state.socket.disconnect()
      this.setState({ socket: null })
    }
  }

  render() {
    const accessToken = sessionStorage.getItem('soundchat-access-token')

    if (!accessToken) {
      return <Redirect to='/login' />
    }

    return (
      <Grid container justify="center" spacing={0} style={{ height: '100%' }}>
        <Grid item xs={3} style={{ borderRight: '1px #DCDCDC solid' }}>
          <RoomList
            socket={this.state.socket}
            openRoom={this.openRoom}
            accessToken={accessToken}
            userId={sessionStorage.getItem('soundchat-user-id')}
            username={sessionStorage.getItem('soundchat-user')}
            roomId={this.state.currentRoom ? this.state.currentRoom.id : null}
          ></RoomList>
        </Grid>
        <Grid item xs={6} style={{ borderRight: '1px #DCDCDC solid' }}>
          <ChatRoom
            socket={this.state.socket}
            currentRoom={this.state.currentRoom}
            roomId={this.state.currentRoom ? this.state.currentRoom.id : null}
            userId={sessionStorage.getItem('soundchat-user-id')}
            username={sessionStorage.getItem('soundchat-user')}
            accessToken={accessToken}
          ></ChatRoom>
        </Grid>
        <Grid item xs={3}>
          <br></br>
          <Grid container justify="center" spacing={0}>
            <Grid item xs={1}></Grid>
            <Grid item xs={10}>
              <MusicPlayer
                container
                socket={this.state.socket}
                accessToken={accessToken}
                userId={sessionStorage.getItem('soundchat-user-id')}
                username={sessionStorage.getItem('soundchat-user')}
                currentRoom={this.state.currentRoom}
                roomId={this.state.currentRoom ? this.state.currentRoom.id : null}
              ></MusicPlayer>
            </Grid>
            <Grid item xs={1}></Grid>
          </Grid>
        </Grid>
      </Grid>
    )
  }
}

export default ChatPage;