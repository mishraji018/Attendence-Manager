from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
import base64
import numpy as np
import cv2
import json
import os
from models import db

face_bp = Blueprint('face', __name__)

# Path to OpenCV's built-in Haar cascade (ships with opencv)
CASCADE_PATH = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
face_cascade = cv2.CascadeClassifier(CASCADE_PATH)

# ==========================================
# GPS GEOFENCING CONFIGURATION (Kanaicha, UP)
# ==========================================
COLLEGE_LAT = 26.6119
COLLEGE_LNG = 83.3931
MAX_DISTANCE_METERS = 300

import math

def haversine_distance(lat1, lon1, lat2, lon2):
    """Calculate the great circle distance in meters between two points on the earth."""
    R = 6371000  # Radius of earth in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * \
        math.sin(delta_lambda / 2.0) ** 2
    
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    distance = R * c
    return distance

def check_liveness_texture(face_img):
    """
    Passive Liveness Detection (Texture/Quality Analysis).
    Detects flat/blurry 2D printed photos vs real 3D faces.
    
    Note: For higher security, an ONNX CNN model (like MiniFASNet) 
    should be hooked here. This is a heuristic approach.
    """
    gray = cv2.cvtColor(face_img, cv2.COLOR_BGR2GRAY)
    
    # 1. Laplacian Variance (Detects blur common in printed photos)
    laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
    
    # 2. Specular reflection (Detects screen glare on mobile phones)
    # Screens emit light and cause blown-out white pixels
    _, thresh = cv2.threshold(gray, 240, 255, cv2.THRESH_BINARY)
    glare_ratio = cv2.countNonZero(thresh) / (gray.shape[0] * gray.shape[1])
    
    # Thresholds (calibrated for standard webcams)
    if laplacian_var < 50:
        return False, f"Blurry image detected (Score: {laplacian_var:.1f}). Possible printed photo."
    if glare_ratio > 0.05:
        return False, f"Screen glare detected (Ratio: {glare_ratio:.3f}). Possible digital spoofing."
        
    return True, "Passed"

def get_face_encoding(face_img):
    """
    Generate a lightweight face encoding using LBP histogram.
    This is fast, requires no heavy ML frameworks, and works well for matching.
    Returns a normalized histogram vector.
    """
    # Resize face to standard size
    face_resized = cv2.resize(face_img, (128, 128))
    
    # Convert to grayscale
    gray = cv2.cvtColor(face_resized, cv2.COLOR_BGR2GRAY)
    
    # Apply histogram equalization for lighting normalization
    gray = cv2.equalizeHist(gray)
    
    # Compute LBP-like descriptor using multiple feature approaches
    # 1. Pixel intensity histogram (normalized)
    hist_intensity = cv2.calcHist([gray], [0], None, [64], [0, 256])
    hist_intensity = cv2.normalize(hist_intensity, hist_intensity).flatten()
    
    # 2. Gradient histogram (captures edges/structure)
    sobelx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
    sobely = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
    magnitude = np.sqrt(sobelx**2 + sobely**2)
    direction = np.arctan2(sobely, sobelx)
    
    hist_magnitude = cv2.calcHist([magnitude.astype(np.float32)], [0], None, [32], [0, 256])
    hist_magnitude = cv2.normalize(hist_magnitude, hist_magnitude).flatten()
    
    hist_direction = cv2.calcHist([((direction + np.pi) / (2 * np.pi) * 255).astype(np.uint8)], [0], None, [32], [0, 256])
    hist_direction = cv2.normalize(hist_direction, hist_direction).flatten()
    
    # 3. Divide face into grid (4x4) and compute local histograms
    grid_hists = []
    cell_h, cell_w = gray.shape[0] // 4, gray.shape[1] // 4
    for i in range(4):
        for j in range(4):
            cell = gray[i*cell_h:(i+1)*cell_h, j*cell_w:(j+1)*cell_w]
            h = cv2.calcHist([cell], [0], None, [16], [0, 256])
            h = cv2.normalize(h, h).flatten()
            grid_hists.extend(h)
    
    # Combine all features into one encoding vector
    encoding = np.concatenate([hist_intensity, hist_magnitude, hist_direction, grid_hists])
    
    # Normalize the final vector
    norm = np.linalg.norm(encoding)
    if norm > 0:
        encoding = encoding / norm
    
    return encoding.tolist()


