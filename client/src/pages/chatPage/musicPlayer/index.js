import React from 'react';
import 'whatwg-fetch';
import { Media, Player, controls, withMediaProps } from 'react-media-player'

import MediaPlayer from './MediaPlayer'

import { API_URL } from '../../../utils/config';

import "./main.scss";

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
    currentTrack: {}
  }

  componentWillReceiveProps = (nextProps) => {
    if (nextProps.roomId) {
      this.setState({ isFetchingPlaylist: true })
      this.fetchPlaylist(nextProps.roomId)
    }
  }

  fetchPlaylist = (roomId) => {
    fetch(`${API_URL}/rooms/${roomId}/playlist?user_id=${this.props.userId}`, {
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
  }

  render() {
    const { currentTrack, repeatTrack, autoPlay } = this.state

    if (this.props.roomId && !this.state.isFetchingPlaylist) {
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
      <div></div>
    )
  }
}

export default MusicPlayer;