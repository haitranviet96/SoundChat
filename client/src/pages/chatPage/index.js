import React from 'react';
import { Redirect } from 'react-router-dom'

import Grid from '@material-ui/core/Grid';

import ChatRoom from "./ChatRoom";
import MusicPlayer from "./musicPlayer";
import RoomList from "./RoomList";

class ChatPage extends React.Component {
  state = {
    currentRoom: null
  }
  openRoom = (room) => {
    this.setState({ currentRoom: room })
  }

  render() {
    const accessToken = sessionStorage.getItem('soundchat-access-token')
    if (this.state.currentRoom) console.log(this.state.currentRoom)

    if (!accessToken) {
      return <Redirect to='/login' />
    }

    return (
      <Grid container justify="center" spacing={0} style={{ height: '100%' }}>
        <Grid item xs={3} style={{ borderRight: '1px #DCDCDC solid' }}>
          <RoomList
            openRoom={this.openRoom}
            accessToken={accessToken}
            userId={sessionStorage.getItem('soundchat-user-id')}
            username={sessionStorage.getItem('soundchat-user')}
            roomId={this.state.currentRoom ? this.state.currentRoom.id : null}
          ></RoomList>
        </Grid>
        <Grid item xs={6} style={{ borderRight: '1px #DCDCDC solid' }}>
          <ChatRoom></ChatRoom>
        </Grid>
        <Grid item xs={3}>
          <br></br>
          <Grid container justify="center" spacing={0}>
            <Grid item xs={1}></Grid>
            <Grid item xs={10}>
              <MusicPlayer
                container
                accessToken={accessToken}
                userId={sessionStorage.getItem('soundchat-user-id')}
                username={sessionStorage.getItem('soundchat-user')}
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