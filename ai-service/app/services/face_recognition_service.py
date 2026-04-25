import face_recognition
import numpy as np
from PIL import Image
import io
import json
import os
import logging
from typing import Optional

logger = logging.getLogger(__name__)

ENCODINGS_DIR = os.getenv("ENCODINGS_DIR", "./data/face_encodings")
os.makedirs(ENCODINGS_DIR, exist_ok=True)


class FaceRecognitionService:
    """
    Manages face encodings and performs recognition.
    Encodings are stored as JSON files: {student_id}.json
    """

    def __init__(self, tolerance: float = 0.55):
        self.tolerance = tolerance
        self.known_encodings: dict[str, list] = {}
        self._load_all_encodings()

    def _encoding_path(self, student_id: str) -> str:
        return os.path.join(ENCODINGS_DIR, f"{student_id}.json")

    def _load_all_encodings(self):
        """Load all stored face encodings into memory."""
        self.known_encodings = {}
        if not os.path.exists(ENCODINGS_DIR):
            return
        for fname in os.listdir(ENCODINGS_DIR):
            if fname.endswith(".json"):
                student_id = fname[:-5]
                path = os.path.join(ENCODINGS_DIR, fname)
                try:
                    with open(path) as f:
                        data = json.load(f)
                    self.known_encodings[student_id] = [np.array(e) for e in data["encodings"]]
                except Exception as e:
                    logger.warning(f"Failed to load encoding {fname}: {e}")

    def enroll_student(self, student_id: str, image_bytes: bytes) -> dict:
        """
        Enroll a student by extracting face encoding from an image.
        Can be called multiple times to add more encodings (improves accuracy).
        """
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img_array = np.array(img)

        locations = face_recognition.face_locations(img_array, model="hog")
        if not locations:
            return {"success": False, "error": "No face detected in image"}
        if len(locations) > 1:
            return {"success": False, "error": "Multiple faces detected — use a close-up photo"}

        encoding = face_recognition.face_encodings(img_array, locations)[0]

        # Load existing encodings for this student
        existing = []
        path = self._encoding_path(student_id)
        if os.path.exists(path):
            with open(path) as f:
                existing = json.load(f)["encodings"]

        existing.append(encoding.tolist())

        # Keep up to 5 encodings per student for better accuracy
        if len(existing) > 5:
            existing = existing[-5:]

        with open(path, "w") as f:
            json.dump({"student_id": student_id, "encodings": existing}, f)

        self.known_encodings[student_id] = [np.array(e) for e in existing]

        return {
            "success": True,
            "student_id": student_id,
            "encodings_count": len(existing),
            "message": f"Student enrolled with {len(existing)} face sample(s)",
        }

    def recognize_faces(self, image_bytes: bytes, class_students: list[dict]) -> dict:
        """
        Recognize faces in a class photo.

        Args:
            image_bytes: Raw image data
            class_students: List of {student_id, name, roll_number}

        Returns:
            Dict with recognized and unrecognized students
        """
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img_array = np.array(img)

        # Detect faces
        face_locations = face_recognition.face_locations(img_array, model="hog")
        if not face_locations:
            return {
                "faces_detected": 0,
                "results": [
                    {**s, "status": "ABSENT", "recognized": False, "confidence": None}
                    for s in class_students
                ],
                "error": None,
            }

        face_encs = face_recognition.face_encodings(img_array, face_locations)

        # Build lookup: student_id -> encodings (only enrolled students in this class)
        enrolled_ids = [s["student_id"] for s in class_students if s["student_id"] in self.known_encodings]

        results = []
        recognized_ids = set()
        confidences = {}  # Store confidence for each recognized student

        # For each detected face, find the best matching student
        for enc in face_encs:
            best_match_id = None
            best_distance = 1.0

            for sid in enrolled_ids:
                if sid in recognized_ids:
                    continue  # Skip already matched students
                distances = face_recognition.face_distance(self.known_encodings[sid], enc)
                min_dist = float(np.min(distances))
                if min_dist < best_distance and min_dist < self.tolerance:
                    best_distance = min_dist
                    best_match_id = sid

            if best_match_id:
                recognized_ids.add(best_match_id)
                confidences[best_match_id] = 1 - best_distance  # Confidence = 1 - distance

        # Build result for each student in the class
        student_map = {s["student_id"]: s for s in class_students}
        for sid, student in student_map.items():
            if sid in recognized_ids:
                conf = confidences.get(sid, 0.0)
                results.append({
                    **student,
                    "status": "PRESENT",
                    "recognized": True,
                    "confidence": round(min(conf, 0.99), 4),
                })
            else:
                results.append({
                    **student,
                    "status": "ABSENT",
                    "recognized": False,
                    "confidence": None,
                })

        return {
            "faces_detected": len(face_locations),
            "faces_recognized": len(recognized_ids),
            "results": results,
            "error": None,
        }

    def delete_student(self, student_id: str) -> bool:
        path = self._encoding_path(student_id)
        if os.path.exists(path):
            os.remove(path)
        self.known_encodings.pop(student_id, None)
        return True

    def enrolled_count(self) -> int:
        return len(self.known_encodings)


# Singleton instance
face_service = FaceRecognitionService()
