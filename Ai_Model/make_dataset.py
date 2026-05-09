import os
import cv2
import numpy as np
import random

input_dataset_dir = "lfw-deepfunneled" 
output_dataset_dir = "CNIC_Custom_Dataset"
os.makedirs(output_dataset_dir, exist_ok=True)

print("🛠️ Refining the CNIC Data Factory (Reducing Noise)...")

max_people_to_process = 50 
processed_count = 0

for person_folder in os.listdir(input_dataset_dir):
    if processed_count >= max_people_to_process: break
    person_path = os.path.join(input_dataset_dir, person_folder)
    
    if os.path.isdir(person_path):
        images = [f for f in os.listdir(person_path) if f.endswith(".jpg")]
        if len(images) > 0:
            img = cv2.imread(os.path.join(person_path, images[0]))
            if img is not None:
                output_person_folder = os.path.join(output_dataset_dir, person_folder)
                os.makedirs(output_person_folder, exist_ok=True)
                
                # 1. Save Original Selfie
                cv2.imwrite(os.path.join(output_person_folder, "selfie.jpg"), img)
                
                # 2. Realistic CNIC Effect
                # A. Resolution thori kam (Bohat zyada nahi)
                h, w = img.shape[:2]
                temp = cv2.resize(img, (int(w * 0.4), int(h * 0.4)), interpolation=cv2.INTER_AREA)
                
                # B. Light Blur
                temp = cv2.GaussianBlur(temp, (3, 3), 0)
                
                # C. Very Light Noise (Sirf texture ke liye)
                noise = np.random.normal(0, 5, temp.shape).astype(np.uint8) # 12 se kam kar ke 5 kar diya
                temp = cv2.add(temp, noise)
                
                # D. Dull Colors (CNIC look)
                temp = cv2.convertScaleAbs(temp, alpha=0.85, beta=10)
                
                # E. Resize Back
                cnic_fake = cv2.resize(temp, (w, h), interpolation=cv2.INTER_CUBIC)
                
                cv2.imwrite(os.path.join(output_person_folder, "cnic_photo.jpg"), cnic_fake)
                processed_count += 1
                print(f"✅ Fixed: {person_folder}")

print(f"\n🎉 Naya (Behtar) dataset tayyar hai!")