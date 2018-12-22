import time

from flask import request
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import delete
from werkzeug.utils import secure_filename
from flask_restful import Resource, reqparse

from app import db, s3, socketio
from app.models import Room, joins, User, Song, room_schema, rooms_schema, songs_schema, song_schema, users_schema, \
    messages_schema, Message, message_schema, user_schema, RoomStatus
from instance import config

room_parser = reqparse.RequestParser()
room_parser.add_argument('name', help='This field cannot be blank', required=True)

room_update_parser = reqparse.RequestParser()
room_update_parser.add_argument('current_song_id', type=int, required=True)
room_update_parser.add_argument('repeat', type=bool, required=True)
room_update_parser.add_argument('shuffle', type=bool, required=True)
room_update_parser.add_argument('status', type=str, required=True)

message_parser = reqparse.RequestParser()
message_parser.add_argument('content', required=True)

ALLOWED_EXTENSIONS = {'mp3'}


class Rooms(Resource):
    @jwt_required
    def get(self):
        """
        Return the rooms list base on variable on the / route
        """
        join = request.args.get('join')
        limit = request.args.get('limit')

        current_user = User.find_by_username(get_jwt_identity())

        if join is None:
            room_list = Room.query.all()
        else:
            if join == 'true':
                room_list = current_user.joined_room
            else:
                room_list = Room.query.filter(~Room.members.any(id=current_user.id)) \
                    .limit(limit if limit is not None else 15).all()
        result = rooms_schema.dump(room_list)
        return {"status": "success", "data": result}, 200

    @jwt_required
    def post(self):
        """
        Create the room
        """
        data = room_parser.parse_args()
        if 'song' not in request.files:
            return {"status": "error", 'message': 'You have to upload at least one song'}, 400
        if Room.find_by_name(data['name']):
            return {"status": "error", 'message': 'Room {} already exists'.format(data['name'])}, 400
        current_user = User.find_by_username(get_jwt_identity())
        song = request.files["song"]
        if song.filename == "":
            return {"status": "error", 'message': "Please select a file"}, 400
        elif not (song and allowed_file(song.filename)):
            return {"status": "error", 'message': "Files must be in mp3 format."}, 400
        else:
            link = None
            try:
                room = Room(name=data['name'])
                db.session.add(room)
                song_name = secure_filename(song.filename)
                link = upload_file_to_s3(song, config.S3_BUCKET)
                db.session.flush()
                db.session.execute(joins.insert().values(user_id=current_user.id, room_id=room.id))
                new_song = Song(name=song_name, link=link, room_id=room.id)
                room.current_song_id = new_song.id
                room.current_song = new_song
                room.owner_id = current_user.id
                db.session.add(new_song)
            except Exception as e:
                if link is not None:
                    s3.delete_object(Bucket=config.S3_BUCKET, Key=link[len(config.S3_LOCATION):])
                db.session.rollback()
                print(repr(e))
                return {"status": "error",
                        'message': "Something wrong happen while creating room. Please try again."}, 400
            db.session.commit()
            result = room_schema.dump(room)
            return {"status": "success", "data": result}, 201


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def upload_file_to_s3(file, bucket_name, acl="public-read"):
    splitted_file_name = file.filename.rsplit('.', 1)
    unique_file_name = splitted_file_name[0] + "_" + str(int(time.time())) + "." + splitted_file_name[1]
    try:
        s3.upload_fileobj(file, bucket_name, unique_file_name,
                          ExtraArgs={
                              "ACL": acl,
                              "ContentType": file.content_type
                          }
                          )
    except Exception as e:
        raise e
    return "{}{}".format(config.S3_LOCATION, unique_file_name)


