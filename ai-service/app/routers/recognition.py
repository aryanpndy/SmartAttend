from fastapi import APIRouter, File, UploadFile, HTTPException, Body
from pydantic import BaseModel
from typing import List, Optional
from app.services.face_recognition_service import face_service
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


class StudentInfo(BaseModel):
    student_id: str
    name: str
    roll_number: str


class RecognizeRequest(BaseModel):
    class_students: List[StudentInfo]


@router.post("")
async def recognize_faces(
    photo: UploadFile = File(..., description="Class photo"),
    class_students: str = Body(..., description="JSON array of {student_id, name, roll_number}"),
):
    """
    Recognize faces in a class photo and return attendance results.

    - Upload the class photo
    - Provide list of students who should be in the class
    - Returns recognized/unrecognized with confidence scores
    """
    import json

    if not photo.content_type.startswith("image/"):
        raise HTTPException(400, "File must be an image")

    try:
        students_data = json.loads(class_students)
    except Exception:
        raise HTTPException(400, "class_students must be valid JSON array")

    image_bytes = await photo.read()
    if len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(413, "Image too large — max 10MB")

    try:
        result = face_service.recognize_faces(image_bytes, students_data)
        return result
    except Exception as e:
        logger.error(f"Recognition error: {e}")
        raise HTTPException(500, f"Recognition failed: {str(e)}")


@router.get("/status")
async def recognition_status():
    """Returns info about enrolled students and service readiness."""
    return {
        "enrolled_students": face_service.enrolled_count(),
        "tolerance": face_service.tolerance,
        "ready": face_service.enrolled_count() > 0,
    }
