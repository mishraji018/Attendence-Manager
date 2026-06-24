# Face-Lock — Complete Design & Task Specification
# ================================================
# Keep this file for future reference throughout the project.
# Last updated: 2026-06-24

# ============================================================
# 1. TYPOGRAPHY
# ============================================================
#
# Headings: Sora (Google Fonts)
# Body:     Manrope (Google Fonts)
#
# | Usage         | Font    | Size  | Weight | Extra                      |
# |---------------|---------|-------|--------|----------------------------|
# | Hero Title    | Sora    | 48px  | 700    | letter-spacing: -0.02em    |
# | Section Title | Sora    | 24px  | 600    | letter-spacing: -0.02em    |
# | Card Title    | Sora    | 20px  | 600    | —                          |
# | Body Text     | Manrope | 16px  | 400    | —                          |
# | Input Labels  | Manrope | 14px  | 500    | —                          |
# | Button Text   | Manrope | 14-16 | 600    | text-transform: none       |
# | Small/Caption | Manrope | 12px  | 400    | —                          |
#
# Google Fonts import:
#   Sora:wght@400;500;600;700
#   Manrope:wght@400;500;600;700


# ============================================================
# 2. COLOR PALETTE
# ============================================================
#
# | Token               | Value                              | Usage                        |
# |---------------------|------------------------------------|------------------------------|
# | --bg-primary        | #0B1120                            | Page background              |
# | --bg-secondary      | #0f172a                            | Alternate/section bg         |
# | --card-bg           | rgba(255, 255, 255, 0.08)          | Glassmorphism cards          |
# | --card-border       | rgba(255, 255, 255, 0.12)          | Card borders                 |
# | --accent            | #8B5CF6 (Violet)                   | Primary accent, buttons      |
# | --accent-secondary  | #06B6D4 (Cyan)                     | Secondary accent             |
# | --accent-gradient   | #8B5CF6 -> #06B6D4                 | Gradient buttons, progress   |
# | --text-primary      | #F8FAFC                            | Headings, primary text       |
# | --text-secondary    | #94A3B8                            | Descriptions, labels         |
# | --text-muted        | #64748B                            | Placeholders, captions       |
# | --success           | #10B981                            | Success states, checkmarks   |
# | --error             | #EF4444                            | Error states, validation     |
# | --warning           | #F59E0B                            | Warnings                     |
# | --input-bg          | rgba(255, 255, 255, 0.05)          | Input field background       |
# | --input-focus-border| #8B5CF6                            | Input focus ring             |
# | --input-focus-glow  | 0 0 15px rgba(139, 92, 246, 0.3)  | Input focus shadow           |


# ============================================================
# 3. GLASSMORPHISM CARD STYLE
# ============================================================
#
# .glass-card {
#     background: rgba(255, 255, 255, 0.08);
#     backdrop-filter: blur(20px);
#     -webkit-backdrop-filter: blur(20px);
#     border: 1px solid rgba(255, 255, 255, 0.12);
#     border-radius: 16px;
#     box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
# }


# ============================================================
# 4. LAYOUT — SPLIT SCREEN
# ============================================================
#
# Desktop (>=1024px):
# ┌─────────────────┬──────────────────────┐
# │   Left Panel    │    Right Panel       │
# │   (Branding)    │    (Form Content)    │
# │                 │                      │
# │  Smart          │  [Registration]      │
# │  Attendance     │  [Login Form]        │
# │                 │  [etc.]              │
# │  • Face Recog   │                      │
# │  • GPS Verify   │                      │
# │  • Liveness     │                      │
# │                 │                      │
# │  [dot grid +    │                      │
# │   particles]    │                      │
# └─────────────────┴──────────────────────┘
#
# Mobile (<1024px):
# ┌──────────────────────┐
# │  Logo + Title (top)  │
# ├──────────────────────┤
# │   [Form Content]     │
# └──────────────────────┘
#
# Left Panel features:
# - Project name: "Smart Attendance"
# - Feature bullets: Face Recognition, GPS Verification, Liveness Detection
# - Animated dot grid background
# - Floating particle animation
# - Subtle gradient overlay (#0B1120 -> #1e1b4b)


# ============================================================
# 5. REGISTRATION FLOW
# ============================================================
#
# Fields:
# - Full Name
# - Roll Number
# - Email
# - Password
# - Confirm Password
# 
# Button: [ Create Account ]
#
# Registration creates the user in the database. Face registration is moved
# to the Profile section inside the dashboard.


