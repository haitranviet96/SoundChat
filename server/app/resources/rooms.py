import time

from flask import request
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from flask_restful import Resource, reqparse

from app import db, s3
from app.models import Room, joins, User, Song, room_schema, rooms_schema
from instance import config

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

        current_user = User.find_by_username(get_jwt_identity())

        if user_id is None:
            return {"status": "error", 'message': 'user_id can not be null.'}, 400
        elif user_id != str(current_user.id):
            return {"status": "error", 'message': 'You are not authorized.'}, 401
        elif join is None:
            room_list = Room.query.all()
        else:
            if join == 'true':
                room_list = current_user.joined_room
            else:
                room_list = Room.query.filter(~Room.members.any(id=user_id)) \
                    .limit(limit if limit is not None else 15).all()
        result = rooms_schema.dump(room_list)
        return {"status": "success", "data": result}, 200

    @jwt_required
    def post(self):
        """
        Create the room
        """
        user_id = request.args.get('user_id')
        data = room_parser.parse_args()
        if 'song' not in request.files:
            return {"status": "error", 'message': 'You have to upload at least one song'}, 400
        if Room.find_by_name(data['name']):
            return {"status": "error", 'message': 'Room {} already exists'.format(data['name'])}, 400
        current_user = User.find_by_username(get_jwt_identity())
        song = request.files["song"]
        if user_id is None:
            return {"status": "error", 'message': 'user_id can not be null.'}, 400
        elif user_id != str(current_user.id):
            return {"status": "error", 'message': 'You are not authorized.'}, 401
        elif song.filename == "":
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
                db.session.execute(joins.insert().values(user_id=user_id, room_id=room.id))
                new_song = Song(name=song_name, link=link, room_id=room.id)
                room.current_song_id = new_song.id
                room.current_song = new_song
                room.owner_id = user_id
                db.session.add(new_song)
            except Exception as e:
                if link is not None:
                    s3.delete_object(Bucket=config.S3_BUCKET, Key=link[len(config.S3_LOCATION):])
                db.session.rollback()
                print(repr(e))
                return {"status": "error",
                        'message': "Something wrong happen when creating room. Please try again."}, 400
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
        user_id = request.args.get('user_id')
        data = room_update_parser.parse_args()

        # Room.update().where(Room.id == room_id).values(owner_id=1, current_song_id=1, time_play=datetime.datetime.utcnow)

        return {"status": "success", "data": Room.query.filter_by(id=room_id).first()}, 200

    @jwt_required
    def get(self, room_id):
        user_id = request.args.get('user_id')
        current_user = get_jwt_identity()
        if user_id is None:
            return {"status": "error", 'message': 'user_id can not be null.'}, 400
        elif user_id != User.find_by_username(current_user).id:
            return {"status": "error", 'message': 'You are not authorized.'}, 401
        else:
            return {"status": "success", "data": Room.query.filter_by(id=room_id).first()}, 200
