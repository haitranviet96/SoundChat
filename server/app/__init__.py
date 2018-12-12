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

s3 = boto3

db = SQLAlchemy()


def create_app(config_name):
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_object(app_config[config_name])
    app.config.from_pyfile('config.py')

    db.init_app(app)
    migrate = Migrate(app, db)
    jwt = JWTManager(app)

    s3.client(
        "s3",
        aws_access_key_id=app.config['S3_KEY'],
        aws_secret_access_key=app.config['S3_SECRET']
    )

    from app import models
    from app.resources import auth
    from app.resources import rooms

    api = Api(app)

    api.add_resource(auth.UserRegistration, '/registration')
    api.add_resource(auth.UserLogin, '/login')
    api.add_resource(auth.TokenRefresh, '/token/refresh')
    api.add_resource(auth.SecretResource, '/secret')

    api.add_resource(rooms.RoomsId, '/rooms/<int:room_id>')
    api.add_resource(rooms.Rooms, '/rooms')

    from .home import home as home_blueprint
    app.register_blueprint(home_blueprint)

    return app
