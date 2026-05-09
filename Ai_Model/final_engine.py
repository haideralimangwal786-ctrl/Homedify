import cv2
import easyocr
import json
import os
import re
import time
import random
import warnings
from mtcnn import MTCNN
from deepface import DeepFace

# ==========================================
# 0. SETUP & WARNINGS
# ==========================================
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
warnings.filterwarnings("ignore")

print("🚀 Booting up the Ultimate AI Decision Engine...")
print("Loading AI Models (EasyOCR, MTCNN, OpenCV)... Please wait.")

# AI Models Initialize (Sirf ek dafa load honge)
reader = easyocr.Reader(['en'], gpu=False, verbose=False)
face_detector = MTCNN()
eye_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_eye_tree_eyeglasses.xml')

# ==========================================
# STEP 1: CNIC PROCESSING
# ==========================================
def run_step1_cnic(image_path):
    print("\n--- [STEP 1: CNIC PROCESSING] ---")
    img = cv2.imread(image_path)
    if img is None:
        return {"success": False, "error": "Image not found."}
    
    extracted = {"name": "Not Found", "cnic": "Not Found", "gender": "Not Found", "cnic_face_path": ""}

    # 1. Face Detection
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    faces = face_detector.detect_faces(img_rgb)
    if faces:
        x, y, w, h = faces[0]['box']
        x, y = max(0, x - 20), max(0, y - 40)
        w, h = w + 40, h + 80
        face_img = img[y:y+h, x:x+w]
        if face_img.size != 0:
            extracted["cnic_face_path"] = "processed/cnic_face.jpg"
            cv2.imwrite(extracted["cnic_face_path"], face_img)
            print("✅ CNIC Face Extracted Successfully!")
    else:
        return {"success": False, "error": "No face found on CNIC."}

    # 2. OCR & Text Extraction
    img_resized = cv2.resize(img, None, fx=1.5, fy=1.5, interpolation=cv2.INTER_CUBIC)
    ocr_results = reader.readtext(cv2.cvtColor(img_resized, cv2.COLOR_BGR2GRAY), detail=0)
    
    cnic_pattern = r'\b\d{5}[-\s]?\d{7}[-\s]?\d\b'
    for i, text in enumerate(ocr_results):
        text_upper = text.upper()
        if re.search(cnic_pattern, text):
            extracted["cnic"] = re.search(cnic_pattern, text).group(0).replace(" ", "-")
        if text_upper == "NAME" and i + 1 < len(ocr_results):
            extracted["name"] = ocr_results[i + 1]
        if text_upper in ["M", "MALE"] and extracted["gender"] == "Not Found":
            extracted["gender"] = "Male"
        elif text_upper in ["F", "FEMALE"] and extracted["gender"] == "Not Found":
            extracted["gender"] = "Female"

    extracted["success"] = True
    print(f"✅ Data Extracted: {extracted['name']} | {extracted['cnic']} | {extracted['gender']}")
    return extracted

