# app/__init__.py

# third-party imports
from flask import Flask
from flask_migrate import Migrate
from flask_restful import Api
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager

import boto3

# local imports
from config import app_config
from instance import config

s3 = boto3.client(
    "s3", config.S3_REGION,
    aws_access_key_id=config.S3_KEY,
    aws_secret_access_key=config.S3_SECRET
)

db = SQLAlchemy()


def create_app(config_name):
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_object(app_config[config_name])
    app.config.from_pyfile('config.py')

    db.init_app(app)
    migrate = Migrate(app, db)
    jwt = JWTManager(app)

    from app import models
    from app.resources import auth
    from app.resources import rooms
    from app.resources import utils

    api = Api(app)

    api.add_resource(auth.UserRegistration, '/registration')
    api.add_resource(auth.UserLogin, '/login')
    api.add_resource(auth.TokenRefresh, '/token/refresh')
    api.add_resource(auth.SecretResource, '/secret')

    api.add_resource(utils.S3Resource, '/s3')

    api.add_resource(rooms.Rooms, '/rooms')
    api.add_resource(rooms.RoomsDetails, '/rooms/<int:room_id>')
    api.add_resource(rooms.RoomsPlaylist, '/rooms/<int:room_id>/playlist')
    api.add_resource(rooms.RoomsPlaylistDetails, '/rooms/<int:room_id>/playlist/<int:song_id>')
    api.add_resource(rooms.RoomsMembers, '/rooms/<int:room_id>/members')
    api.add_resource(rooms.RoomsMessages, '/rooms/<int:room_id>/messages')


    from .home import home as home_blueprint
    app.register_blueprint(home_blueprint)

    return app
