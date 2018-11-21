# app/models.py

from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash

from app import db, login_manager

joins = db.Table('joins',
                 db.Column('user_id', db.Integer, db.ForeignKey('users.id', use_alter=True)),
                 db.Column('room_id', db.Integer, db.ForeignKey('rooms.id', use_alter=True)),
                 db.Column('unread_message_count', db.Integer)
                 )


class User(UserMixin, db.Model):
    """
    Create an User table
    """

    # Ensures table will be named in plural and not in singular
    # as is the name of the model
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(60), index=True, unique=True)
    password_hash = db.Column(db.String(128))
    joined_room = db.relationship('Room', secondary=joins, backref=db.backref('members', lazy='dynamic'))
    owners = db.relationship('Room', backref='owner', lazy='dynamic')

    @property
    def password(self):
        """
        Prevent pasword from being accessed
        """
        raise AttributeError('password is not a readable attribute.')

    @password.setter
    def password(self, password):
        """
        Set password to a hashed password
        """
        self.password_hash = generate_password_hash(password)

    def verify_password(self, password):
        """
        Check if hashed password matches actual password
        """
        return check_password_hash(self.password_hash, password)

    def __repr__(self):
        return '<User: {}>'.format(self.username)


# Set up user_loader
@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


class Song(db.Model):
    """
    Create a Song table
    """

    __tablename__ = 'songs'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(60))
    link = db.Column(db.String(200))
    room_id = db.Column(db.Integer, db.ForeignKey('rooms.id'))

    def __repr__(self):
        return '<Song: {}>'.format(self.name)


class Room(db.Model):
    """
    Create a Room table
    """

    __tablename__ = 'rooms'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(60), unique=True)
    owner_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    status = db.Column(db.String(10))
    current_song_id = db.Column(db.Integer, db.ForeignKey('songs.id', use_alter=True))
    time_play = db.Column(db.Date)
    repeat = db.Column(db.Boolean, default=False)
    shuffle = db.Column(db.Boolean, default=False)
    playlist = db.relationship('Song', foreign_keys=lambda: Song.room_id, backref='room', lazy='dynamic')
    current_song = db.relationship("Song", foreign_keys=[current_song_id])

    def __repr__(self):
        return '<Room: {}>'.format(self.name)
