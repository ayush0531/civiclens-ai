import os
import uuid
from pathlib import Path
from fastapi import UploadFile, HTTPException, status
from PIL import Image
from backend.app.config import settings

def save_upload_image(file: UploadFile) -> str:
    """
    Validates and stores an uploaded image file securely on disk.
    Returns relative URL path (/uploads/filename.ext).
    """
    if not file.content_type or file.content_type not in settings.ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type: {file.content_type}. Only JPEG, PNG, and WebP are allowed."
        )

    # Validate file extension
    ext = Path(file.filename or "").suffix.lower()
    if ext not in [".jpg", ".jpeg", ".png", ".webp"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image extension. Only .jpg, .jpeg, .png, and .webp are accepted."
        )

    # Read contents and verify file size
    contents = file.file.read()
    if len(contents) > settings.MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Image size exceeds maximum limit of {settings.MAX_UPLOAD_SIZE_BYTES // (1024*1024)}MB."
        )

    # Secure random filename
    unique_filename = f"{uuid.uuid4().hex}{ext}"
    destination_path = os.path.join(settings.UPLOAD_DIR, unique_filename)

    # Verify image integrity via Pillow
    try:
        from io import BytesIO
        with Image.open(BytesIO(contents)) as test_img:
            test_img.verify()
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file is not a valid or readable image."
        )

    # Write file to storage
    with open(destination_path, "wb") as f:
        f.write(contents)

    return f"/uploads/{unique_filename}"
