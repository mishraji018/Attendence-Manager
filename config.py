import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    """Base configuration."""
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-fallback-key')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'


class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG = True
    TEMPLATES_AUTO_RELOAD = True
    SEND_FILE_MAX_AGE_DEFAULT = 0
    
    if os.environ.get('DATABASE_URL'):
        uri = os.environ.get('DATABASE_URL')
        if uri.startswith("postgres://"):
            uri = uri.replace("postgres://", "postgresql://", 1)
        SQLALCHEMY_DATABASE_URI = uri
    elif os.environ.get('VERCEL'):
        SQLALCHEMY_DATABASE_URI = 'sqlite:////tmp/face_lock.db'
    else:
        SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(
            os.path.abspath(os.path.dirname(__file__)), 'database', 'face_lock.db'
        )


class ProductionConfig(Config):
    """Production configuration."""
    DEBUG = False
    
    if os.environ.get('DATABASE_URL'):
        uri = os.environ.get('DATABASE_URL')
        if uri.startswith("postgres://"):
            uri = uri.replace("postgres://", "postgresql://", 1)
        SQLALCHEMY_DATABASE_URI = uri
    else:
        SQLALCHEMY_DATABASE_URI = 'mysql+pymysql://user:password@localhost/face_lock'


config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
