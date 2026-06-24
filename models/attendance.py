from datetime import datetime, date
from models import db


class Attendance(db.Model):
    """Attendance record — one per student per subject per day."""
    __tablename__ = 'attendance'

    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'), nullable=False)
    subject = db.Column(db.String(50), nullable=False)
    status = db.Column(db.String(10), default='present')  # present / absent
    confidence = db.Column(db.Float, nullable=True)  # match confidence %
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    # Unique constraint: one attendance per student per subject per day
    __table_args__ = (
        db.UniqueConstraint('student_id', 'subject', 'timestamp',
                            name='unique_daily_attendance'),
    )

    # Relationship
    student = db.relationship('Student', backref=db.backref('attendances', lazy='dynamic'))

    @staticmethod
    def already_marked_today(student_id, subject):
        """Check if attendance already marked for today."""
        today_start = datetime.combine(date.today(), datetime.min.time())
        today_end = datetime.combine(date.today(), datetime.max.time())
        return Attendance.query.filter(
            Attendance.student_id == student_id,
            Attendance.subject == subject,
            Attendance.timestamp >= today_start,
            Attendance.timestamp <= today_end
        ).first() is not None

    def __repr__(self):
        return f'<Attendance {self.student_id} - {self.subject} - {self.status}>'
