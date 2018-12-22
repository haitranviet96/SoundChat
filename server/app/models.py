# app/models.py
import datetime
import enum

from flask_marshmallow import Marshmallow, fields
from marshmallow_enum import EnumField
from werkzeug.security import generate_password_hash, check_password_hash

import app
from app import db

ma = Marshmallow(app)

joins = db.Table('joins',
                 db.Column('user_id', db.Integer, db.ForeignKey('users.id', use_alter=True)),
                 db.Column('room_id', db.Integer, db.ForeignKey('rooms.id', use_alter=True)),
                 db.Column('unread_message_count', db.Integer, default=0)
                 )


class User(db.Model):
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

    def save_to_db(self):
        db.session.add(self)
        db.session.commit()

    @classmethod
    def find_by_username(cls, username):
        return cls.query.filter_by(username=username).first()


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


class RoomStatus(enum.Enum):
    PLAYING = "playing"
    PAUSE = "pause"


class Room(db.Model):
    """
    Create a Room table
    """

    __tablename__ = 'rooms'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(60), unique=True)
    owner_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    status = db.Column(db.Enum(RoomStatus), default=RoomStatus.PLAYING)
    current_song_id = db.Column(db.Integer, db.ForeignKey('songs.id', use_alter=True))
    time_play = db.Column(db.DATETIME, default=datetime.datetime.utcnow)
    repeat = db.Column(db.Boolean, default=False)
    shuffle = db.Column(db.Boolean, default=False)
    playlist = db.relationship('Song', foreign_keys=lambda: Song.room_id, backref='room', lazy='dynamic',
                               cascade="all, delete-orphan")
    current_song = db.relationship("Song", foreign_keys=[current_song_id])
    messages = db.relationship("Message", foreign_keys=lambda: Message.room_id, backref='room', lazy='dynamic',
                               cascade="all, delete-orphan")
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.datetime.utcnow)
    updated_at = db.Column(db.DateTime, onupdate=datetime.datetime.utcnow)

    def __repr__(self):
        return '<Room: {}>'.format(self.name)

    @classmethod
    def find_by_name(cls, name):
        return cls.query.filter_by(name=name).first()


class Message(db.Model):
    """
    Create a Message table
    """
    __tablename__ = 'messages'

    id = db.Column(db.Integer, primary_key=True)
    room_id = db.Column(db.Integer, db.ForeignKey('rooms.id'))
    sender_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    time = db.Column(db.DATETIME, default=datetime.datetime.utcnow)
    content = db.Column(db.Text)
    sender = db.relationship("User", foreign_keys=[sender_id])


##### SCHEMAS #####

class UserSchema(ma.Schema):
    class Meta:
        fields = ('id', 'username')


user_schema = UserSchema()
users_schema = UserSchema(many=True)


class RoomSchema(ma.Schema):
    time_play = fields.fields.DateTime(format='%Y-%m-%d %H:%M:%S')
    status = EnumField(RoomStatus, by_value=True)

    class Meta:
        ordered = True
        fields = ('id', 'name', 'owner_id', 'status', 'current_song_id', 'time_play', 'repeat', 'shuffle')


room_schema = RoomSchema()
rooms_schema = RoomSchema(many=True)


class SongSchema(ma.Schema):
    class Meta:
        ordered = True
        fields = ('id', 'name', 'link')


song_schema = SongSchema()
songs_schema = SongSchema(many=True)


class MessageSchema(ma.Schema):
    time = fields.fields.DateTime(format='%Y-%m-%d %H:%M:%S')

    class Meta:
        ordered = True
        fields = ('id', 'sender_id', 'time', 'content')


message_schema = MessageSchema()
messages_schema = MessageSchema(many=True)
