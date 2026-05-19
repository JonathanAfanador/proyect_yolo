from fastapi import APIRouter, HTTPException
from app.models.schemas import LoginRequest, RegisterRequest, TokenResponse
from app.core.database import get_db
from app.core.security import create_access_token

router = APIRouter(prefix="/api/v1/auth", tags=["Auth"])

@router.post("/register")
async def register(req: RegisterRequest):
    try:
        db = get_db()
        res = db.auth.sign_up({
            "email": req.email,
            "password": req.password,
            "options": {"data": {"full_name": req.full_name}},
        })
        return {"message": "Registro exitoso. Revisa tu email.", "user_id": res.user.id}
    except Exception as e:
        raise HTTPException(400, detail=str(e))

@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest):
    try:
        db = get_db()
        res = db.auth.sign_in_with_password({"email": req.email, "password": req.password})
        token = create_access_token({"sub": res.user.id, "email": req.email})
        return TokenResponse(access_token=token, user_id=res.user.id, email=req.email)
    except Exception:
        raise HTTPException(401, detail="Credenciales invalidas")
