from fastapi import APIRouter, File, UploadFile, HTTPException, Path
from app.services.face_recognition_service import face_service
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/{student_id}")
async def enroll_student(
    student_id: str = Path(..., description="Student UUID from database"),
    photo: UploadFile = File(..., description="Clear photo of student face"),
):
    """
    Enroll a student's face for AI attendance recognition.

    - Send a clear, well-lit photo of the student (solo)
    - Can call multiple times to improve accuracy (up to 5 samples)
    - Returns success/failure with enrollment count
    """
    if not photo.content_type.startswith("image/"):
        raise HTTPException(400, "File must be an image (jpg/png/webp)")

    image_bytes = await photo.read()
    if len(image_bytes) > 5 * 1024 * 1024:
        raise HTTPException(413, "Image too large — max 5MB")

    try:
        result = face_service.enroll_student(student_id, image_bytes)
        if not result["success"]:
            raise HTTPException(422, result["error"])
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Enrollment error for {student_id}: {e}")
        raise HTTPException(500, f"Enrollment failed: {str(e)}")


@router.delete("/{student_id}")
async def unenroll_student(student_id: str = Path(...)):
    """Remove a student's face data from the recognition system."""
    face_service.delete_student(student_id)
    return {"success": True, "message": f"Student {student_id} face data removed"}


@router.get("/list")
async def list_enrolled():
    """List all enrolled student IDs."""
    from app.services.face_recognition_service import ENCODINGS_DIR
    import os, json

    enrolled = []
    if os.path.exists(ENCODINGS_DIR):
        for fname in os.listdir(ENCODINGS_DIR):
            if fname.endswith(".json"):
                path = os.path.join(ENCODINGS_DIR, fname)
                try:
                    with open(path) as f:
                        data = json.load(f)
                    enrolled.append({
                        "student_id": data["student_id"],
                        "samples": len(data.get("encodings", [])),
                    })
                except Exception:
                    pass

    return {"enrolled": enrolled, "total": len(enrolled)}
