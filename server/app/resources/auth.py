import datetime

from flask_restful import Resource, reqparse
from flask_jwt_extended import (create_access_token, jwt_required, get_jwt_identity)

from app.models import User

register_parser = reqparse.RequestParser()
register_parser.add_argument('username', help='This field cannot be blank', required=True)
register_parser.add_argument('password', help='This field cannot be blank', required=True)
register_parser.add_argument('confirm_password', help='This field cannot be blank', required=True)

login_parser = reqparse.RequestParser()
login_parser.add_argument('username', help='This field cannot be blank', required=True)
login_parser.add_argument('password', help='This field cannot be blank', required=True)


class UserRegistration(Resource):
    def post(self):
        data = register_parser.parse_args()

        if not data['username'][:1].isalpha():
            return {"status": "error", 'message': 'Username must starts with an alphabet character.'}, 400
        if len(data['password']) < 8:
            return {"status": "error", 'message': 'Password must has at least 8 characters.'}, 400
        if data['password'] != data['confirm_password']:
            return {"status": "error", 'message': 'Confirm password does not match.'}, 400
        if User.find_by_username(data['username']):
            return {"status": "error", 'message': 'User {} already exists'.format(data['username'])}, 400

        new_user = User(username=data['username'], password=data['password'])

        try:
            new_user.save_to_db()
            expires = datetime.timedelta(days=7)
            access_token = create_access_token(identity=data['username'], expires_delta=expires)
            return {
                "status": "success",
                'message': 'User {} was created'.format(data['username']),
                'user_id': new_user.id,
                'access_token': access_token
            }
        except:
            return {"status": 'error', 'message': 'Something went wrong'}, 500


class UserLogin(Resource):
    def post(self):
        data = login_parser.parse_args()
        current_user = User.find_by_username(data['username'])

        if not current_user:
            return {"status": "error", 'message': 'User {} doesn\'t exist'.format(data['username'])}

        if current_user.verify_password(data['password']):
            expires = datetime.timedelta(days=7)
            access_token = create_access_token(identity=data['username'], expires_delta=expires)
            return {
                "status": "success",
                'message': 'Logged in as {}'.format(current_user.username),
                'user_id': current_user.id,
                'access_token': access_token
            }

        else:
            return {"status": "error", 'message': 'Wrong credentials'}


class SecretResource(Resource):
    @jwt_required
    def get(self):
        current_user = get_jwt_identity()
        return {"status": "success", 'logged_in_as': current_user}, 200
