from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from flask_restful import Resource, reqparse

import app
from app import db, s3
from app.models import Room, joins, User, Song

room_parser = reqparse.RequestParser()
room_parser.add_argument('name', help='This field cannot be blank', required=True)

room_update_parser = reqparse.RequestParser()
room_update_parser.add_argument('id', help='This field cannot be blank', required=True)

ALLOWED_EXTENSIONS = {'mp3'}


class Rooms(Resource):
    @jwt_required
    def get(self):
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
        return {"status": "success", "data": jsonify(room_list)}, 200

    @jwt_required
    def post(self):
        """
        Create the room
        """
        user_id = request.args.get('user_id')
        data = room_parser.parse_args()
        if data['songs'] is None:
            return {"status": "error", 'message': 'You have to upload at least one song'}, 400
        if Room.find_by_name(data['name']):
            return {"status": "error", 'message': 'Room {} already exists'.format(data['name'])}, 400
        current_user = get_jwt_identity()
        if user_id is None:
            return {"status": "error", 'message': 'user_id can not be null.'}, 400
        elif user_id != User.find_by_username(current_user).id:
            return {"status": "error", 'message': 'You are not authorized.'}, 401
        else:
            print(request.json)
            room = Room(name=data['name'])
            songs = data.getlist("songs")
            db.add(room)
            for song in songs:
                if song.filename == "":
                    return "Please select a file"
                song_name = secure_filename(song.filename)
                link = upload_file_to_s3(song, app.config['S3_BUCKET'])
                db.add(Song(song_name, link, room.id))
            db.commit()
            return {"status": "success", "data": jsonify(room)}, 200


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
    return "{}{}".format(app.config['S3_LOCATION'], file.filename)


class RoomsId(Resource):
    @jwt_required
    def put(self, room_id):
        user_id = request.args.get('user_id')
        data = room_update_parser.parse_args()

        # Room.update().where(Room.id == room_id).values(owner_id=1, current_song_id=1, time_play=datetime.datetime.utcnow)

        return {"status": "success", "data": jsonify(Room.query.filter_by(id=room_id).first())}, 200

    @jwt_required
    def get(self, room_id):
        user_id = request.args.get('user_id')
        current_user = get_jwt_identity()
        if user_id is None:
            return {"status": "error", 'message': 'user_id can not be null.'}, 400
        elif user_id != User.find_by_username(current_user).id:
            return {"status": "error", 'message': 'You are not authorized.'}, 401
        else:
            return {"status": "success", "data": jsonify(Room.query.filter_by(id=room_id).first())}, 200
