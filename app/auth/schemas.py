"""API-facing user shapes. Kept separate from the ORM model on purpose."""

import uuid

from fastapi_users import schemas
from pydantic import BaseModel, Field


class UserRead(schemas.BaseUser[uuid.UUID]):
    pass


class UserCreate(schemas.BaseUserCreate):
    pass


class UserUpdate(schemas.BaseUserUpdate):
    # Required by UserManager.update when email or password changes, so a
    # stolen session alone cannot take over the account. Never stored.
    current_password: str | None = Field(default=None, max_length=1024)

    def create_update_dict(self):
        update = super().create_update_dict()
        update.pop("current_password", None)
        return update

    def create_update_dict_superuser(self):
        update = super().create_update_dict_superuser()
        update.pop("current_password", None)
        return update


class AccountDelete(BaseModel):
    password: str = Field(max_length=1024)
