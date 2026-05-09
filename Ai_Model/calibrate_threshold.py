import os
from deepface import DeepFace

dataset_path = "CNIC_Custom_Dataset"
distances = []
total = 0

print("🔍 Calibrating ArcFace on Custom Dataset...")

for folder in os.listdir(dataset_path):
    f_path = os.path.join(dataset_path, folder)
    if os.path.isdir(f_path):
        img1 = os.path.join(f_path, "selfie.jpg")
        img2 = os.path.join(f_path, "cnic_photo.jpg")
        
        try:
            # ArcFace use kar rahe hain
            result = DeepFace.verify(img1, img2, model_name="ArcFace", enforce_detection=False)
            distances.append(result["distance"])
            total += 1
            print(f"👤 {folder} | Score: {result['distance']:.4f}")
        except: pass

if total > 0:
    avg = sum(distances) / total
    print("\n" + "="*30)
    print(f"💡 Average Distance: {avg:.4f}")
    print(f"🎯 Use this Threshold: {round(avg + 0.05, 2)}")
    print("="*30)