@face_bp.route('/api/face/register', methods=['POST'])
@login_required
def register_face():
    """Register user's face from a base64 image."""
    try:
        data = request.get_json(force=True)
    except Exception:
        return jsonify({'success': False, 'message': 'Invalid request body.'}), 400
    
    if not data:
        return jsonify({'success': False, 'message': 'No data received.'}), 400
        
    image_data = data.get('image', '')
    
    if not image_data or ',' not in image_data:
        return jsonify({'success': False, 'message': 'Invalid image data.'}), 400
        
    try:
        # Decode base64 image
        encoded_data = image_data.split(',')[1]
        nparr = np.frombuffer(base64.b64decode(encoded_data), np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            return jsonify({'success': False, 'message': 'Failed to decode image.'}), 400

        print(f"[*] Face registration: Image decoded, shape={img.shape}")

        # Convert to grayscale for face detection
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Detect faces using Haar cascade
        faces = face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(80, 80)
        )
        
        if len(faces) == 0:
            return jsonify({
                'success': False, 
                'message': 'No face detected! Please ensure your face is clearly visible and well-lit.'
            }), 400
            
        if len(faces) > 1:
            return jsonify({
                'success': False, 
                'message': 'Multiple faces detected! Please ensure only you are in the frame.'
            }), 400
        
        # Extract face region
        x, y, w, h = faces[0]
        # Add some padding around the face
        pad = int(0.15 * max(w, h))
        y1 = max(0, y - pad)
        y2 = min(img.shape[0], y + h + pad)
        x1 = max(0, x - pad)
        x2 = min(img.shape[1], x + w + pad)
        face_img = img[y1:y2, x1:x2]
        
        print(f"[*] Face detected at ({x},{y},{w},{h}), extracting encoding...")
        
        # Get face encoding
        encoding = get_face_encoding(face_img)
        print(f"[*] Face encoding extracted: {len(encoding)} dimensions")
        
        # Save the cropped face image so user can see what was scanned
        from flask import current_app
        upload_dir = os.path.join(current_app.root_path, 'static', 'uploads')
        os.makedirs(upload_dir, exist_ok=True)
        face_filename = f"{current_user.roll_no}_face.jpg"
        face_path = os.path.join(upload_dir, face_filename)
        cv2.imwrite(face_path, face_img)
        print(f"[*] Face image saved: {face_path}")
        
        # Save to database
        current_user.face_encoding = json.dumps(encoding)
        current_user.face_registered = True
        current_user.face_image = face_filename
        db.session.commit()
        
        print(f"[OK] Face registered for user: {current_user.name}")
        return jsonify({
            'success': True,
            'message': 'Face registered successfully! ✅',
            'face_image': face_filename
        })
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"[ERROR] Face registration error: {e}")
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500


@face_bp.route('/api/face/request-reset', methods=['POST'])
@login_required
def request_face_reset():
    """Student requests a face reset — needs admin approval."""
    if not current_user.face_registered:
        return jsonify({'success': False, 'message': 'No face registered to reset.'}), 400
    
    if current_user.face_reset_requested:
        return jsonify({'success': False, 'message': 'Reset request already pending.'}), 400
    
    current_user.face_reset_requested = True
    db.session.commit()
    
    print(f"[*] Face reset requested by: {current_user.name} ({current_user.roll_no})")
    return jsonify({
        'success': True,
        'message': 'Reset request submitted! Please wait for admin approval.'
    })


