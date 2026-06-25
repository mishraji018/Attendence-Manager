from flask import Blueprint, render_template, jsonify
from flask_login import login_required, current_user
from models.attendance import Attendance

attendance_bp = Blueprint('attendance', __name__)

# Hardcoded subjects (will be made dynamic later)
SUBJECTS = [
    'Database Management Systems',
    'Operating Systems', 
    'Computer Networks',
    'Machine Learning'
]


@attendance_bp.route('/attendance-scan')
@login_required
def scan_page():
    """Serve the attendance scanning page."""
    return render_template('attendance_scan.html', student=current_user, subjects=SUBJECTS)


@attendance_bp.route('/history')
@login_required
def history_page():
    """Serve the attendance tracker history page."""
    from flask import request
    subject_filter = request.args.get('subject')
    
    query = Attendance.query.filter_by(student_id=current_user.id)
    if subject_filter:
        query = query.filter_by(subject=subject_filter)
        
    records = query.order_by(Attendance.timestamp.desc()).all()
    
    return render_template('history.html', student=current_user, records=records, current_subject=subject_filter)


@attendance_bp.route('/api/attendance/history')
@login_required
def attendance_history():
    """Return the student's attendance records."""
    from flask import request
    subject_filter = request.args.get('subject')
    
    query = Attendance.query.filter_by(student_id=current_user.id)
    if subject_filter:
        query = query.filter_by(subject=subject_filter)
        
    records = query.order_by(Attendance.timestamp.desc()).limit(50).all()
    
    return jsonify({
        'success': True,
        'records': [{
            'id': r.id,
            'subject': r.subject,
            'status': r.status,
            'confidence': r.confidence,
            'timestamp': r.timestamp.strftime('%d %b %Y, %I:%M %p')
        } for r in records]
    })

@attendance_bp.route('/api/portal-status')
def public_portal_status():
    """Return the current portal status for students."""
    from models.setting import Setting
    status = Setting.get_value('portal_status', 'open')
    return jsonify({'status': status})
