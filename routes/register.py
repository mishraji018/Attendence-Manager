import re
from flask import Blueprint, request, jsonify, redirect, url_for, render_template
import bcrypt
from models import db
from models.student import Student

register_bp = Blueprint('register', __name__)


@register_bp.route('/landing')
def landing_page():
    """Serve the landing page."""
    return render_template('index.html')



def validate_email(email):
    """Basic email format validation."""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


def validate_password(password):
    """Password must be at least 8 characters."""
    return len(password) >= 8


@register_bp.route('/register')
def register_page():
    """Serve the registration page."""
    return render_template('register.html')


@register_bp.route('/api/register', methods=['POST'])
def register():
    """Handle student registration."""
    data = request.get_json()

    # Extract fields
    name = data.get('name', '').strip()
    roll_no = data.get('roll_no', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    confirm_password = data.get('confirm_password', '')
    section = data.get('section', '').strip() or None

    # --- Validation ---
    errors = {}

    if not name or len(name) < 2:
        errors['name'] = 'Name must be at least 2 characters.'

    if not roll_no:
        errors['roll_no'] = 'Roll number is required.'

    if not email or not validate_email(email):
        errors['email'] = 'Please enter a valid email address.'

    if not validate_password(password):
        errors['password'] = 'Password must be at least 8 characters.'

    if password != confirm_password:
        errors['confirm_password'] = 'Passwords do not match.'

    try:
        # Check for duplicate roll number
        if not errors.get('roll_no'):
            existing = Student.query.filter_by(roll_no=roll_no).first()
            if existing:
                errors['roll_no'] = 'This roll number is already registered.'

        # Check for duplicate email
        if not errors.get('email'):
            existing = Student.query.filter_by(email=email).first()
            if existing:
                errors['email'] = 'This email is already registered.'

        # Return errors if any
        if errors:
            return jsonify({'success': False, 'errors': errors}), 400

        # --- Create Student ---
        password_hash = bcrypt.hashpw(
            password.encode('utf-8'),
            bcrypt.gensalt()
        ).decode('utf-8')

        student = Student(
            name=name,
            roll_no=roll_no,
            email=email,
            section=section,
            password_hash=password_hash
        )

        db.session.add(student)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Registration successful! Please login.'
        })
    except Exception as e:
        import traceback
        print("Register Error:", traceback.format_exc())
        return jsonify({
            'success': False,
            'message': f'Server Error: {str(e)}'
        }), 500
