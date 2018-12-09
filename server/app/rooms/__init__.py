# app/rooms/__init__.py

from flask import Blueprint

rooms = Blueprint('rooms', __name__)

from . import apis
