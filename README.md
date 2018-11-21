
The complete code for the Final Project -Soundchat. This is an web application that allows people can create/join chat rooms to chat and listen to music together.

## Installation and Set Up
Prerequisites:
* [Python 3](https://www.python.org/downloads/release/python-371/)
* [Flask](http://flask.pocoo.org/docs/1.0/installation/#install-flask)
* [venv](http://flask.pocoo.org/docs/1.0/installation/#virtual-environments)

Clone the repo from GitHub:
```
git clone https://github.com/haitranviet96/SoundChat
```

Install the required packages:
```
pip install -r requirements.txt
```

## Database configuration
You will need to create a MySQL user your terminal, as well as a MySQL database. Then, grant all privileges on your database to your user, like so:

```
$ mysql -u root

mysql> CREATE USER 'your_user_name'@'localhost' IDENTIFIED BY 'your_password';

mysql> CREATE DATABASE soundchat;

mysql> GRANT ALL PRIVILEGES ON soundchat . * TO 'abcxyz'@'localhost';
```

Note that `your_user_name` is the database user and `your_password` is the user password. After creating the database, run migrations as follows:

* `flask db init`
* `flask db migrate`
* `flask db upgrade`

## instance/config.py file
Create a directory, `instance`, and in it create a `config.py` file. This file should contain configuration variables that should not be publicly shared, such as passwords and secret keys. The app requires you to have the following configuration
variables:
* SECRET_KEY
* SQLALCHEMY_DATABASE_URI (`'mysql://your_user_name:your_password@localhost/soundchat'`)

## Launching the Program
Set the FLASK_APP and FLASK_CONFIG variables as follows:

* `export FLASK_APP=run.py`
* `export FLASK_CONFIG=development`

You can now run the app with the following command: `flask run`

## Built With...
* [Flask](http://flask.pocoo.org/)