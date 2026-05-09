import cv2
import easyocr
import json
import os
import re
import warnings

# ==========================================
# 0. WARNINGS KO CHUP KARWANA
# ==========================================
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
warnings.filterwarnings("ignore", category=UserWarning)

from mtcnn import MTCNN 

# EasyOCR aur MTCNN Initialize
reader = easyocr.Reader(['en'], gpu=False, verbose=False)
face_detector = MTCNN()

def extract_cnic_details(image_path):
    img = cv2.imread(image_path)
    if img is None:
        return {"error": "Image not found."}
    
    extracted_data = {"name": "Not Found", "cnic": "Not Found", "gender": "Not Found", "cnic_face_path": ""}

    # ==========================================
    # 1. FACE DETECTION (Using MTCNN)
    # ==========================================
    print("Detecting face using MTCNN...")
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    faces = face_detector.detect_faces(img_rgb)
    
    if faces:
        face_info = faces[0]
        x, y, w, h = face_info['box']
        
        # Padding add ki taake face theek se aaye
        x, y = max(0, x - 20), max(0, y - 40)
        w, h = w + 40, h + 80
        
        face_img = img[y:y+h, x:x+w]
        if face_img.size != 0:
            face_saved_path = "processed/cnic_face.jpg"
            cv2.imwrite(face_saved_path, face_img)
            extracted_data["cnic_face_path"] = face_saved_path
            print("✅ Face detected and saved!")
    else:
        print("❌ No face detected.")

    # ==========================================
    # 2. IMAGE PREPROCESSING FOR OCR
    # ==========================================
    print("Extracting text from CNIC...")
    img_resized = cv2.resize(img, None, fx=1.5, fy=1.5, interpolation=cv2.INTER_CUBIC)
    gray = cv2.cvtColor(img_resized, cv2.COLOR_BGR2GRAY)
    
    ocr_results = reader.readtext(gray, detail=0)
    
    # ==========================================
    # 3. EXTRACT DETAILS FROM TEXT (Smart Logic)
    # ==========================================
    cnic_pattern = r'\b\d{5}[-\s]?\d{7}[-\s]?\d\b'
    
    for i, text in enumerate(ocr_results):
        text_upper = text.upper()
        
        # 1. CNIC Number Match
        cnic_match = re.search(cnic_pattern, text)
        if cnic_match:
            extracted_data["cnic"] = cnic_match.group(0).replace(" ", "-")
            
        # 2. Name Match (Enhanced)
        if "NAME" in text_upper and "FATHER" not in text_upper and "HUSBAND" not in text_upper:
            if len(text) > 6: # e.g. "Name: Haider Khan"
                potential_name = re.sub(r'NAME[\s:]*', '', text, flags=re.IGNORECASE).strip()
                if potential_name: extracted_data["name"] = potential_name
            elif i + 1 < len(ocr_results):
                extracted_data["name"] = ocr_results[i + 1]
            
        # 3. Gender Match (Enhanced)
        if extracted_data["gender"] == "Not Found":
            if text_upper in ["M", "MALE", "MALE /"]:
                extracted_data["gender"] = "Male"
            elif text_upper in ["F", "FEMALE", "FEMALE /"]:
                extracted_data["gender"] = "Female"
            elif "GENDER" in text_upper or "SEX" in text_upper:
                if "M" in text_upper and "F" not in text_upper: extracted_data["gender"] = "Male"
                elif "F" in text_upper: extracted_data["gender"] = "Female"
                elif i + 1 < len(ocr_results):
                    nxt = ocr_results[i+1].upper().strip()
                    if any(m in nxt for m in ["MALE", " M ", "/M"]): extracted_data["gender"] = "Male"
                    elif any(f in nxt for f in ["FEMALE", " F ", "/F"]): extracted_data["gender"] = "Female"

    # Fallback Regex for Gender
    if extracted_data["gender"] == "Not Found":
        full_text = " ".join([t.upper() for t in ocr_results])
        if re.search(r'\b(FEMALE|SEX[\s:\-\/]+F|GENDER[\s:\-\/]+F|F\b)', full_text):
            extracted_data["gender"] = "Female"
        elif re.search(r'\b(MALE|SEX[\s:\-\/]+M|GENDER[\s:\-\/]+M|M\b)', full_text):
            extracted_data["gender"] = "Male"

    # Fallback for Name
    if extracted_data["name"] == "Not Found" or extracted_data["name"] == "NAME":
        for i, text in enumerate(ocr_results):
            if i < 8 and len(text.split()) >= 2 and text.isupper() and "IDENTITY" not in text.upper():
                extracted_data["name"] = text
                break

    return json.dumps(extracted_data, indent=4)

# ==========================================
# 4. SCRIPT EXECUTION BLOCK
# ==========================================
if __name__ == "__main__":
    test_image_path = "test_images/sample_cnic.jpg" 
    os.makedirs("processed", exist_ok=True)
    
    result = extract_cnic_details(test_image_path)
    print("\n--- STEP 1 OUTPUT ---")
    print(result)