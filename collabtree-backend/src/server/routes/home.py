from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def home():
    return {"message": "Collab Tree is up and running"} 