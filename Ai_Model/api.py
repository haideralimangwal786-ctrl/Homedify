import os
import cv2
import easyocr
import re
import warnings
import time
import base64
from flask import Flask, request, jsonify
from flask_cors import CORS
from mtcnn import MTCNN
from deepface import DeepFace

os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
warnings.filterwarnings("ignore")

app = Flask(__name__)
CORS(app)

print("Booting up the Ultimate AI Decision Engine API...")
print("Loading AI Models (EasyOCR, MTCNN, DeepFace)... Please wait.")

# Initialize models globally so they stay in memory
print("Pre-loading EasyOCR...")
reader = easyocr.Reader(['en'], gpu=False, verbose=False)
print("Pre-loading MTCNN Face Detector...")
face_detector = MTCNN()
print("Pre-loading DeepFace (ArcFace) model...")
# Trigger a build/load to avoid delay on first request
try:
    DeepFace.build_model("ArcFace")
    print("All AI Models loaded and cached in RAM.")
except Exception as e:
    print(f"Warning: DeepFace preloading failed: {e}")

os.makedirs("processed", exist_ok=True)

def extract_cnic_info(image_path):
    try:
        print(f"Step 1: Processing image {image_path}...")
        img = cv2.imread(image_path)
        if img is None:
            return {"success": False, "error": f"CV2 failed to read image at {image_path}"}
        
        extracted = {"name": "Not Found", "cnic": "Not Found", "gender": "Not Found", "cnic_face_path": ""}

        # 1. Face Detection (Non-blocking for Scan)
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        print("Running Face Detection on CNIC...")
        start_face = time.time()
        faces = face_detector.detect_faces(img_rgb)
        if faces:
            print(f"Face detected in {time.time() - start_face:.2f}s.")
            x, y, w, h = faces[0]['box']
            x, y = max(0, x - 20), max(0, y - 40)
            w, h = w + 40, h + 80
            face_img = img[y:y+h, x:x+w]
            if face_img.size != 0:
                # Use timestamp to avoid collision
                cnic_face_path = f"processed/cnic_face_{int(time.time())}.jpg"
                cv2.imwrite(cnic_face_path, face_img)
                extracted["cnic_face_path"] = cnic_face_path
                print(f"CNIC Face Cropped & Saved to {cnic_face_path}")
        else:
            print(f"ERROR: No face found on CNIC photo (detection took {time.time() - start_face:.2f}s).")
            return {"success": False, "error": "No face found on CNIC. Please upload a clear photo showing the face."}

        # 2. Smart Resizing & OCR
        print("Running EasyOCR Text Extraction...")
        start_ocr = time.time()
        
        # Smart Resizing: Aim for a target width of ~1200px for optimal speed/accuracy balance
        height, width = img.shape[:2]
        target_width = 1200
        scale = target_width / width
        
        # If the image is already in a good range (800-1500), don't change it
        if 800 <= width <= 1500:
            scale = 1.0
        else:
            # Clamp scale between 0.5x and 2.0x to prevent extreme distortions
            scale = max(0.5, min(2.0, scale))
        
        print(f"Original Size: {width}x{height} | Scale: {scale:.2f}x | Target: ~{int(width*scale)}px width")
        
        # Using INTER_AREA for downscaling (sharper) and INTER_CUBIC for upscaling
        interp = cv2.INTER_AREA if scale < 1.0 else cv2.INTER_CUBIC
        img_resized = cv2.resize(img, None, fx=scale, fy=scale, interpolation=interp)
        
        ocr_results = reader.readtext(cv2.cvtColor(img_resized, cv2.COLOR_BGR2GRAY), detail=0)
        print(f"OCR completed in {time.time() - start_ocr:.2f}s. Parsing data...")
        
        cnic_pattern = r'\b\d{5}[-\s]?\d{7}[-\s]?\d\b'
        dob_pattern = r'\b\d{2}[.\/-]\d{2}[.\/-]\d{4}\b'
        
        extracted["dob"] = "Not Found" # Initialize DOB

        for i, text in enumerate(ocr_results):
            text_upper = text.upper().strip()
            
            # --- CNIC Number ---
            if re.search(cnic_pattern, text):
                extracted["cnic"] = re.search(cnic_pattern, text).group(0).replace(" ", "-")
            
            # --- Date of Birth ---
            if re.search(dob_pattern, text) and extracted["dob"] == "Not Found":
                match = re.search(dob_pattern, text).group(0)
                context = (" ".join(ocr_results[max(0, i-1):i+1])).upper()
                if "BIRTH" in context or "DOB" in context:
                    extracted["dob"] = match
                elif extracted["dob"] == "Not Found":
                    extracted["dob"] = match

            # --- NAME Detection (Enhanced) ---
            if "NAME" in text_upper and "FATHER" not in text_upper and "HUSBAND" not in text_upper:
                # Case 1: Name is on the same line after a colon/space (e.g. "Name: Haider Khan")
                if len(text) > 6:
                    potential_name = re.sub(r'NAME[\s:]*', '', text, flags=re.IGNORECASE).strip()
                    if potential_name:
                        extracted["name"] = potential_name
                # Case 2: Name is on the next line
                elif i + 1 < len(ocr_results) and extracted["name"] == "Not Found":
                    extracted["name"] = ocr_results[i + 1]
            
            # --- GENDER Detection (Enhanced) ---
            if extracted["gender"] == "Not Found":
                # Check for direct matches or substrings
                if text_upper in ["M", "MALE", "MALE /"]:
                    extracted["gender"] = "Male"
                elif text_upper in ["F", "FEMALE", "FEMALE /"]:
                    extracted["gender"] = "Female"
                elif "GENDER" in text_upper or "SEX" in text_upper:
                    if "M" in text_upper and "F" not in text_upper:
                        extracted["gender"] = "Male"
                    elif "F" in text_upper:
                        extracted["gender"] = "Female"
                    elif i + 1 < len(ocr_results):
                        nxt = ocr_results[i+1].upper().strip()
                        if any(m in nxt for m in ["MALE", " M ", "/M"]): extracted["gender"] = "Male"
                        elif any(f in nxt for f in ["FEMALE", " F ", "/F"]): extracted["gender"] = "Female"
                        
        # Fallback Regex for Gender if still Not Found
        if extracted["gender"] == "Not Found":
            full_text = " ".join([t.upper() for t in ocr_results])
            if re.search(r'\b(FEMALE|SEX[\s:\-\/]+F|GENDER[\s:\-\/]+F|F\b)', full_text):
                extracted["gender"] = "Female"
            elif re.search(r'\b(MALE|SEX[\s:\-\/]+M|GENDER[\s:\-\/]+M|M\b)', full_text):
                extracted["gender"] = "Male"

        # Fallback for Name: If still Not Found, look for typical Pakistani name positions
        if extracted["name"] == "Not Found" or extracted["name"] == "NAME":
            for i, text in enumerate(ocr_results):
                # Smart CNICs often have name near the top
                if i < 8 and len(text.split()) >= 2 and text.isupper() and "IDENTITY" not in text.upper():
                    extracted["name"] = text
                    break

        extracted["success"] = True
        print(f"Extraction Results: {extracted['name']} | {extracted['cnic']} | {extracted['gender']} | DOB: {extracted['dob']}")
        return extracted
    except Exception as e:
        print(f"CRITICAL ERROR in extract_cnic_info: {str(e)}")
        return {"success": False, "error": str(e)}


