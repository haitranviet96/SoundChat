# app/rooms/apis.py
import datetime

from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_restful import reqparse
from werkzeug.utils import secure_filename

import app
from app import db, s3
from app.models import Room, joins, User, Song
from . import rooms

room_parser = reqparse.RequestParser()
room_parser.add_argument('name', help='This field cannot be blank', required=True)

room_update_parser = reqparse.RequestParser()
room_update_parser.add_argument('id', help='This field cannot be blank', required=True)

ALLOWED_EXTENSIONS = {'mp3'}


@rooms.route('/rooms', methods=['GET'])
@jwt_required
def list_room():
    """
    Return the rooms list base on variable on the / route
    """
    user_id = request.args.get('user_id')
    join = request.args.get('join')
    limit = request.args.get('limit')

    if join is None:
        room_list = Room.query.all()
    else:
        if join == 'true':
            room_list = Room.query.filter(Room.members.any(id=user_id)) \
                .limit(limit if limit is not None else 15).all()
        else:
            room_list = Room.query.outerjoin(joins, joins.c.user_id == user_id) \
                .filter().limit(limit if limit is not None else 15).all()
    return jsonify(room_list)


@rooms.route('/rooms', methods=['POST'])
@jwt_required
def create_room():
    """
    Create the room
    """
    user_id = request.args.get('user_id')
    data = room_parser.parse_args()
    if data['songs'] is None:
        return {'message': 'You have to upload at least one song'}
    if Room.find_by_name(data['name']):
        return {'message': 'Room {} already exists'.format(data['name'])}
    current_user = get_jwt_identity()
    if user_id is None:
        return {'message': 'user_id can not be null.'}, 400
    elif user_id != User.find_by_username(current_user).id:
        return {'message': 'You are not authorized.'}, 401
    else:
        print(request.json)
        room = Room(name=data['name'])
        songs = data.getlist("songs")
        db.add(room)
        for song in songs:
            if song.filename == "":
                return "Please select a file"
            song_name = secure_filename(song.filename)
            link = upload_file_to_s3(song, app.app_config.S3_BUCKET)
            db.add(Song(song_name, link, room.id))
        db.commit()
        return jsonify(room)


def upload_file_to_s3(file, bucket_name, acl="public-read"):
    try:
        s3.upload_fileobj(file, bucket_name, file.filename,
                          ExtraArgs={
                              "ACL": acl,
                              "ContentType": file.content_type
                          }
                          )
    except Exception as e:
        print("Something Happened: ", e)
        return e
    return "{}{}".format(app.app_config.S3_LOCATION, file.filename)


@rooms.route('/rooms', methods=['PUT'])
@jwt_required
def edit_room():
    user_id = request.args.get('user_id')
    data = room_update_parser.parse_args()

    # Room.update().where(Room.id == data['id']).values(owner_id=1, current_song_id=1, time_play=datetime.datetime.utcnow)

    return jsonify(Room.query.filter_by(id=data['id']).first())
