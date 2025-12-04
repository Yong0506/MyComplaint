from flask import Flask, request, send_file, jsonify
from PIL import Image, ExifTags
import io
import cv2
import numpy as np

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import re

app = Flask(__name__)

# -----------------------------------------
# Face and License Plate Detection Setup
# -----------------------------------------

face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
plate_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_russian_plate_number.xml")

def correct_orientation(image):
    """Fix image orientation based on EXIF by physically rotating the PIL image."""
    try:
        exif = image.getexif() 
        
        if exif is None:
            return image

        orientation_tag = next((key for key, val in ExifTags.TAGS.items() if val == 'Orientation'), None)
        
        if orientation_tag is None:
            return image
        
        orientation_value = exif.get(orientation_tag, 1) 
        
        if orientation_value == 3:
            image = image.rotate(180, expand=True)
        elif orientation_value == 6:
            image = image.rotate(270, expand=True)
        elif orientation_value == 8:
            image = image.rotate(90, expand=True)
                
    except Exception as e:
        print(f"EXIF orientation correction error: {e}")
        pass
        
    return image

def blur_region(image, x, y, w, h, blur_strength=151):
    """Blur a rectangular region with boundary checks."""
    if blur_strength % 2 == 0:
        blur_strength += 1
        
    y_start = max(0, y)
    y_end = min(y + h, image.shape[0])
    x_start = max(0, x)
    x_end = min(x + w, image.shape[1])
    
    if y_end > y_start and x_end > x_start:
        roi = image[y_start:y_end, x_start:x_end]
        if roi.size > 0:
            blurred = cv2.GaussianBlur(roi, (blur_strength, blur_strength), 0)
            image[y_start:y_end, x_start:x_end] = blurred
            
    return image

@app.route("/blur", methods=['POST'])
def blur_image():
    file = request.files.get("image")
    if file is None:
        return jsonify({"error": "No image uploaded"}), 400

    image = Image.open(file.stream).convert("RGB")
    
    image = correct_orientation(image) 
    
    print(f"Image Size after Rotation: {image.size}")

    cv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
    detections_found = 0

    scale_factor = 0.75
    small_image = cv2.resize(cv_image, (0,0), fx=scale_factor, fy=scale_factor)
    gray = cv2.cvtColor(small_image, cv2.COLOR_BGR2GRAY)

    # face detection
    faces = face_cascade.detectMultiScale(
        gray, scaleFactor=1.1, minNeighbors=2, minSize=(20,20)
    )
    if len(faces) > 0:
        detections_found += len(faces)
        
    for (x, y, w, h) in faces:
        x, y, w, h = int(x/scale_factor), int(y/scale_factor), int(w/scale_factor), int(h/scale_factor)
        cv_image = blur_region(cv_image, x, y, w, h, blur_strength=151)

    # license plate detection
    plates = plate_cascade.detectMultiScale(
        gray, scaleFactor=1.1, minNeighbors=2, minSize=(20,20)
    )
    if len(plates) > 0:
        detections_found += len(plates)
        
    for (x, y, w, h) in plates:
        x, y, w, h = int(x/scale_factor), int(y/scale_factor), int(w/scale_factor), int(h/scale_factor)
        cv_image = blur_region(cv_image, x, y, w, h, blur_strength=151)
        
    if detections_found == 0:
        print("--- WARNING: No faces or plates detected. Returning unblurred image. ---")

    result_image = Image.fromarray(cv2.cvtColor(cv_image, cv2.COLOR_BGR2RGB))
    output = io.BytesIO()
    
    result_image.save(output, format="JPEG") 
    output.seek(0)

    return send_file(output, mimetype="image/jpeg")

# -----------------------------------------
# Face and License Plate Detection Setup
# -----------------------------------------



# -----------------------------------------
# AI Prediction Endpoint
# -----------------------------------------
agency_keywords = {
    "dept_dbkl": [
        "road", "jalan", "street light", "lampu jalan", "pothole", "park", "city", "drain"
    ],
    "dept_kdebwm": [
        "rubbish", "trash", "sampah", "garbage", "waste", "bin"
    ],
    "dept_rapidkl": [
        "bus", "lrt", "mrt", "train", "station", "transit", "public transport"
    ],
    "dept_works": [
        "highway", "bridge", "construction", "infrastructure", "federal road"
    ],
    "dept_pcb": [
        "complaint", "government service", "not sure", "general issue"
    ]
}

agency_names = list(agency_keywords.keys())
agency_corpus = [" ".join(words) for words in agency_keywords.values()]

vectorizer = TfidfVectorizer()
agency_vectors = vectorizer.fit_transform(agency_corpus)

def is_spam(text):
    spam_words = ["buy now", "free money", "loan", "promo", "click here"]
    count = sum(word in text for word in spam_words)
    return count >= 2

@app.route("/predict", methods=["POST"])
def predict():
    data = request.json
    message = data.get("description", "").lower()

    print("Received:", message)

    if not message.strip():
        return jsonify({"agency": "dept_pcb"})

    if is_spam(message):
        return jsonify({"agency": "dept_pcb"})

    for agency, words in agency_keywords.items():
        score = sum(message.count(w) for w in words)
        if score >= 2:
            return jsonify({"agency": agency})

    msg_vec = vectorizer.transform([message])
    sims = cosine_similarity(msg_vec, agency_vectors)[0]

    best_index = sims.argmax()
    best_agency = agency_names[best_index]

    return jsonify({"agency": best_agency})

# -----------------------------------------
# AI Prediction Endpoint
# -----------------------------------------

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)