# ============================================================
# 6. INPUT DESIGN — FLOATING LABELS
# ============================================================
#
# Resting:
#   ┌─────────────────────────┐
#   │ Full Name               │  ← placeholder, muted color
#   └─────────────────────────┘
#
# Focused/Filled:
#     Full Name                  ← label floats up, accent color, 12px
#   ┌─────────────────────────┐
#   │ Prashant Mishra          │
#   └─────────────────────────┘
#     border-color: #8B5CF6
#     box-shadow: 0 0 15px rgba(139,92,246,0.3)


# ============================================================
# 7. PASSWORD STRENGTH METER
# ============================================================
#
# [████████░░░░░░░░░░░░] Medium
#
# - Weak        → Red    (#EF4444)  → 25% bar
# - Medium      → Yellow (#F59E0B)  → 50% bar
# - Strong      → Blue   (#3B82F6)  → 75% bar
# - Very Strong → Green  (#10B981)  → 100% bar


# ============================================================
# 8. LOGIN PAGE
# ============================================================
#
# - Same split-screen layout as registration
# - Fields: Email + Password
# - [ Login ] Button
# - Error: shake animation on wrong credentials (300ms)


# ============================================================
# 9. STUDENT DASHBOARD UX FLOW
# ============================================================
#
# Sidebar:
#   🏠 Dashboard
#   📸 Attendance Scan
#   📊 Attendance Tracker
#   👤 Profile
#   🚪 Logout
#
# Dashboard Main Area:
#   Welcome Back, {Full Name} 👋
#   (Quick stats here if necessary)
#
# Profile Page:
#   Top Section: [ Profile Pic ] (Uploadable by user, Can change anytime)
#   Welcome, {Full Name}
#
#   Personal Details:
#     Name [ Editable ]
#     Email [ Read Only ]
#     Roll No [ Read Only ]
#     Section [ Read Only ]
#
#   Face Registration Card (Face Recognition):
#     Status: ❌ Not Registered -> Button: [ Register Face ]
#     After registration:
#       Status: ✅ Registered
#       Face registration completed. For changes contact administrator.
#       No re-register button. No delete button.
#
# Attendance Scan Page:
#   Camera Preview
#   Face Detected: ✅/❌
#   Identity Verified: ✅/❌
#   [ Start Scan ]
#   Result: ✅ Attendance Marked (Date, Time)
#
# Attendance Tracker:
#   Cards:
#     Present Days
#     Absent Days
#     Attendance Percentage
#     Today's Status
#   Button: [ View Details ]
#
#   Attendance Details Table:
#     Date | Status
#     (Semester-wise data. Do NOT delete old records)
#
# Admin (Last Phase):
#   Admin login separate.
#   Admin can: Approve Students, Remove Students, Reset Face Registration, View Attendance, Export Reports. Nothing more.


# ============================================================
# 10. ANIMATIONS
# ============================================================
#
# | Animation    | Usage                      | Duration | Easing                              |
# |--------------|----------------------------|----------|-------------------------------------|
# | fadeInUp     | Page load, card entrance   | 600ms    | ease-out                            |
# | slideLeft    | Wizard step forward        | 300ms    | ease-out                            |
# | slideRight   | Wizard step backward       | 300ms    | ease-out                            |
# | shake        | Login error, validation    | 300ms    | ease-in-out                         |
# | pulseGlow    | Button hover               | 200ms    | ease                                |
# | float        | Background particles       | 6-8s     | ease-in-out infinite                |
# | dotPulse     | Dot grid animation         | 3s       | ease-in-out infinite                |
# | progressFill | Step progress bar          | 500ms    | ease-out                            |
# | checkPop     | Completion checkmark       | 300ms    | cubic-bezier(0.68,-0.55,0.27,1.55) |
#
# RULE: Subtle, professional. NO neon cyberpunk. NO excessive bouncing.


# ============================================================
# 11. TECH STACK (APPROVED V1)
# ============================================================
#
# | Layer         | Tech                                |
# |---------------|-------------------------------------|
# | Frontend      | HTML5 + CSS3 + JavaScript           |
# | CSS Framework | Tailwind CSS v3 (CDN)               |
# | Templating    | Jinja2 (Flask built-in)             |
# | Backend       | Python + Flask                      |
# | Auth          | Flask-Login + bcrypt                |
# | ORM           | Flask-SQLAlchemy                    |
# | Database      | SQLite (single face_lock.db)        |
# | Fonts         | Google Fonts: Sora + Manrope        |
# | AI (Week 2+)  | OpenCV, SCRFD, ArcFace, MediaPipe   |