class RoomsDetails(Resource):
    @jwt_required
    def put(self, room_id):
        current_user = User.find_by_username(get_jwt_identity())
        data = room_update_parser.parse_args()
        new_song_id = data['current_song_id']
        song = Song.query.filter_by(id=new_song_id).first()
        room = Room.query.filter_by(id=room_id).first()
        if room.owner_id != current_user.id:
            return {"status": "error", 'message': 'You are not authorized.'}, 401
        elif room is None:
            return {"status": "error", "message": "Room does not exist."}, 400
        elif song is None or song.room_id != room_id:
            return {"status": "error", 'message': "The song is not exist."}, 400
        else:
            if data['status'] == 'pause':
                if room.status == data['status']:
                    return {'status': 'error', 'message': 'Room playlist has already been paused.'}, 400
                else:
                    room.status = RoomStatus.PAUSE
            else:
                room.status = RoomStatus.PLAYING
                room.current_song_id = new_song_id
                room.time_play = time.strftime('%Y-%m-%d %H:%M:%S')
                room.repeat = data['repeat']
                room.shuffle = data['shuffle']
            db.session.commit()
        socketio.emit('song', {'data': {'room_id': room_id, 'action': 'song_change', 'data': room_schema.dump(room),
                                        'message': 'Music player has been changed.'}}, room=room_id)
        return {"status": "success", "data": room_schema.dump(room)}, 200

    @jwt_required
    def get(self, room_id):
        current_user = User.find_by_username(get_jwt_identity())
        room = Room.query.filter_by(id=room_id).first()
        if current_user not in room.members:
            return {"status": "error", 'message': 'You are not in that room.'}, 401
        elif room is None:
            return {"status": "error", "message": "Room does not exist."}, 400
        else:
            return {"status": "success", "data": room_schema.dump(room)}, 200


class RoomsPlaylist(Resource):
    @jwt_required
    def get(self, room_id):
        room = Room.query.filter_by(id=room_id).first()
        if room:
            result = songs_schema.dump(room.playlist)
            return {"status": "success", "data": result}, 200
        else:
            return {"status": "error", "message": "Room does not exist."}, 400

    @jwt_required
    def post(self, room_id):
        song_file = request.files["song"]
        if song_file.filename == "":
            return {"status": "error", 'message': "Please select a file"}, 400
        elif not (song_file and allowed_file(song_file.filename)):
            return {"status": "error", 'message': "Files must be in mp3 format."}, 400
        elif Room.query.filter_by(id=room_id).first() is None:
            return {"status": "error", "message": "Room does not exist."}, 400
        else:
            link = None
            try:
                song_name = secure_filename(song_file.filename)
                link = upload_file_to_s3(song_file, config.S3_BUCKET)
                new_song = Song(name=song_name, link=link, room_id=room_id)
                db.session.add(new_song)
            except Exception as e:
                if link is not None:
                    s3.delete_object(Bucket=config.S3_BUCKET, Key=link[len(config.S3_LOCATION):])
                db.session.rollback()
                print(repr(e))
                return {"status": "error",
                        'message': "Something wrong happen while uploading new song. Please try again."}, 400
            db.session.commit()
            result = song_schema.dump(new_song)
            socketio.emit('playlist', {'data': {'room_id': room_id, 'action': 'song_added', 'data': result,
                                                'message': 'Song ' + song_name + ' has been added.'}}, room=room_id)
            return {"status": "success", "data": result}, 200


class RoomsPlaylistDetails(Resource):
    @jwt_required
    def delete(self, room_id, song_id):
        if song_id is None:
            return {"status": "error",
                    'message': "song_id can not be null"}, 400
        else:
            song = Song.query.filter_by(id=song_id).first()
            if song is None or song.room_id != room_id:
                return {"status": "error",
                        'message': "The song is not exist."}, 400
            if Song.query.filter_by(room_id=room_id).count() == 1:
                return {"status": "error",
                        'message': "The song is the last song in the playlist. You must have at least one song."}, 400
            s3.delete_object(Bucket=config.S3_BUCKET, Key=song.link[len(config.S3_LOCATION):])
            db.session.delete(song)
            db.session.commit()
            socketio.emit('playlist', {'data': {'room_id': room_id, 'action': 'song_deleted', 'song_id': song_id,
                                                'message': 'Song ' + song.name + ' has been deleted.'}}, room=room_id)
            return {"status": "success", "message": song.name + " was deleted."}, 200

    @jwt_required
    def get(self, room_id, song_id):
        if song_id is None:
            return {"status": "error",
                    'message': "song_id can not be null"}, 400
        else:
            song = Song.query.filter_by(id=song_id).first()
            if song is None or song.room_id != room_id:
                return {"status": "error",
                        'message': "The song is not exist."}, 400
            return {"status": "success", "data": song_schema.dump(song)}, 200


