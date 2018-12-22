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
  mediaProps = null;

  state = {
    playlist: [],
    autoPlay: true,
    repeatTrack: false,
    currentTrack: {},
    status: 'playing',
    shuffle: false,
    time_play: null
  }

  componentWillReceiveProps = (nextProps) => {
    if (
      (!this.props.currentRoom && nextProps.currentRoom)
      || (this.props.currentRoom && nextProps.currentRoom
        && this.props.currentRoom.id !== nextProps.currentRoom.id)
    ) {
      this.setState({
        isFetchingPlaylist: true,
        status: nextProps.currentRoom.status,
        time_play: nextProps.currentRoom.time_play,
        autoPlay: nextProps.currentRoom.status === 'playing'
      })
      this.fetchPlaylist(nextProps.currentRoom.id)
      // if (nextProps.currentRoom.owner_id === nextProps.userId) {
      //   this.updateCurrentPlayingStatus(nextProps.currentRoom.id, {
      //     current_song_id: nextProps.currentRoom.current_song_id,
      //     repeat: nextProps.currentRoom.repeat,
      //     shuffle: nextProps.currentRoom.shuffle,
      //     status: nextProps.currentRoom.status
      //   })
      // }
    }

    if (!this.props.socket && nextProps.socket) {
      nextProps.socket.on('song', (res) => {
        // console.log('song', res)
        if (this.props.currentRoom && res.data.room_id === this.props.currentRoom.id) {
          this.props.updateCurrentRoomData({
            time_play: res.data.data.time_play,
            repeatTrack: res.data.data.repeat,
            shuffle: res.data.data.shuffle,
            status: res.data.data.status,
            autoPlay: res.data.data.status === 'playing',
            currentTrack: this.state.playlist.find(song => song.id === res.data.data.current_song_id) || this.state.currentTrack
          })
          this.setState({
            time_play: res.data.data.time_play,
            repeatTrack: res.data.data.repeat,
            shuffle: res.data.data.shuffle,
            status: res.data.data.status,
            autoPlay: res.data.data.status === 'playing',
            currentTrack: this.state.playlist.find(song => song.id === res.data.data.current_song_id) || this.state.currentTrack
          })
          if (res.data.data.status === 'playing') this.forcePlay()
          else this.forcePause()
        }
      })
      nextProps.socket.on('playlist', (res) => {
        // console.log('playlist', res)
        if (this.props.currentRoom && res.data.room_id === this.props.currentRoom.id) {
          this.state.playlist.push(res.data.data)
          this.setState({ playlist: this.state.playlist })
        }
      })
    }
  }

  onFileUploadChange = (e) => {
    if (e.target.files[0].type !== 'audio/mp3') {
      alert('Files must be in mp3 format')
      return;
    }

    const formData = new FormData();
    formData.append('song', e.target.files[0]);

    fetch(`${API_URL}/rooms/${this.props.currentRoom.id}/playlist`, {
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
        if (json.status === 'success') {
          this.setState({
            playlist: json.data,
            currentTrack: this.props.currentRoom
              ? json.data.find(song => song.id === this.props.currentRoom.current_song_id)
              : json.data[0],
            isFetchingPlaylist: false
          })
        }
      }).catch((ex) => {
        console.log('parsing failed', ex)
      })
  }
  updateCurrentPlayingStatus = (roomId, data) => {
    fetch(`${API_URL}/rooms/${roomId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.props.accessToken}`
      },
      body: JSON.stringify(data)
    })
      .then((response) => {
        return response.json()
      })
      .then((json) => {
        if (json.status === 'error') alert(json.message)
      }).catch((ex) => {
        console.log('parsing failed', ex)
      })
  }

  _handleTrackClick = track => {
    this.setState({ currentTrack: track })
    this.props.updateCurrentRoomData({
      current_song_id: track.id,
      repeat: this.state.repeatTrack,
      shuffle: this.state.shuffle,
      status: this.state.status
    })
    this.updateCurrentPlayingStatus(this.props.currentRoom.id, {
      current_song_id: track.id,
      repeat: this.state.repeatTrack,
      shuffle: this.state.shuffle,
      status: this.state.status
    })
  }
  _navigatePlaylist = direction => {
    const newIndex = mod(
      this.state.playlist.indexOf(this.state.currentTrack) + direction,
      this.state.playlist.length
    )
    this.setState({ currentTrack: this.state.playlist[newIndex] })
    this.props.updateCurrentRoomData({
      current_song_id: this.state.playlist[newIndex].id,
      repeat: this.state.repeatTrack,
      shuffle: this.state.shuffle,
      status: this.state.status
    })
    this.updateCurrentPlayingStatus(this.props.currentRoom.id, {
      current_song_id: this.state.playlist[newIndex].id,
      repeat: this.state.repeatTrack,
      shuffle: this.state.shuffle,
      status: this.state.status
    })
  }
  forcePause = () => {
    if (
      (this.props.currentRoom && this.props.userId
        && this.props.currentRoom.owner_id === this.props.userId)
      || !this.mediaProps
    ) return;
    this.mediaProps.pause()
  }
  forcePlay = () => {
    if (
      (this.props.currentRoom && this.props.userId
        && this.props.currentRoom.owner_id === this.props.userId)
      || !this.mediaProps
    ) return;
    this.mediaProps.play()
  }
  pause = () => {
    this.setState({ autoPlay: false })
    this.updateCurrentPlayingStatus(this.props.currentRoom.id, {
      current_song_id: this.state.currentTrack.id,
      repeat: this.state.repeatTrack,
      shuffle: this.state.shuffle,
      status: this.state.status === 'playing' ? 'pause' : 'playing',
    })
  }

  renderMediaplayer = () => {
    const { currentTrack, repeatTrack, autoPlay, time_play } = this.state
    const utcTime = new Date(time_play);
    const realTime = new Date(Date.UTC(
      utcTime.getFullYear(),
      utcTime.getMonth(),
      utcTime.getDate(),
      utcTime.getHours(),
      utcTime.getMinutes(),
      utcTime.getSeconds()
    ))

    if (this.state.isFetchingPlaylist) {
      return (
        <div>...Loading</div>
      )
    }

    if (this.props.currentRoom && this.props.userId
      && this.props.currentRoom.owner_id === this.props.userId
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
            onPause={() => this.pause()}
            pause={this.pause}
            setMediaProps={(ref) => this.mediaProps = ref}
            onEnded={() => !repeatTrack && this._navigatePlaylist(1)}
            customStartTime={(new Date().getTime() - realTime.getTime()) / 1000}
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
          setMediaProps={(ref) => this.mediaProps = ref}
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
    if (this.props.currentRoom && this.props.currentRoom.id) {
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