@app.route('/')
def health_check():
    return jsonify({
        "status": "online",
        "service": "Homedify AI Trust Engine",
        "endpoints": ["/api/scan_cnic", "/api/verify_seller", "/api/face_match"]
    })


@app.route('/api/scan_cnic', methods=['POST'])
def scan_cnic():
    """Standalone CNIC OCR endpoint - extracts text from CNIC image only."""
    try:
        print("\n--- New CNIC Scan Request ---")
        if 'cnic_image' not in request.files:
            print("Missing cnic_image in request.files")
            return jsonify({"success": False, "message": "Missing cnic_image"}), 400

        cnic_file = request.files['cnic_image']
        
        # Read file length for diagnostics
        file_content = cnic_file.read()
        print(f"Received file: {cnic_file.filename} | Length: {len(file_content)} bytes")
        cnic_file.seek(0) # Reset pointer
        
        # Save with proper .jpg extension for OpenCV compatibility
        original_ext = os.path.splitext(cnic_file.filename)[1].lower() if cnic_file.filename else '.jpg'
        if original_ext not in ['.jpg', '.jpeg', '.png', '.bmp', '.webp']:
            original_ext = '.jpg'
        
        cnic_path = os.path.join("processed", f"scan_{int(time.time() * 1000)}{original_ext}")
        cnic_file.save(cnic_path)
        print(f"CNIC saved as: {cnic_path}")

        step1 = extract_cnic_info(cnic_path)
        
        if not step1["success"]:
            return jsonify({
                "success": False, 
                "message": step1.get("error", "OCR Failed"),
                "ocrResults": {"name": "Not Found", "cnic": "Not Found", "gender": "Not Found", "dob": "Not Found"}
            })

        # Convert cropped face to base64 for UI feedback
        cnic_face_base64 = ""
        if step1.get("cnic_face_path") and os.path.exists(step1["cnic_face_path"]):
            try:
                with open(step1["cnic_face_path"], "rb") as f:
                    cnic_face_base64 = base64.b64encode(f.read()).decode('utf-8')
            except Exception as e:
                print(f"Base64 encoding error: {e}")

        return jsonify({
            "success": True,
            "message": "CNIC scanned successfully",
            "ocrResults": {
                "name": step1.get("name", "Not Found"),
                "cnic": step1.get("cnic", "Not Found"),
                "gender": step1.get("gender", "Not Found"),
                "dob": step1.get("dob", "Not Found"),
                "cnic_face_base64": cnic_face_base64
            }
        })

    except Exception as e:
        print(f"CRITICAL ERROR in /api/scan_cnic: {str(e)}")
        return jsonify({"success": False, "message": f"Server Error: {str(e)}"}), 500


