# Face-Lock 🚀

**Face-Lock** is a modern, AI-powered Smart Attendance System. It uses Facial Recognition to instantly verify students and mark their attendance. Designed with a stunning dark glassmorphism UI, it provides a seamless, fast, and secure experience for students to manage their profiles and log their daily attendance.

## ✨ Features

*   **🔒 Secure Authentication:** Custom login and registration system with Bcrypt password hashing.
*   **🎨 Premium Glassmorphism UI:** A beautiful, responsive interface featuring dynamic gradients, smooth animations, and a polished dark mode.
*   **📸 Face Registration:** Students can register their face using their webcam. The system uses a lightweight OpenCV-based approach (Haar Cascades + LBP/Gradient Histograms) to generate a secure facial encoding.
*   **✅ AI Attendance Scanning:** Real-time face matching using cosine similarity to mark attendance for specific subjects.
*   **🚫 Anti-Spoofing & Restrictions:** Prevents duplicate attendance marking for the same subject on the same day. Students cannot arbitrarily change their registered face without admin approval.
*   **👤 Profile Management:** Upload custom profile pictures, edit details, and view the verified registered face.

## 🛠️ Tech Stack

*   **Backend:** Python, Flask, Flask-Login
*   **Database:** SQLite (with SQLAlchemy ORM)
*   **AI/Computer Vision:** OpenCV (cv2), NumPy
*   **Frontend:** HTML5, Vanilla JavaScript, Custom CSS (Tailwind-inspired utility classes + advanced Glassmorphism)

## 🚀 Getting Started

### Prerequisites
Make sure you have Python 3.8+ installed on your system.

### Installation

1. **Clone the repository (or navigate to the project directory):**
   ```bash
   cd Face-Lock
   ```

2. **Install the required dependencies:**
   ```bash
   pip install flask flask-sqlalchemy flask-login bcrypt opencv-python numpy
   ```

3. **Initialize the Database:**
   The database tables are created automatically when the application starts for the first time.

4. **Run the Application:**
   ```bash
   python app.py
   ```

5. **Open your browser:**
   Navigate to `http://localhost:5000` to access the application.

## 📱 How to Use

1.  **Register & Login:** Create a new student account using your Name, Roll Number, Email, and Password.
2.  **Register Your Face:** Go to your **Profile** and click on **Register Face**. Allow camera access, position your face clearly in the frame, and capture.
3.  **Mark Attendance:** Navigate to **Attendance Scan** from the Dashboard or Sidebar. Select your subject, look at the camera, and click **Scan & Mark Attendance**.
4.  **View Status:** Your Dashboard will reflect your attendance status.

## 📁 Project Structure

*   `/app.py` - Main Flask application and configuration.
*   `/models/` - SQLAlchemy database models (`student.py`, `attendance.py`).
*   `/routes/` - API and page routing (`auth.py`, `register.py`, `face.py`, `attendance.py`).
*   `/templates/` - HTML templates for the UI.
*   `/static/` - Static assets (CSS, JS, background images, and uploaded files).
*   `/database/` - SQLite database storage.

## 🤝 Contributing
This project is currently under active development. Future phases include building an Attendance Tracker with history and charts, as well as a comprehensive Admin Panel.
