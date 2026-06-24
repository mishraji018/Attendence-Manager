import os
from flask import Flask, redirect, url_for
from config import config
from models import db, login_manager
from models.student import Student
from models.attendance import Attendance


def create_app(config_name=None):
    """Flask application factory."""
    if config_name is None:
        config_name = os.environ.get('FLASK_ENV', 'default')

    app = Flask(__name__)
    app.config.from_object(config[config_name])
    app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max for face images

    # Initialize extensions
    db.init_app(app)
    login_manager.init_app(app)
    login_manager.login_view = 'auth.login_page'
    login_manager.login_message_category = 'info'

    # User loader for Flask-Login
    @login_manager.user_loader
    def load_user(user_id):
        return Student.query.get(int(user_id))

    # Register blueprints
    from routes.register import register_bp
    from routes.auth import auth_bp
    from routes.face import face_bp
    from routes.attendance import attendance_bp
    
    app.register_blueprint(register_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(face_bp)
    app.register_blueprint(attendance_bp)

    # Landing page route
    @app.route('/')
    def index():
        return redirect(url_for('register.landing_page'))

    # Create database tables
    with app.app_context():
        # Ensure database directory exists
        db_dir = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'database')
        os.makedirs(db_dir, exist_ok=True)
        db.create_all()
        print('[OK] Database tables created successfully.')

    return app


if __name__ == '__main__':
    app = create_app()
    print('[*] Face-Lock server starting on http://localhost:5000')
    app.run(host='0.0.0.0', port=5000, debug=True)