@app.route('/api/face_match', methods=['POST'])
def face_match():
    """
    Quick face match: CNIC face (base64 string) vs live selfie (file upload).
    No OCR, no gender check — just pure face comparison using DeepFace ArcFace.
    Used for pre-submission face check in the frontend Step 3 popup.
    """
    print("\n--- Quick Face Match Request ---")
    try:
        cnic_face_b64 = request.form.get('cnic_face_base64', '')
        if not cnic_face_b64:
            return jsonify({"success": False, "message": "Missing cnic_face_base64"}), 400
        if 'selfie_image' not in request.files:
            return jsonify({"success": False, "message": "Missing selfie_image"}), 400

        ts = int(time.time() * 1000)

        # Decode and save CNIC face from base64
        cnic_face_path = f"processed/qcnic_{ts}.jpg"
        with open(cnic_face_path, "wb") as f:
            f.write(base64.b64decode(cnic_face_b64))

        # Save selfie file
        selfie_file = request.files['selfie_image']
        selfie_ext = os.path.splitext(selfie_file.filename)[1].lower() if selfie_file.filename else '.jpg'
        if selfie_ext not in ['.jpg', '.jpeg', '.png', '.bmp', '.webp']:
            selfie_ext = '.jpg'
        selfie_path = f"processed/qselfie_{ts}{selfie_ext}"
        selfie_file.save(selfie_path)

        print(f"Comparing CNIC face vs Selfie...")

        result = DeepFace.verify(
            img1_path=cnic_face_path,
            img2_path=selfie_path,
            model_name="ArcFace",
            distance_metric="cosine",
            enforce_detection=False
        )
        distance = result["distance"]
        confidence = round((1 - distance) * 100, 1)
        is_match = distance < 0.68

        print(f"Quick Match: {'MATCH' if is_match else 'NO MATCH'} | Confidence: {confidence}%")

        # Cleanup temp files
        for p in [cnic_face_path, selfie_path]:
            try:
                os.remove(p)
            except Exception:
                pass

        return jsonify({
            "success": True,
            "matched": is_match,
            "confidence": confidence,
            "distance": round(distance, 4)
        })

    except Exception as e:
        print(f"CRITICAL ERROR in /api/face_match: {str(e)}")
        return jsonify({"success": False, "message": f"Face match error: {str(e)}"}), 500


