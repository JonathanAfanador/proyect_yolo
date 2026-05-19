from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.database import get_db

security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> str:
    try:
        # El frontend envía un JWT nativo de Supabase Auth.
        # Lo validamos delegando la comprobación al servidor de Supabase:
        res = get_db().auth.get_user(credentials.credentials)
        if not res or not res.user:
            raise ValueError("No user found")
        return res.user.id
    except Exception as e:
        print(f"❌ [AUTH] Token rechazado por Supabase: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalido o expirado",
        )
