from flask import Flask
from flask import request

app = Flask(__name__)

def checkLogin(email, password):
    if email == "inaresh.online@gmail.com" and password == "test":
        return True
    return False

@app.route("/login", methods=['POST'])
def login():
    if request.method == "POST":
        if checkLogin(request.form['email'], request.form['password']):
            return "LOGGEDIN"
        else:
            return "FAILED"
    return "ERROR"