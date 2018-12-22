import React from 'react';
import 'whatwg-fetch';

import MediaPlayer from './MediaPlayer'

import { API_URL } from '../../../utils/config';

import "./main.scss";

import Button from '@material-ui/core/Button';

const mod = (num, max) => ((num % max) + max) % max

class Playlist extends React.Component {
  _handleTrackClick(track) {
    this.props.onTrackClick(track)
  }

  render() {
    const { tracks, currentTrack } = this.props
    return (
      <aside className="media-playlist">
        <header className="media-playlist-header">
          <h3 className="media-playlist-title">Playlist</h3>
        </header>
        <ul className="media-playlist-tracks">
          {
            tracks.map((track, index) => (
              <li
                key={index}
                className={`media-playlist-track ${
                  track === currentTrack ? 'is-active' : ''
                  }`}
                onClick={this._handleTrackClick.bind(this, track)}
              >
                {track.name}
              </li>
            ))
          }
        </ul>
      </aside>
    )
  }
}

class MusicPlayer extends React.Component {
  state = {
    playlist: [],
    autoPlay: true,
    repeatTrack: false,
    currentTrack: {},
    socket: null,
    status: null,
    shuffle: false,
    time_play: null
  }

  componentWillReceiveProps = (nextProps) => {
    if (nextProps.roomId) {
      this.setState({ isFetchingPlaylist: true })
      this.fetchPlaylist(nextProps.roomId)
    }
    if (!this.state.socket && nextProps.socket) {
      nextProps.socket.on('song', (data) => {
        console.log('song', data)
        this.setState({
          time_play: data.data.data.time_play,
          repeatTrack: data.data.data.repeat,
          shuffle: data.data.data.shuffle,
          status: data.data.data.status,
          currentTrack: this.state.playlist.find(song => song.id === data.data.data) || this.state.currentTrack
        })
      })
      nextProps.socket.on('playlist', (data) => {
        console.log('playlist', data)
        this.state.playlist.push(data.data.data)
        this.setState({ playlist: this.state.playlist })
      })
      this.setState({ socket: nextProps.socket })
    }
    if (nextProps.currentRoom && !this.state.status && !this.state.time_play) {
      this.setState({
        time_play: nextProps.currentRoom.time_play,
        status: nextProps.currentRoom.status
      })
    }
  }

  onFileUploadChange = (e) => {
    const formData = new FormData();
    formData.append('song', e.target.files[0]);

    fetch(`${API_URL}/rooms/${this.props.roomId}/playlist`, {
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
        // if (json.status === 'success') {
        //   this.state.playlist.push(json.data)
        //   this.setState({ playlist: this.state.playlist })
        // }
      }).catch((ex) => {
        console.log('parsing failed', ex)
      })
  }
  fetchPlaylist = (roomId) => {
    fetch(`${API_URL}/rooms/${roomId}/playlist`, {
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
        if (json.status === 'success') this.setState({
          playlist: json.data,
          currentTrack: !this.state.currentTrack.name ? json.data[0] : this.state.currentTrack,
          isFetchingPlaylist: false
        })
      }).catch((ex) => {
        console.log('parsing failed', ex)
      })
  }
  _handleTrackClick = track => {
    this.setState({ currentTrack: track })
  }
  _navigatePlaylist = direction => {
    const newIndex = mod(
      this.state.playlist.indexOf(this.state.currentTrack) + direction,
      this.state.playlist.length
    )
    this.setState({ currentTrack: this.state.playlist[newIndex] })
    fetch(`${API_URL}/rooms/${this.props.roomId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.props.accessToken}`
      },
      body: JSON.stringify({
        current_song_id: this.state.playlist[newIndex].id,
        repeat: this.state.repeatTrack,
        shuffle: this.state.shuffle,
        status: this.state.status
      })
    })
      .then((response) => {
        return response.json()
      })
      .then((json) => {
      }).catch((ex) => {
        console.log('parsing failed', ex)
      })
  }

  renderMediaplayer = () => {
    const { currentTrack, repeatTrack, autoPlay } = this.state
    // console.log(this.props.currentRoom)
    console.log(this.state)
    if (this.state.isFetchingPlaylist) {
      return (
        <div>...Loading</div>
      )
    }

    if (this.props.currentRoom && sessionStorage.getItem('soundchat-user-id')
      && this.props.currentRoom.owner_id.toString() === sessionStorage.getItem('soundchat-user-id')
    ) {
      return (
        <div className="media-player-wrapper">
          <MediaPlayer
            ref={c => (this._mediaPlayer = c)}
            src={currentTrack.link}
            autoPlay={autoPlay}
            loop={repeatTrack}
            currentTrack={currentTrack.name}
            repeatTrack={repeatTrack}
            onPrevTrack={() => this._navigatePlaylist(-1)}
            onNextTrack={() => this._navigatePlaylist(1)}
            onRepeatTrack={() => {
              this.setState({ repeatTrack: !repeatTrack })
            }}
            onPlay={() => !autoPlay && this.setState({ autoPlay: true })}
            onPause={() => this.setState({ autoPlay: false })}
            onEnded={() => !repeatTrack && this._navigatePlaylist(1)}
          />
          <Playlist
            tracks={this.state.playlist}
            currentTrack={currentTrack}
            onTrackClick={this._handleTrackClick}
          />
        </div>
      )
    }
    return (
      <div className="media-player-wrapper">
        <MediaPlayer
          ref={c => (this._mediaPlayer = c)}
          src={currentTrack.link}
          autoPlay={autoPlay}
          loop={repeatTrack}
          currentTrack={currentTrack.name}
          repeatTrack={repeatTrack}
          notOwner={true}
          onPrevTrack={() => { }}
          onNextTrack={() => { }}
          onRepeatTrack={() => { }}
          onPlay={() => { }}
          onPause={() => { }}
          onEnded={() => !repeatTrack && this._navigatePlaylist(1)}
          customStartTime={(new Date().getTime() - new Date(this.state.time_play).getTime()) / 1000}
        />
        <Playlist
          tracks={this.state.playlist}
          currentTrack={currentTrack}
          onTrackClick={() => { }}
        />
      </div>
    )
  }
  render() {
    if (this.props.roomId) {
      return (
        <div>
          <div>
            <Button onClick={() => {
              if (this.fileInput) this.fileInput.click()
            }}
              color="primary"
              variant="contained"
            >+ Add a song</Button>
            <input
              type="file" style={{ display: 'none' }}
              ref={ref => { this.fileInput = ref }}
              onChange={(e) => this.onFileUploadChange(e)}
              accept="audio/*"
            ></input>
          </div>
          <br></br><br></br>
          {
            this.renderMediaplayer()
          }
        </div>
      )
    }
    return (
      <div>Join a room to listen to music</div>
    )
  }
}

export default MusicPlayer;