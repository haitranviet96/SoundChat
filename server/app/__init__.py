# app/__init__.py

# third-party imports
from flask import Flask
from flask_restful import Api
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager

import boto3, botocore

# local imports
from config import app_config

s3 = boto3.client(
    "s3",
    aws_access_key_id=app_config.S3_KEY,
    aws_secret_access_key=app_config.S3_SECRET
)

db = SQLAlchemy()


def create_app(config_name):
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_object(app_config[config_name])
    app.config.from_pyfile('config.py')

    db.init_app(app)
    jwt = JWTManager(app)

    from app import models, resources

    api = Api(app)

    api.add_resource(resources.UserRegistration, '/registration')
    api.add_resource(resources.UserLogin, '/login')
    api.add_resource(resources.TokenRefresh, '/token/refresh')
    api.add_resource(resources.SecretResource, '/secret')

    from .home import home as home_blueprint
    app.register_blueprint(home_blueprint)

    from .rooms import rooms as rooms_blueprint
    app.register_blueprint(rooms_blueprint)

    return app
