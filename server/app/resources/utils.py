from flask import request
from flask_restful import Resource

from app import s3
from instance import config


class S3Resource(Resource):
    def get(self):
        keys = []
        contents = s3.list_objects(Bucket=config.S3_BUCKET)['Contents']
        if contents is None:
            return "There are no files."
        for key in contents:
            print(key['Key'])
            keys.append(key['Key'])
        return keys, 200

    def delete(self):
        file_name = request.get_json()['file_name']
        if file_name:
            if file_name == "all":
                contents = s3.list_objects(Bucket=config.S3_BUCKET)['Contents']
                if contents is None:
                    return "There are no files."
                for key in contents:
                    print(key['Key'])
                    s3.delete_object(Bucket=config.S3_BUCKET, Key=key['Key'])
            else:
                s3.delete_object(Bucket=config.S3_BUCKET, Key=file_name)
                return file_name + " deleted.", 200
        else:
            return "dont receive file_name", 200