# ============================================================
# 12. WHAT NOT TO BUILD (V1)
# ============================================================
#
# ❌ Queue system (Redis, RabbitMQ, Kafka)
# ❌ MySQL (SQLite only for now)
# ❌ Docker / Kubernetes
# ❌ Cloud deployment
# ❌ Neon cyberpunk effects
# ❌ Too many animations
# ❌ 20 fields on one screen


# ============================================================
# 13. DATABASE SCHEMA (MVP)
# ============================================================
#
# Phase 1 — students table:
#
# CREATE TABLE students (
#     id            INTEGER PRIMARY KEY AUTOINCREMENT,
#     name          TEXT NOT NULL,
#     roll_no       TEXT NOT NULL UNIQUE,
#     email         TEXT NOT NULL UNIQUE,
#     section       TEXT,
#     password_hash TEXT NOT NULL,
#     profile_pic   TEXT,
#     created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
# );
#
# Phase 2 (Face Enrollment):
# - face_embeddings table (student_id, embedding_blob, created_at)
#
# Phase 6 (Attendance Engine):
# - attendance table (student_id, timestamp, status)


# ============================================================
# 14. DEVELOPMENT PIPELINE
# ============================================================
#
# Phase 1 — Foundation
# ✓ Flask Setup
# ✓ SQLite Setup
# ✓ Folder Structure
# ✓ Student Model
# ✓ Authentication
# Deliverable: Register Working, Login Working, Logout Working
#
# Phase 2 — Dashboard
# ✓ Sidebar
# ✓ Dashboard Page
# ✓ Profile Page
# ✓ Session Protection
# Deliverable: User Login, Dashboard Opens, Profile Opens
#
# Phase 3 — Profile System
# ✓ Upload Profile Picture
# ✓ Edit Name
# ✓ Read-only Email
# ✓ Read-only Roll Number
# ✓ Read-only Section
# Deliverable: Complete Profile Management
#
# Phase 4 — Face Registration
# ✓ Camera Access
# ✓ Capture Face
# ✓ Save Face Embedding
# ✓ Registration Status
# Deliverable: Register Face Once
#
# Phase 5 — Face Recognition
# ✓ Open Camera
# ✓ Detect Face
# ✓ Match Face
# ✓ Verify Identity
# Deliverable: Face Recognition Working
#
# Phase 6 — Attendance Engine
# ✓ Attendance Table
# ✓ Mark Attendance
# ✓ Prevent Duplicate Attendance
# ✓ Date/Time Logging
# Deliverable: Attendance Successfully Recorded
#
# Phase 7 — Attendance Tracker
# ✓ Present Count
# ✓ Absent Count
# ✓ Percentage
# ✓ History Table
# ✓ Semester Records
# Deliverable: Complete Student Attendance Portal
#
# Phase 8 — Admin Panel
# ✓ Admin Login
# ✓ Student List
# ✓ Face Reset
# ✓ Remove Student
# ✓ Attendance Reports
# Deliverable: Full Project Complete


# ============================================================
# 15. PROJECT STRUCTURE
# ============================================================
#
# Face-Lock/
# ├── app.py                     # Flask entry point
# ├── config.py                  # Dev/Prod config
# ├── requirements.txt           # Python deps
# ├── .env                       # Secrets
# ├── DESIGN_SPEC.py             # THIS FILE — design reference
# │
# ├── database/
# │   └── face_lock.db           # SQLite (auto-created)
# │
# ├── models/
# │   ├── __init__.py
# │   └── student.py             # Student model
# │
# ├── routes/
# │   ├── __init__.py
# │   ├── auth.py                # Login/Logout/Session
# │   └── register.py            # Registration
# │
# ├── services/                  # (Week 2+)
# │   ├── face/                  # SCRFD + ArcFace
# │   ├── liveness/              # MediaPipe blink
# │
# ├── static/
# │   ├── css/
# │   │   └── style.css
# │   ├── js/
# │   │   ├── register.js
# │   │   ├── login.js
# │   │   └── utils.js
# │   └── assets/
# │
# └── templates/
#     ├── base.html
#     ├── index.html              # Landing page
#     ├── register.html           # Simple Registration
#     ├── login.html              # Email Login
#     ├── dashboard.html          # Dashboard home
#     ├── mark_attendance.html    # Mark Attendance page
#     ├── history.html            # Attendance history
#     └── profile.html            # User profile