# ==========================================
# STEP 2: LIVENESS & CAMERA MATCHING
# ==========================================
def run_step2_camera(cnic_face_path):
    print("\n--- [STEP 2: LIVE CAMERA VERIFICATION] ---")
    cap = cv2.VideoCapture(0)
    selfie_path = "processed/live_selfie.jpg"
    
    # LOOK DOWN removed
    all_challenges = ["LOOK UP", "LOOK LEFT", "LOOK RIGHT"]
    active_challenges = random.sample(all_challenges, 2)
    print(f"🎲 Random Security Challenges: {active_challenges}")
    
    stage = 0 
    capture_start_time = 0
    blink_frames = 0 
    cooldown_until = 0 # Cooldown timer variable

    while True:
        ret, frame = cap.read()
        if not ret: break
        
        frame = cv2.flip(frame, 1)
        gray_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        msg = "Searching for face..."
        color = (0, 0, 255)

        try:
            faces = face_detector.detect_faces(rgb_frame)
        except Exception:
            continue

        if faces:
            face = faces[0]
            keypoints = face['keypoints']
            x, y, w, h = face['box']
            x, y = abs(x), abs(y) 
            
            le = keypoints['left_eye']
            re = keypoints['right_eye']
            n = keypoints['nose']
            
            eye_width = re[0] - le[0]
            if eye_width > 0:
                eye_y_center = (le[1] + re[1]) / 2
                face_height = h  
                
                turn_x = (n[0] - le[0]) / eye_width         
                pitch_y = (n[1] - eye_y_center) / face_height 

                # --- COOLDOWN LOGIC ---
                if time.time() < cooldown_until:
                    msg = "✅ GREAT! Get Ready..."
                    color = (0, 255, 0)
                
                # --- EXECUTE CHALLENGES ---
                elif stage < 2:
                    current_task = active_challenges[stage]
                    msg = f"Task {stage+1}/2: {current_task}"
                    color = (0, 165, 255) 
                    task_passed = False
                    
                    # BLINK LOGIC removed
                            
                    elif current_task == "LOOK RIGHT" and turn_x > 0.75: task_passed = True
                    elif current_task == "LOOK LEFT" and turn_x < 0.25: task_passed = True
                    elif current_task == "LOOK UP" and pitch_y < 0.35: task_passed = True
                    # LOOK DOWN Logic removed

                    if task_passed:
                        print(f"✅ [{current_task}] Passed!")
                        stage += 1
                        cooldown_until = time.time() + 2.0 # 2 Seconds Smooth Cooldown

                # --- Auto Capture ---
                elif stage == 2:
                    msg = "PERFECT! Look CENTER & Wait..."
                    color = (0, 255, 0) 
                    
                    if 0.4 < turn_x < 0.6:
                        if capture_start_time == 0: capture_start_time = time.time()
                        if time.time() - capture_start_time > 1.5:
                            cv2.imwrite(selfie_path, frame)
                            print("✅ Live Selfie Auto-Captured!")
                            break
                    else:
                        capture_start_time = 0

        cv2.putText(frame, msg, (20, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)
        cv2.imshow("Security Check - Live Camera", frame)

        if cv2.waitKey(1) & 0xFF == ord('q'): break

    cap.release()
    cv2.destroyAllWindows()

    if stage != 2:
        return {"success": False, "error": "Liveness check failed or cancelled."}

    print("🤖 AI is comparing faces using ArcFace...")
    try:
        result = DeepFace.verify(
            img1_path=cnic_face_path, 
            img2_path=selfie_path, 
            model_name="ArcFace", 
            distance_metric="cosine", 
            enforce_detection=False
        )
        distance = result["distance"]
        confidence = round((1 - distance) * 100, 1)
        
        # 💡 THRESHOLD UPDATED TO 0.68 TO FIX FALSE POSITIVES
        is_match = distance < 0.68
        
        print(f"✅ Match Score: {distance:.4f} (Match: {is_match})")
        return {"success": True, "face_match": is_match, "confidence": confidence}
    except Exception as e:
        return {"success": False, "error": str(e)}

# ==========================================
# 🚀 FINAL AI DECISION ENGINE
# ==========================================
def main_engine():
    os.makedirs("processed", exist_ok=True)
    test_image_path = "test_images/sample_cnic.jpg" 
    
    final_output = {
        "step1_data": None,
        "step2_data": None,
        "FINAL_DECISION": "PENDING",
        "reason": ""
    }

    # --- RUN STEP 1 ---
    step1 = run_step1_cnic(test_image_path)
    final_output["step1_data"] = step1

    if not step1["success"]:
        final_output["FINAL_DECISION"] = "REJECTED"
        final_output["reason"] = step1["error"]
        print(json.dumps(final_output, indent=4))
        return

    # --- CHECK GENDER LOGIC ---
    # 💡 UPDATED: Ab sirf Female sellers ko allow karega
    if step1["gender"] != "Female": 
        final_output["FINAL_DECISION"] = "REJECTED"
        final_output["reason"] = f"Gender is {step1['gender']}. Only Female sellers allowed in this test."
        print(f"\n❌ REJECTED: {final_output['reason']}")
        print("\n--- FINAL JSON OUTPUT ---")
        print(json.dumps(final_output, indent=4))
        return

    # --- RUN STEP 2 (With Liveness) ---
    step2 = run_step2_camera(step1["cnic_face_path"])
    final_output["step2_data"] = step2

    if not step2.get("success", False):
        final_output["FINAL_DECISION"] = "REJECTED"
        final_output["reason"] = step2.get("error", "Unknown Camera Error")
    else:
        # --- FINAL MATCH LOGIC ---
        if step2["face_match"] == True:
            final_output["FINAL_DECISION"] = "VERIFIED SELLER"
            final_output["reason"] = "Gender matched, Liveness Passed, and Face matched successfully."
            print("\n🎉 SUCCESS: You are a VERIFIED SELLER!")
        else:
            final_output["FINAL_DECISION"] = "REJECTED"
            final_output["reason"] = "Liveness passed, but Face did not match with CNIC."
            print("\n❌ REJECTED: Face Mismatch!")

    # Print Final JSON
    print("\n==================================")
    print("      FINAL AI DECISION JSON      ")
    print("==================================")
    print(json.dumps(final_output, indent=4))

if __name__ == "__main__":
    main_engine()