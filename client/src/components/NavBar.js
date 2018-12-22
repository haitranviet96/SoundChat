import React from 'react';
import PropTypes from 'prop-types';

import { withStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';

const styles = {
  root: {
    flexGrow: 1,
  },
  grow: {
    flexGrow: 1,
  },
  menuButton: {
    marginLeft: -12,
    marginRight: 20,
  },
};

class NavBar extends React.Component {
  state = {
    auth: true,
    anchorEl: null,
    redirect: false
  };

  handleMenu = event => {
    this.setState({ anchorEl: event.currentTarget });
  };

  handleClose = () => {
    this.setState({ anchorEl: null });
  };

  render() {
    const { anchorEl } = this.state;
    const { classes } = this.props
    const open = Boolean(anchorEl);
    const { userName, accessToken } = this.props.authInfo

    return (
      <div className={classes.root}>
        <AppBar position="static">
          <Toolbar>
            <IconButton className={classes.menuButton} color="inherit" aria-label="Menu">
              {/* <MenuIcon /> */}
            </IconButton>
            <Typography variant="h6" color="inherit" className={classes.grow}>
              Sound Chat {userName ? ' - ' + userName : ''}
            </Typography>
            {
              !!accessToken
                ? (
                  <div>
                    <IconButton
                      aria-owns={open ? 'menu-appbar' : undefined}
                      aria-haspopup="true"
                      // onClick={this.handleMenu}
                      color="inherit"
                    >
                      <span
                        style={{ fontSize: '70%' }}
                        onClick={() => {
                          sessionStorage.removeItem('soundchat-access-token')
                          sessionStorage.removeItem('soundchat-user-id')
                          sessionStorage.removeItem('soundchat-user')
                          this.props.clearAuthInfo()
                        }}
                      >
                        Logout
                      </span>
                    </IconButton>
                  </div>
                ) : null
            }
          </Toolbar>
        </AppBar>
      </div>
    );
  }
}

NavBar.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(NavBar);