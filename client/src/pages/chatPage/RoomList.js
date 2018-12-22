import React from 'react';
import 'whatwg-fetch'

import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import Collapse from '@material-ui/core/Collapse';
import ExpandLess from '@material-ui/icons/ExpandLess';
import ExpandMore from '@material-ui/icons/ExpandMore';
import StarBorder from '@material-ui/icons/StarBorder';
import ExposurePlus1 from "@material-ui/icons/ExposurePlus1";
import MeetingRoom from "@material-ui/icons/MeetingRoom";
import People from "@material-ui/icons/People";
import Delete from "@material-ui/icons/Delete";

import CreateNewRoomModal from "./CreateNewRoomModal";

import { API_URL } from '../../utils/config'

class RoomList extends React.Component {
  state = {
    joinedRoomsOpened: true,
    availableRoomsOpened: true,
    joinedRooms: [],
    availableRooms: [],
    createNewRoomModalOpened: false,
    socket: null
  }

  componentDidMount = () => {
    this.fetchJoinedRooms()
    this.fetchAvailableRooms()
  }
  componentWillReceiveProps = (nextProps) => {
    if (!this.state.socket && nextProps.socket) {
      nextProps.socket.on('member', (data) => {
        console.log('member', data)
      })
      this.setState({ socket: nextProps.socket })
    }
  }

  fetchJoinedRooms = () => {
    fetch(`${API_URL}/rooms?join=true`, {
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
        'Authorization': `Bearer ${this.props.accessToken}`
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
  joinRoom = (room) => {
    fetch(`${API_URL}/rooms/${room.id}/members?`, {
      method: 'POST',
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
          this.props.openRoom(room);
          this.fetchJoinedRooms();
          this.fetchAvailableRooms();
          this.state.socket.emit('join', {
            room_id: this.props.roomId
          })
        }
      }).catch((ex) => {
        console.log('parsing failed', ex)
      })
  }
  exitRoom = (room) => {
    fetch(`${API_URL}/rooms/${room.id}/members?`, {
      method: 'DELETE',
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
          if (this.props.roomId === room.id) this.props.openRoom(null);
          this.fetchJoinedRooms();
          this.fetchAvailableRooms();
          this.state.socket.emit('leave', {
            room_id: this.props.roomId
          })
        }
      }).catch((ex) => {
        console.log('parsing failed', ex)
      })
  }

  render() {
    return (
      <List component="nav">

        <ListItem button onClick={() => this.setState({ createNewRoomModalOpened: true })}>
          <ListItemIcon>
            <ExposurePlus1 />
          </ListItemIcon>
          <ListItemText inset primary="Create new room" />
        </ListItem>
        <CreateNewRoomModal
          openRoom={(data) => { this.props.openRoom(data); this.fetchJoinedRooms(); }}
          accessToken={this.props.accessToken}
          userId={this.props.userId}
          open={this.state.createNewRoomModalOpened}
          closeCreateNewRoomModal={() => this.setState({ createNewRoomModalOpened: false })}
        ></CreateNewRoomModal>

        <ListItem button onClick={() => this.setState({ joinedRoomsOpened: !this.state.joinedRoomsOpened })}>
          <ListItemIcon>
            <MeetingRoom />
          </ListItemIcon>
          <ListItemText inset primary="Your Rooms" />
          {this.state.joinedRoomsOpened ? <ExpandLess /> : <ExpandMore />}
        </ListItem>
        <Collapse in={this.state.joinedRoomsOpened} timeout="auto" unmountOnExit>
          {
            this.state.joinedRooms.length > 0
              ? (
                <List component="div" disablePadding>
                  {
                    this.state.joinedRooms.map((room, index) => {
                      return (
                        <ListItem button key={index}>
                          <ListItemIcon>
                            <StarBorder style={{ display: room.owner_id === parseInt(this.props.userId) ? '' : 'none' }} />
                          </ListItemIcon>
                          <ListItemText inset primary={room.name} onClick={() => this.props.openRoom(room)} />
                          <ListItemIcon onClick={() => this.exitRoom(room)}>
                            <Delete />
                          </ListItemIcon>
                        </ListItem>
                      )
                    })
                  }
                </List>
              ) : (
                <List component="div" disablePadding>
                  <ListItem button>
                    <ListItemText inset primary="You haven't join any rooms" />
                  </ListItem>
                </List>
              )
          }
        </Collapse>

        <ListItem button onClick={() => this.setState({ availableRoomsOpened: !this.state.availableRoomsOpened })}>
          <ListItemIcon>
            <People />
          </ListItemIcon>
          <ListItemText inset primary="Available Rooms" />
          {this.state.availableRoomsOpened ? <ExpandLess /> : <ExpandMore />}
        </ListItem>
        <Collapse in={this.state.availableRoomsOpened} timeout="auto" unmountOnExit>
          {
            this.state.availableRooms.length > 0
              ? (
                <List component="div" disablePadding>
                  {
                    this.state.availableRooms.map((room, index) => {
                      return (
                        <ListItem button key={index} onClick={() => this.joinRoom(room)}>
                          <ListItemIcon>
                            <StarBorder style={{ display: 'none' }} />
                          </ListItemIcon>
                          <ListItemText inset primary={room.name} />
                        </ListItem>
                      )
                    })
                  }
                </List>
              ) : (
                <List component="div" disablePadding>
                  <ListItem button>
                    <ListItemText inset primary="There are currently no available rooms" />
                  </ListItem>
                </List>
              )
          }
        </Collapse>

      </List>
    )
  }
}

export default RoomList;