@app.route('/api/verify_seller', methods=['POST'])
def verify_seller():
    print("\n--- New Incoming Verification Request ---")
    if 'cnic_image' not in request.files or 'selfie_image' not in request.files:
        return jsonify({"success": False, "message": "Missing cnic_image or selfie_image"}), 400

    cnic_file = request.files['cnic_image']
    selfie_file = request.files['selfie_image']

    # Preserve original extension for OpenCV compatibility
    cnic_ext = os.path.splitext(cnic_file.filename)[1].lower() if cnic_file.filename else '.jpg'
    selfie_ext = os.path.splitext(selfie_file.filename)[1].lower() if selfie_file.filename else '.jpg'
    if cnic_ext not in ['.jpg', '.jpeg', '.png', '.bmp', '.webp']:
        cnic_ext = '.jpg'
    if selfie_ext not in ['.jpg', '.jpeg', '.png', '.bmp', '.webp']:
        selfie_ext = '.jpg'

    cnic_path = os.path.join("processed", f"uploaded_cnic{cnic_ext}")
    selfie_path = os.path.join("processed", f"uploaded_selfie{selfie_ext}")

    cnic_file.save(cnic_path)
    selfie_file.save(selfie_path)
    print(f"CNIC saved: {cnic_path} (from: {cnic_file.filename})")
    print(f"Selfie saved: {selfie_path} (from: {selfie_file.filename})")

    # STEP 1: CNIC Processing
    step1 = extract_cnic_info(cnic_path)
    if not step1["success"]:
        return jsonify({
            "step1_data": step1,
            "step2_data": None,
            "FINAL_DECISION": "REJECTED",
            "reason": step1.get("error", "CNIC OCR Failed")
        })

    target_gender = "Female"

    if step1["gender"] != target_gender:
        return jsonify({
            "step1_data": step1,
            "step2_data": None,
            "FINAL_DECISION": "REJECTED",
            "reason": f"Gender is {step1['gender']}. Homedify is a platform exclusively for Female Entrepreneurs."
        })
    
    # STEP 2: Face Comparison 
    try:
        print("Starting Face Matching Analysis (DeepFace)...")
        result = DeepFace.verify(
            img1_path=step1["cnic_face_path"], 
            img2_path=selfie_path, 
            model_name="ArcFace", 
            distance_metric="cosine", 
            enforce_detection=False
        )
        distance = result["distance"]
        confidence = round((1 - distance) * 100, 1)
        
        is_match = distance < 0.68
        print(f"Match Outcome: {'SUCCESS' if is_match else 'FAILED'} (Confidence: {confidence})")
        
        step2 = {
            "success": True,
            "face_match": is_match,
            "confidence": confidence
        }

        if is_match:
            decision = "VERIFIED SELLER"
            reason = "Gender matched, Liveness Passed, and Face matched successfully."
        else:
            decision = "REJECTED"
            reason = "Liveness passed, but Face did not match with CNIC."

        return jsonify({
            "step1_data": step1,
            "step2_data": step2,
            "FINAL_DECISION": decision,
            "reason": reason
        })

    except Exception as e:
        print(f"CRITICAL ERROR: {str(e)}")
        return jsonify({
            "step1_data": step1,
            "step2_data": {"success": False, "error": str(e)},
            "FINAL_DECISION": "REJECTED",
            "reason": f"Error during face comparison: {str(e)}"
        })


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=False, threaded=True)
