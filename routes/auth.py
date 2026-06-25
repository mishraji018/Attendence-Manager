from flask import Blueprint, request, jsonify, redirect, url_for, render_template, current_app
from flask_login import login_user, logout_user, login_required, current_user
import bcrypt
import os
from werkzeug.utils import secure_filename
from models.student import Student
from models import db

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/login')
def login_page():
    """Serve the login page."""
    if current_user.is_authenticated:
        if current_user.is_admin:
            return redirect(url_for('admin.admin_dashboard'))
        return redirect(url_for('auth.dashboard_page'))
    return render_template('login.html')


@auth_bp.route('/api/login', methods=['POST'])
def login():
    """Handle student login."""
    data = request.get_json()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    # Validate input
    if not email or not password:
        return jsonify({
            'success': False,
            'message': 'Email and password are required.'
        }), 400

    # Find student by email
    student = Student.query.filter_by(email=email).first()

    if not student:
        return jsonify({
            'success': False,
            'message': 'Invalid email or password.'
        }), 401

    # Verify password
    if not bcrypt.checkpw(password.encode('utf-8'), student.password_hash.encode('utf-8')):
        return jsonify({
            'success': False,
            'message': 'Invalid email or password.'
        }), 401

    # Login the user (Flask-Login session)
    login_user(student, remember=data.get('remember', False))

    redirect_url = url_for('admin.admin_dashboard') if student.is_admin else url_for('auth.dashboard_page')

    return jsonify({
        'success': True,
        'message': 'Login successful!',
        'redirect': redirect_url
    })


@auth_bp.route('/api/logout', methods=['POST'])
@login_required
def logout():
    """Handle student logout."""
    logout_user()
    return jsonify({
        'success': True,
        'message': 'Logged out successfully.',
        'redirect': url_for('auth.login_page')
    })


@auth_bp.route('/dashboard')
@login_required
def dashboard_page():
    """Serve the student dashboard."""
    from models.attendance import Attendance
    from routes.attendance import SUBJECTS
    from models import db
    
    attendance_stats = []
    total_attended = 0
    total_possible = 0
    
    for subject in SUBJECTS:
        # Dynamically determine total classes held by finding the maximum attendance
        # marked by ANY student for this subject.
        max_attended_query = db.session.query(db.func.count(Attendance.id)).filter_by(
            subject=subject, status='present'
        ).group_by(Attendance.student_id).order_by(
            db.func.count(Attendance.id).desc()
        ).first()
        
        total_classes_per_subject = max_attended_query[0] if max_attended_query else 0
        
        attended = Attendance.query.filter_by(student_id=current_user.id, subject=subject, status='present').count()
        total_attended += attended
        total_possible += total_classes_per_subject
        
        if total_classes_per_subject == 0:
            percentage = 0
            text_color = 'text-slate-400'
            bg_color = 'bg-slate-500'
        else:
            percentage = int((attended / total_classes_per_subject) * 100)
            if percentage < 50:
                text_color = 'text-error'
                bg_color = 'bg-error'
            elif percentage < 75:
                text_color = 'text-warning'
                bg_color = 'bg-warning'
            else:
                text_color = 'text-success'
                bg_color = 'bg-success'
            
        attendance_stats.append({
            'subject': subject,
            'attended': attended,
            'total': total_classes_per_subject,
            'percentage': percentage,
            'text_color': text_color,
            'bg_color': bg_color
        })
        
    overall_percentage = int((total_attended / total_possible) * 100) if total_possible > 0 else 0
    chart_percent = overall_percentage
    
    return render_template('dashboard.html', 
                           student=current_user, 
                           stats=attendance_stats,
                           overall_percentage=overall_percentage,
                           chart_percent=chart_percent,
                           total_attended=total_attended,
                           total_possible=total_possible)


@auth_bp.route('/profile')
@login_required
def profile_page():
    """Serve the student profile page."""
    return render_template('profile.html', student=current_user)


@auth_bp.route('/api/me')
@login_required
def me():
    """Return current logged-in user info."""
    return jsonify({
        'id': current_user.id,
        'name': current_user.name,
        'roll_no': current_user.roll_no,
        'email': current_user.email,
        'section': current_user.section,
        'profile_pic': current_user.profile_pic
    })


@auth_bp.route('/api/profile/update', methods=['POST'])
@login_required
def update_profile():
    """Update user's name."""
    data = request.get_json()
    name = data.get('name', '').strip()
    
    if not name:
        return jsonify({'success': False, 'message': 'Name cannot be empty.'}), 400
        
    current_user.name = name
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Profile updated successfully.'})


@auth_bp.route('/api/profile/upload_picture', methods=['POST'])
@login_required
def upload_picture():
    """Upload and save profile picture."""
    if 'profile_pic' not in request.files:
        return jsonify({'success': False, 'message': 'No file part in the request.'}), 400
        
    file = request.files['profile_pic']
    if file.filename == '':
        return jsonify({'success': False, 'message': 'No file selected.'}), 400
        
    if file:
        filename = secure_filename(file.filename)
        # Create a unique filename based on roll number
        ext = os.path.splitext(filename)[1]
        new_filename = f"{current_user.roll_no}_profile{ext}"
        
        # Ensure directory exists
        upload_dir = os.path.join(current_app.root_path, 'static', 'uploads')
        os.makedirs(upload_dir, exist_ok=True)
        
        filepath = os.path.join(upload_dir, new_filename)
        file.save(filepath)
        
        # Update database
        current_user.profile_pic = new_filename
        db.session.commit()
        
        return jsonify({
            'success': True, 
            'message': 'Profile picture uploaded successfully.',
            'filename': new_filename
        })
