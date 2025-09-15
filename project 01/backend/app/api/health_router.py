
from fastapi import APIRouter, HTTPException

router = APIRouter()

@router.get("/health")
async def health_check():
	try:
		return {"status": "ok", "detail": "Service is healthy"}
	except Exception as e:
		raise HTTPException(status_code=500, detail=str(e))