@face_bp.route('/api/face/verify', methods=['POST'])
@login_required
def verify_face():
    """Verify a face against the stored encoding for attendance."""
    if not current_user.face_registered or not current_user.face_encoding:
        return jsonify({'success': False, 'message': 'Face not registered. Please register first.'}), 400
    
    try:
        data = request.get_json(force=True)
    except Exception:
        return jsonify({'success': False, 'message': 'Invalid request.'}), 400
    
    image_data = data.get('image', '')
    subject = data.get('subject', '').strip()
    
    if not image_data or ',' not in image_data:
        return jsonify({'success': False, 'message': 'Invalid image data.'}), 400
    if not subject:
        return jsonify({'success': False, 'message': 'Please select a subject.'}), 400
        
    # --- 0. Portal Status Check ---
    from models.setting import Setting
    if Setting.get_value('portal_status', 'open') == 'closed':
        return jsonify({
            'success': False, 
            'message': 'The Attendance Portal is currently CLOSED. You cannot mark attendance at this time.'
        }), 403
        
    # --- 1. GPS Geofencing Check ---
    client_lat = data.get('lat')
    client_lng = data.get('lng')
    
    if not client_lat or not client_lng:
        return jsonify({'success': False, 'message': 'GPS Location required. Please allow location permissions.'}), 400
        
    distance = haversine_distance(COLLEGE_LAT, COLLEGE_LNG, float(client_lat), float(client_lng))
    print(f"[*] GPS Check: Student is {distance:.1f} meters away.")
    
    if distance > MAX_DISTANCE_METERS:
        return jsonify({
            'success': False, 
            'message': f'You are too far from the college ({int(distance)}m away). You must be within {MAX_DISTANCE_METERS}m to mark attendance.'
        }), 403
        
    # --- Check if already marked today ---
    from models.attendance import Attendance
    if Attendance.already_marked_today(current_user.id, subject):
        return jsonify({'success': False, 'message': f'Attendance for {subject} already marked today! ✅'}), 400
    
    try:
        # Decode image
        encoded_data = image_data.split(',')[1]
        nparr = np.frombuffer(base64.b64decode(encoded_data), np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            return jsonify({'success': False, 'message': 'Failed to decode image.'}), 400
        
        # Detect face
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(80, 80))
        
        if len(faces) == 0:
            return jsonify({'success': False, 'message': 'No face detected. Please look at the camera clearly.'}), 400
        
        # Extract face and get encoding
        x, y, w, h = faces[0]
        pad = int(0.15 * max(w, h))
        y1, y2 = max(0, y - pad), min(img.shape[0], y + h + pad)
        x1, x2 = max(0, x - pad), min(img.shape[1], x + w + pad)
        face_img = img[y1:y2, x1:x2]
        
        # --- 2. Passive Liveness Check (Anti-Spoof) ---
        is_real, liveness_msg = check_liveness_texture(face_img)
        if not is_real:
            print(f"[!] Spoofing detected for {current_user.name}: {liveness_msg}")
            return jsonify({'success': False, 'message': f'Liveness Check Failed: {liveness_msg}'}), 403
        
        live_encoding = get_face_encoding(face_img)
        stored_encoding = json.loads(current_user.face_encoding)
        
        # Compare using cosine similarity
        live_vec = np.array(live_encoding)
        stored_vec = np.array(stored_encoding)
        
        dot_product = np.dot(live_vec, stored_vec)
        norm_live = np.linalg.norm(live_vec)
        norm_stored = np.linalg.norm(stored_vec)
        
        if norm_live == 0 or norm_stored == 0:
            return jsonify({'success': False, 'message': 'Face encoding error. Try again.'}), 400
        
        similarity = dot_product / (norm_live * norm_stored)
        confidence = round(float(similarity) * 100, 1)
        
        print(f"[*] Face verify for {current_user.name}: similarity={similarity:.4f}, confidence={confidence}%")
        
        THRESHOLD = 0.75  # 75% match required
        
        if similarity >= THRESHOLD:
            # MATCH — Mark attendance!
            attendance = Attendance(
                student_id=current_user.id,
                subject=subject,
                status='present',
                confidence=confidence
            )
            db.session.add(attendance)
            db.session.commit()
            
            print(f"[OK] Attendance marked: {current_user.name} → {subject} ({confidence}%)")
            return jsonify({
                'success': True,
                'message': f'Attendance marked for {subject}! ✅',
                'confidence': confidence,
                'subject': subject
            })
        else:
            print(f"[!] Face mismatch for {current_user.name}: {confidence}%")
            return jsonify({
                'success': False,
                'message': f'Face not matched ({confidence}% confidence). Please try again in better lighting.',
                'confidence': confidence
            }), 400
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500
