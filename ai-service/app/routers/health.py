# app/routers/health.py
from fastapi import APIRouter
import platform, sys
from app.services.face_recognition_service import face_service

router = APIRouter()

@router.get("")
async def health_check():
    return {
        "status": "ok",
        "service": "SmartAttend AI Face Recognition",
        "python": sys.version,
        "platform": platform.system(),
        "enrolled_students": face_service.enrolled_count(),
    }
