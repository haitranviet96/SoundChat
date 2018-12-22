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
    membersOpened: true,
    createNewRoomModalOpened: false
  }

  componentWillReceiveProps = (nextProps) => {
    if (!this.props.socket && nextProps.socket) {
      nextProps.socket.on('member', (res) => {
        if (this.props.currentRoom && this.props.currentRoom.id === res.room_id) this.props.fetchMembers(res.room_id)
        this.props.fetchRooms()
      })
    }
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
          this.props.fetchRooms()
          this.props.socket.emit('join', {
            room_id: room.id
          })
        }
      }).catch((ex) => {
        console.log('parsing failed', ex)
      })
  }
  exitRoom = (room) => {
    fetch(`${API_URL}/rooms/${room.id}/members?user_id=${this.props.userId}`, {
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
          if (this.props.currentRoom && this.props.currentRoom.id === room.id) this.props.exitRoom();
          this.props.fetchRooms()
          this.props.socket.emit('leave', {
            room_id: room.id
          })
        }
      }).catch((ex) => {
        console.log('parsing failed', ex)
      })
  }

  render() {
    return (
      <List component="nav">
        {
          this.props.currentRoom
            ? (
              <ListItem>
                <ListItemText inset primary={`In: ${this.props.currentRoom.name}`} />
              </ListItem>
            ) : null
        }
        {
          this.props.currentRoom
            ? (
              <ListItem button onClick={() => this.setState({ membersOpened: !this.state.membersOpened })}>
                <ListItemIcon>
                  <People />
                </ListItemIcon>
                <ListItemText inset primary="Members" />
                {this.state.membersOpened ? <ExpandLess /> : <ExpandMore />}
              </ListItem>
            ) : null
        }
        {
          this.props.currentRoom
            ? (
              <Collapse in={this.state.membersOpened} timeout="auto" unmountOnExit>
                {
                  this.props.members.length > 0
                    ? (
                      <List component="div" disablePadding>
                        {
                          this.props.members.map((member, index) => {
                            return (
                              <ListItem button key={index}>
                                <ListItemIcon>
                                  <StarBorder style={{ display: 'none' }} />
                                </ListItemIcon>
                                <ListItemText inset primary={member.username} />
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
            ) : null
        }
        <ListItem button onClick={() => this.setState({ createNewRoomModalOpened: true })}>
          <ListItemIcon>
            <ExposurePlus1 />
          </ListItemIcon>
          <ListItemText inset primary="Create new room" />
        </ListItem>
        <CreateNewRoomModal
          openRoom={(data) => {
            this.props.openRoom(data);
            this.state.socket.emit('join', {
              room_id: data.id
            });
            this.props.fetchRooms();
          }}
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
            this.props.joinedRooms.length > 0
              ? (
                <List component="div" disablePadding>
                  {
                    this.props.joinedRooms.map((room, index) => {
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
            this.props.availableRooms.length > 0
              ? (
                <List component="div" disablePadding>
                  {
                    this.props.availableRooms.map((room, index) => {
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