# app/home/views.py
from flask import render_template, send_from_directory, redirect, url_for

from . import home


@home.route('/')
def homepage():
    """
    Render the homepage template on the / route
    """
    return render_template('index.html', title="Welcome")


@home.route('/<path:path>')
def send_file(path):
    return send_from_directory('./templates/', path)


@home.errorhandler(404)
def handle_404(e):
    return render_template('index.html', title="Welcome")
