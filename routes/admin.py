from flask import Blueprint, request, jsonify, render_template, redirect, url_for, abort
from flask_login import login_required, current_user
from models.student import Student
from models import db
from functools import wraps

admin_bp = Blueprint('admin', __name__, url_prefix='/admin')

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated or not current_user.is_admin:
            abort(403) # Forbidden
        return f(*args, **kwargs)
    return decorated_function

@admin_bp.route('/dashboard')
@login_required
@admin_required
def admin_dashboard():
    """Serve the admin dashboard UI."""
    return render_template('admin_dashboard.html', admin=current_user)

@admin_bp.route('/api/stats')
@login_required
@admin_required
def get_stats():
    """Get overview statistics for the admin dashboard."""
    total_students = Student.query.filter(~Student.email.endswith('@kiet.edu')).count()
    registered_faces = Student.query.filter_by(face_registered=True).filter(~Student.email.endswith('@kiet.edu')).count()
    pending_resets = Student.query.filter_by(face_reset_requested=True).count()
    
    return jsonify({
        'total_students': total_students,
        'registered_faces': registered_faces,
        'pending_resets': pending_resets
    })

@admin_bp.route('/api/students')
@login_required
@admin_required
def get_students():
    """Return all students and their statuses."""
    students = Student.query.filter(~Student.email.endswith('@kiet.edu')).all()
    student_list = []
    for s in students:
        student_list.append({
            'id': s.id,
            'name': s.name,
            'roll_no': s.roll_no,
            'email': s.email,
            'section': s.section,
            'face_registered': s.face_registered,
            'face_reset_requested': s.face_reset_requested
        })
    return jsonify({'students': student_list})

@admin_bp.route('/api/approve-reset/<int:student_id>', methods=['POST'])
@login_required
@admin_required
def approve_reset(student_id):
    """Approve a student's face reset request."""
    student = Student.query.get_or_404(student_id)
    
    if not student.face_reset_requested:
        return jsonify({'success': False, 'message': 'No pending reset request for this student.'}), 400
        
    student.face_encoding = None
    student.face_image = None
    student.face_registered = False
    student.face_reset_requested = False
    db.session.commit()
    
    return jsonify({'success': True, 'message': f'Face reset approved for {student.name}. They can now re-register.'})

@admin_bp.route('/api/reject-reset/<int:student_id>', methods=['POST'])
@login_required
@admin_required
def reject_reset(student_id):
    """Reject a student's face reset request."""
    student = Student.query.get_or_404(student_id)
    
    if not student.face_reset_requested:
        return jsonify({'success': False, 'message': 'No pending reset request for this student.'}), 400
        
    student.face_reset_requested = False
    db.session.commit()
    
    return jsonify({'success': True, 'message': f'Face reset rejected for {student.name}.'})

@admin_bp.route('/api/today-attendance')
@login_required
@admin_required
def get_today_attendance():
    """Return all attendance records for today."""
    from models.attendance import Attendance
    from datetime import datetime, date
    
    today_start = datetime.combine(date.today(), datetime.min.time())
    today_end = datetime.combine(date.today(), datetime.max.time())
    
    records = Attendance.query.join(Student).filter(
        Attendance.timestamp >= today_start,
        Attendance.timestamp <= today_end,
        ~Student.email.endswith('@kiet.edu')
    ).order_by(Attendance.timestamp.desc()).all()
    
    attendance_list = []
    for r in records:
        attendance_list.append({
            'student_name': r.student.name,
            'roll_no': r.student.roll_no,
            'subject': r.subject,
            'status': r.status,
            'confidence': r.confidence,
            'time': r.timestamp.strftime("%I:%M %p")
        })
        
    return jsonify({'attendance': attendance_list})

@admin_bp.route('/api/portal-status')
@login_required
@admin_required
def get_portal_status():
    """Get the current status of the attendance portal."""
    from models.setting import Setting
    status = Setting.get_value('portal_status', 'open')
    return jsonify({'status': status})

@admin_bp.route('/api/toggle-portal', methods=['POST'])
@login_required
@admin_required
def toggle_portal():
    """Toggle the attendance portal between open and closed."""
    from models.setting import Setting
    data = request.get_json()
    new_status = data.get('status')
    
    if new_status not in ['open', 'closed']:
        return jsonify({'success': False, 'message': 'Invalid status.'}), 400
        
    Setting.set_value('portal_status', new_status)
    return jsonify({
        'success': True, 
        'message': f'Attendance portal is now {new_status}.',
        'status': new_status
    })
