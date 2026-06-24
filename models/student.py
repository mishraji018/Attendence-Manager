from datetime import datetime
from flask_login import UserMixin
from models import db


class Student(UserMixin, db.Model):
    """Student model — simple, core fields only."""
    __tablename__ = 'students'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    roll_no = db.Column(db.String(20), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    section = db.Column(db.String(10), nullable=True)
    profile_pic = db.Column(db.String(255), nullable=True)
    face_registered = db.Column(db.Boolean, default=False)
    face_encoding = db.Column(db.Text, nullable=True) # Stores JSON string of the encoding
    face_image = db.Column(db.String(255), nullable=True) # Stored cropped face image filename
    face_reset_requested = db.Column(db.Boolean, default=False) # Pending admin approval for re-registration
    password_hash = db.Column(db.String(256), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<Student {self.roll_no} - {self.name}>'
