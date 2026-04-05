# 🔐 Face Lock

A modern **face authentication system with blink detection** built using web technologies. This project enhances traditional face recognition by adding **liveness detection (eye blink)** to prevent spoofing using photos or videos.

---

## 🚀 Features

* 👁️ Real-time **face detection**
* 👁️‍🗨️ **Blink detection (liveness check)**
* 🔒 Secure face-based authentication
* 💾 Local **SQLite / Indexed DB storage**
* 🎨 Modern **Glassmorphism UI**
* ⚡ Built with high-performance frontend stack (Vite + React + TS)

---

## 🧠 How It Works

1. User registers their face via camera
2. Facial data is stored locally
3. During login:

   * Camera detects face
   * System checks for **eye blink**
   * If blink + face match → ✅ Access granted

---

## 🛠️ Tech Stack

* **Frontend:** React + TypeScript + Vite
* **Styling:** CSS (Glassmorphism UI)
* **Face Detection:** MediaPipe / Face API (based implementation)
* **Storage:** SQLite / Local DB

---

## 📁 Project Structure

```
blinkid-face-lock/
│── src/
│   ├── components/
│   │   ├── CameraFeed.tsx
│   │   ├── VerificationPanel.tsx
│   ├── pages/
│   │   ├── AddFace.tsx
│   │   ├── Index.tsx
│   ├── lib/
│   │   ├── blinkDetection.ts
│   │   ├── faceDb.ts
│   ├── App.tsx
│── index.html
│── package.json
│── vite.config.ts
```

---

## ⚙️ Installation & Setup

```bash
# Clone the repository
git clone https://github.com/mishraji018/blinkid-face-lock.git

# Navigate to project
cd blinkid-face-lock

# Install dependencies
npm install

# Run the project
npm run dev
```

---

## 🎯 Usage

* Open the app in browser
* Add your face using **Add Face page**
* Try authentication on homepage
* Blink to verify liveness

---

## 🔐 Why Blink Detection?

Traditional face unlock systems can be fooled using:

* Photos 📸
* Videos 🎥

This project adds **liveness detection** → requiring a real blink 👁️
➡️ Makes the system more secure

---

## 📸 Future Improvements

* 🌐 Backend authentication (JWT / OAuth)
* ☁️ Cloud face storage
* 📱 Mobile optimization
* 🎥 Anti-spoofing (head movement, depth detection)

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repo
2. Create a new branch
3. Make your changes
4. Submit a pull request

---

## 👨‍💻 Author

**Mishra ji**
GitHub: https://github.com/mishraji018

---

## ⭐ Show Your Support

If you like this project:

⭐ Star the repo
🍴 Fork it
📢 Share it

---

## 🧾 License

This project is licensed under the **MIT License**
