from flask import Blueprint, render_template, jsonify
from flask_login import login_required, current_user
from models.attendance import Attendance

attendance_bp = Blueprint('attendance', __name__)

# Hardcoded subjects (will be made dynamic later)
SUBJECTS = [
    'Mathematics',
    'Physics', 
    'Chemistry',
    'English',
    'Computer Science'
]


@attendance_bp.route('/attendance-scan')
@login_required
def scan_page():
    """Serve the attendance scanning page."""
    return render_template('attendance_scan.html', student=current_user, subjects=SUBJECTS)


@attendance_bp.route('/api/attendance/history')
@login_required
def attendance_history():
    """Return the student's attendance records."""
    records = Attendance.query.filter_by(student_id=current_user.id).order_by(
        Attendance.timestamp.desc()
    ).limit(50).all()
    
    return jsonify({
        'success': True,
        'records': [{
            'id': r.id,
            'subject': r.subject,
            'status': r.status,
            'confidence': r.confidence,
            'timestamp': r.timestamp.strftime('%Y-%m-%d %H:%M:%S')
        } for r in records]
    })
