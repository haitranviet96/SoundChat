import functools

from flask import request
from flask_jwt_extended import decode_token
from flask_socketio import emit, join_room, send, leave_room, disconnect

from app.models import User
from app import socketio


def authenticated_only(f):
    @functools.wraps(f)
    def wrapped(*args, **kwargs):
        jwt = request.args.get('jwt')
        token_decoded = decode_token(jwt)
        if not token_decoded:
            disconnect()
        else:
            current_user = User.find_by_username(token_decoded['identity'])
            return f(current_user, *args, **kwargs)

    return wrapped


@socketio.on('connect')
@authenticated_only
def connect_handler(current_user):
    for room in current_user.joined_room:
        join_room(room.id)
    emit('my response', {'message': '{0} has joined'}, broadcast=True)


@socketio.on('join')
def on_join(data):
    room = data['room']
    join_room(room)
    send(data, room=room)


@socketio.on('leave')
def on_leave(data):
    room = data['room']
    leave_room(room)
    send(data, room=room)
