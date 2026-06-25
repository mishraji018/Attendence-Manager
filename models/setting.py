from models import db

class Setting(db.Model):
    """Global key-value settings for the application."""
    __tablename__ = 'settings'
    
    key = db.Column(db.String(50), primary_key=True)
    value = db.Column(db.String(255), nullable=False)
    
    @staticmethod
    def get_value(key, default=None):
        setting = db.session.get(Setting, key)
        if setting:
            return setting.value
        return default
        
    @staticmethod
    def set_value(key, value):
        setting = db.session.get(Setting, key)
        if setting:
            setting.value = str(value)
        else:
            setting = Setting(key=key, value=str(value))
            db.session.add(setting)
        db.session.commit()
