# app/home/views.py

from flask import render_template
from flask_jwt_extended import jwt_required

from . import home


@home.route('/')
def homepage():
    """
    Render the homepage template on the / route
    """
    return 'Hello, World!'
    # return render_template('home/index.html', title="Welcome")


@home.route('/dashboard')
@jwt_required
def dashboard():
    """
    Render the dashboard template on the /dashboard route
    """
    return 'Dashboard'
    # return render_template('home/dashboard.html', title="Dashboard")
