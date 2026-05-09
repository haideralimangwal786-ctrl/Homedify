import cv2
import time
import json
import os
import random
import warnings
from mtcnn import MTCNN
from deepface import DeepFace

os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
warnings.filterwarnings("ignore")

def capture_selfie_with_liveness(cnic_face_path="processed/cnic_face.jpg"):
    if not os.path.exists(cnic_face_path):
        return {"error": "CNIC face not found. Run Step 1 first!"}

    print("\n[ULTIMATE LIVENESS DETECTION STARTED]")
    print("Loading AI Models (MTCNN + OpenCV Eyes)...")
    
    face_detector = MTCNN()
    eye_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_eye_tree_eyeglasses.xml')
    
    cap = cv2.VideoCapture(0)
    selfie_path = "processed/live_selfie.jpg"
    
    # LOOK DOWN removed
    all_challenges = ["LOOK UP", "LOOK LEFT", "LOOK RIGHT"]
    
    active_challenges = random.sample(all_challenges, 2)
    print(f"🎲 Your Random Challenges for this session: {active_challenges}")
    
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
            ml = keypoints['mouth_left']
            mr = keypoints['mouth_right']
            
            eye_width = re[0] - le[0]
            if eye_width > 0:
                eye_y_center = (le[1] + re[1]) / 2
                mouth_y_center = (ml[1] + mr[1]) / 2
                face_height = mouth_y_center - eye_y_center
                
                # Ratios for movement
                turn_x = (n[0] - le[0]) / eye_width         
                pitch_y = (n[1] - eye_y_center) / face_height 

                # --- COOLDOWN LOGIC ---
                if time.time() < cooldown_until:
                    msg = "✅ GREAT! Get Ready..."
                    color = (0, 255, 0)

                # --- STAGE 0 & 1: EXECUTE RANDOM CHALLENGES ---
                elif stage < 2:
                    current_task = active_challenges[stage]
                    msg = f"Task {stage+1}/2: {current_task}"
                    color = (0, 165, 255) 
                    
                    task_passed = False
                    
                    # 1. BLINK LOGIC
                    # 1. BLINK LOGIC removed
                            
                    # 2. MOVEMENT LOGIC
                    elif current_task == "LOOK RIGHT" and turn_x > 0.75:
                        task_passed = True
                    elif current_task == "LOOK LEFT" and turn_x < 0.25:
                        task_passed = True
                    elif current_task == "LOOK UP" and pitch_y < 0.35:
                        task_passed = True
                    # LOOK DOWN Logic removed

                    if task_passed:
                        print(f"✅ [{current_task}] Passed!")
                        stage += 1
                        cooldown_until = time.time() + 2.0 # 2 Seconds Smooth Cooldown

                # --- STAGE 2: LOOK CENTER & CAPTURE ---
                elif stage == 2:
                    msg = "PERFECT! Look CENTER & Wait..."
                    color = (0, 255, 0) 
                    
                    if 0.4 < turn_x < 0.6 and 0.4 < pitch_y < 0.6:
                        if capture_start_time == 0:
                            capture_start_time = time.time()
                        
                        if time.time() - capture_start_time > 1.5:
                            cv2.imwrite(selfie_path, frame)
                            print("✅ Live Selfie Auto-Captured!")
                            break
                    else:
                        capture_start_time = 0

        cv2.putText(frame, msg, (20, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)
        cv2.imshow("Ultimate Liveness Security", frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

    if stage != 2:
        return {"error": "Liveness check failed or cancelled."}

    # ==========================================
    # 2. DEEPFACE MATCHING
    # ==========================================
    print("🤖 AI is comparing faces using ArcFace... Please wait.")
    try:
        result = DeepFace.verify(
            img1_path=cnic_face_path, 
            img2_path=selfie_path, 
            model_name="ArcFace",
            distance_metric="cosine",
            enforce_detection=False
        )

        distance = result["distance"]
        confidence_score = round((1 - distance) * 100, 1)

        # 💡 THRESHOLD UPDATED TO 0.68 TO FIX FALSE POSITIVES
        if distance < 0.68:
            match_status = True
            result_text = "VERIFIED"
        else:
            match_status = False
            result_text = "REJECTED"

        print(f"Match Logic Result: Distance is {distance:.4f} -> {result_text}")

        output_json = {
            "liveness_passed": True,
            "face_match": match_status,
            "confidence": confidence_score
        }
        return json.dumps(output_json, indent=4)

    except Exception as e:
        return {"error": f"Face verification failed: {str(e)}"}

if __name__ == "__main__":
    result = capture_selfie_with_liveness()
    print("\n--- STEP 2 OUTPUT ---")
    print(result)