class RoomsMembers(Resource):
    @jwt_required
    def post(self, room_id):
        current_user = User.find_by_username(get_jwt_identity())
        room = Room.query.filter_by(id=room_id).first()
        if room is None:
            return {"status": "error", 'message': 'Room does not exist.'}, 400
        elif current_user in room.members:
            return {"status": "error", 'message': 'You are already in this room.'}, 400
        else:
            # user login
            db.session.execute(joins.insert().values(user_id=current_user.id, room_id=room_id))
            db.session.commit()
            socketio.emit('member',
                          {'data': {'room_id': room.id, 'action': 'member_enter',
                                    'data': user_schema.dump(current_user),
                                    'message': 'Member ' + current_user.username + ' enter the room.'}}, room=room_id)
            return {"status": "success", "message": "You successfully enter room " + room.name,
                    "data": room_schema.dump(room)}, 200

    @jwt_required
    def get(self, room_id):
        current_user = User.find_by_username(get_jwt_identity())
        room = Room.query.filter_by(id=room_id).first()
        if room is None:
            return {"status": "error", 'message': 'Room does not exist.'}, 400
        elif current_user not in room.members:
            return {"status": "error", 'message': 'You are not in this room.'}, 400
        else:
            return {"status": "success", "data": users_schema.dump(room.members)}, 200

    @jwt_required
    def delete(self, room_id):
        current_user = User.find_by_username(get_jwt_identity())
        room = Room.query.filter_by(id=room_id).first()
        if room is None:
            return {"status": "error", 'message': 'Room does not exist.'}, 400
        elif current_user not in room.members:
            return {"status": "error", 'message': 'You are not in this room.'}, 400
        elif room.members.count() == 1:
            # delete room + delete song + delete joins
            db.session.execute(
                delete(joins).where(joins.c.user_id == current_user.id).where(joins.c.room_id == room_id))
            room.current_song_id = None
            for song in room.playlist:
                s3.delete_object(Bucket=config.S3_BUCKET, Key=song.link[len(config.S3_LOCATION):])
            db.session.delete(room)
        else:
            if current_user is room.owner:
                # make some one owner , then delete join
                new_owner = room.members[1]
                room.owner_id = new_owner.id
                db.session.execute(
                    delete(joins).where(joins.c.user_id == current_user.id).where(joins.c.room_id == room_id))
                message = "User " + new_owner.name + " becomes room owner." \
                                                     " User " + current_user.name + " left the room."
            else:
                db.session.execute(
                    delete(joins).where(joins.c.user_id == current_user.id).where(joins.c.room_id == room_id))
                message = "User " + current_user.username + " left the room."
            socketio.emit('member', {'data': {'room_id': room_id, 'action': 'member_leave',
                                              'data': user_schema.dump(current_user), 'message': message}},
                          room=room_id)
            db.session.commit()
        return {"status": "success", "message": "You have left the room."}, 200


class RoomsMessages(Resource):
    @jwt_required
    def get(self, room_id):
        room = Room.query.filter_by(id=room_id).first()
        if room is None:
            return {"status": "error", 'message': 'Room does not exist.'}, 400
        else:
            result = messages_schema.dump(room.messages)
            return {"status": "success", "data": result}, 200

    @jwt_required
    def post(self, room_id):
        data = message_parser.parse_args()
        current_user = User.find_by_username(get_jwt_identity())
        room = Room.query.filter_by(id=room_id).first()
        if room is None:
            return {"status": "error", 'message': 'Room does not exist.'}, 400
        elif current_user not in room.members:
            return {"status": "error", 'message': 'You are not in this room.'}, 400
        else:
            message = Message(content=data['content'], sender_id=current_user.id, room_id=room_id)
            db.session.add(message)
            db.session.commit()
            socketio.emit('message',
                          {'data': {'room_id': room_id, 'action': 'message', 'data': message_schema.dump(message)}},
                          room=room_id)
            return {"status": "success", "message": "You sent a message."}, 200
