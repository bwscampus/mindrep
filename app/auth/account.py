"""Self-service account deletion: DELETE /api/users/me.

fastapi-users ships DELETE /users/{id}, but only for superusers. Athletes
(and, for under-13s, their parents) must be able to delete an account and its
data themselves — COPPA and GDPR both expect it (Production Standard AUTH-6).

The password is required so a borrowed, still-signed-in device can't be used
to wipe someone's account. Rows in user_state and access_tokens go with the
user through ON DELETE CASCADE.
"""

from fastapi import APIRouter, Depends, HTTPException, Response, status

from app.auth.backend import cookie_transport
from app.auth.models import User
from app.auth.router import current_active_user
from app.auth.schemas import AccountDelete
from app.auth.users import UserManager, get_user_manager

router = APIRouter()


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_me(
    payload: AccountDelete,
    user: User = Depends(current_active_user),
    user_manager: UserManager = Depends(get_user_manager),
) -> Response:
    if not user_manager.check_password(user, payload.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password is incorrect.",
        )
    await user_manager.delete(user)
    return await cookie_transport.get_logout_response()
