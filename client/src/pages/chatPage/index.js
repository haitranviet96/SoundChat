import React from 'react';
import { Redirect } from 'react-router-dom'

import io from 'socket.io-client';

import Grid from '@material-ui/core/Grid';

import ChatRoom from "./ChatRoom";
import MusicPlayer from "./musicPlayer";
import RoomList from "./RoomList";

import { API_URL } from "../../utils/config";

class ChatPage extends React.Component {
  state = {
    joinedRooms: [],
    availableRooms: [],
    currentRoom: null,
    currentMembers: [],
    socket: null,
  }


  openRoom = (room) => {
    this.setState({ currentRoom: room })
    this.fetchMembers(room.id)
  }
  exitRoom = () => {
    this.setState({ currentMembers: [], currentRoom: null })
  }
  fetchJoinedRooms = () => {
    fetch(`${API_URL}/rooms?join=true`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.props.authInfo.accessToken}`
      }
    })
      .then((response) => {
        return response.json()
      })
      .then((json) => {
        if (json.status === 'success') this.setState({ joinedRooms: json.data })
      }).catch((ex) => {
        console.log('parsing failed', ex)
      })
  }
  fetchAvailableRooms = () => {
    fetch(`${API_URL}/rooms?join=false`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.props.authInfo.accessToken}`
      }
    })
      .then((response) => {
        return response.json()
      })
      .then((json) => {
        if (json.status === 'success') this.setState({ availableRooms: json.data })
      }).catch((ex) => {
        console.log('parsing failed', ex)
      })
  }
  fetchRooms = () => {
    this.fetchAvailableRooms()
    this.fetchJoinedRooms()
  }
  fetchMembers = (roomId) => {
    fetch(`${API_URL}/rooms/${roomId}/members`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.props.authInfo.accessToken}`
      }
    })
      .then((response) => {
        return response.json()
      })
      .then((json) => {
        if (json.status === 'success') this.setState({ currentMembers: json.data })
      }).catch((ex) => {
        console.log('parsing failed', ex)
      })
  }
  updateCurrentRoomData = (data) => {
    if (this.state.currentRoom) {
      this.setState({
        ...this.state.currentRoom,
        ...data
      })
    }
  }

  componentDidMount = () => {
    if (!this.state.socket && this.props.authInfo.accessToken) {
      const socket = io(API_URL, { query: { jwt: this.props.authInfo.accessToken } });
      if (socket) {
        socket.connect();
        socket.on('my response', () => {
          this.setState({ socket })
        })
      }
    }
    if (this.state.socket && !this.props.authInfo.accessToken) {
      this.state.socket.disconnect()
      this.setState({ socket: null })
    }
    if (this.props.authInfo.accessToken) this.fetchRooms()
  }

  render() {
    const { accessToken } = this.props.authInfo
    // console.log(this.state)

    if (!accessToken) {
      return <Redirect to='/login' />
    }

    return (
      <Grid container justify="center" spacing={0} style={{ height: '100%' }}>
        <Grid item xs={3} style={{ borderRight: '1px #DCDCDC solid' }}>
          <RoomList
            socket={this.state.socket}
            openRoom={this.openRoom}
            fetchRooms={this.fetchRooms}
            joinedRooms={this.state.joinedRooms}
            availableRooms={this.state.availableRooms}
            accessToken={this.props.authInfo.accessToken}
            userId={this.props.authInfo.userId}
            currentRoom={this.state.currentRoom}
            members={this.state.currentMembers}
            exitRoom={this.exitRoom}
            fetchMembers={this.fetchMembers}
          ></RoomList>
        </Grid>
        <Grid item xs={6} style={{ borderRight: '1px #DCDCDC solid' }}>
          <ChatRoom
            socket={this.state.socket}
            currentRoom={this.state.currentRoom}
            userId={this.props.authInfo.userId}
            accessToken={this.props.authInfo.accessToken}
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
                accessToken={this.props.authInfo.accessToken}
                userId={this.props.authInfo.userId}
                currentRoom={this.state.currentRoom}
                updateCurrentRoomData={this.state.updateCurrentRoomData}
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