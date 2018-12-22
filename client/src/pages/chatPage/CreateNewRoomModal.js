import React from 'react';
import 'whatwg-fetch'

import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
// import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import FormControl from '@material-ui/core/FormControl';
import FormHelperText from '@material-ui/core/FormHelperText';

import { API_URL } from '../../utils/config'

class CreateNewRoomModal extends React.Component {
  state = {
    name: '',
    nameError: false,
    nameErrorText: '',
    song: null,
    songError: false,
    songErrorText: '',
    creatingRoom: false,
  }

  onNameChange = (e) => {
    this.setState({ name: e.target.value.trim(), nameError: false })
  }
  onFileUploadChange = (e) => {
    this.setState({ song: e.target.files[0], songError: false })
  }

  createRoom = () => {
    if (this.state.song.type !== 'audio/mp3') {
      this.setState({
        songError: true,
        songErrorText: 'Files must be in mp3 format.'
      })
      return;
    }

    this.setState({ creatingRoom: true })

    const formData = new FormData();
    formData.append('name', this.state.name);
    formData.append('song', this.state.song);

    fetch(`${API_URL}/rooms`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.props.accessToken}`
      },
      body: formData
    })
      .then((response) => {
        return response.json()
      })
      .then((json) => {
        console.log(json)
        if (json.status === 'success') {
          this.props.openRoom(json.data)
          this.props.closeCreateNewRoomModal()
          this.setState({
            song: null,
            name: '',
          })
        } else if (json.status === 'error') {
          if (json.message.includes(this.state.name)) {
            this.setState({
              nameError: true,
              nameErrorText: json.message,
            })
          }
          if (json.message.includes('Files must be in mp3 format.')) {
            this.setState({
              songError: true,
              songErrorText: json.message
            })
          }
        }
        this.setState({ creatingRoom: false })
      }).catch((ex) => {
        console.log('parsing failed', ex)
        this.setState({ creatingRoom: false })
      })
  }

  render() {
    return (
      <Dialog
        fullWidth
        maxWidth={'lg'}
        open={this.props.open}
        onClose={this.props.closeCreateNewRoomModal}
        aria-labelledby="max-width-dialog-title"
      >
        <DialogTitle id="max-width-dialog-title">Create new room</DialogTitle>
        <DialogContent>
          <FormControl error>
            <TextField
              label="Name"
              margin="normal"
              variant="outlined"
              value={this.state.name}
              onChange={(e) => this.onNameChange(e)}
            />
            <FormHelperText style={{ display: this.state.nameError ? '' : 'none' }}>
              {this.state.nameErrorText}
            </FormHelperText>
          </FormControl>
          &nbsp;&nbsp;
          <Button style={{ marginTop: 25 }} onClick={() => { if (this.fileInput) this.fileInput.click() }} color="primary" variant="contained">
            Choose a song
          </Button>
          &nbsp;&nbsp;
          <FormControl error>
            <TextField
              margin="normal"
              variant="outlined"
              InputProps={{
                readOnly: true,
              }}
              style={{ width: 500 }}
              value={this.state.song ? this.state.song.name : ''}
            />
            <FormHelperText style={{ display: this.state.songError ? '' : 'none' }}>
              {this.state.songErrorText}
            </FormHelperText>
          </FormControl>
          <input
            type="file" style={{ display: 'none' }}
            ref={ref => { this.fileInput = ref }}
            onChange={(e) => this.onFileUploadChange(e)}
            accept="audio/*"
          ></input>
        </DialogContent>
        <DialogActions>
          <Button
            disabled={this.state.name.trim() === '' || !this.state.song || this.state.creatingRoom}
            onClick={() => { this.createRoom(); }}
            color="primary" variant="contained">
            Create room
          </Button>
          <Button onClick={this.props.closeCreateNewRoomModal} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    )
  }
}

export default CreateNewRoomModal;