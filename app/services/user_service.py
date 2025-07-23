from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.user import User as UserModel
from app.models.role import Role
from app.schemas.user import User as UserSchema, UserCreate
from app.core.security import get_password_hash

def user_to_schema(user: UserModel):
    return UserSchema(
        id=user.id,
        email=user.email,
        name=user.name,
        is_active=user.is_active,
        roles=[r.name for r in user.roles]
    )

def create_user(db: Session, user: UserCreate):
    db_user = db.query(UserModel).filter(UserModel.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email đã tồn tại")
    hashed_password = get_password_hash(user.password)
    db_user = UserModel(email=user.email, hashed_password=hashed_password, name=user.name)
    # Gán role qua bảng liên kết
    db_role = db.query(Role).filter(Role.name == user.role).first()
    if not db_role:
        raise HTTPException(status_code=400, detail="Role không tồn tại")
    db_user.roles.append(db_role)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return user_to_schema(db_user)

def update_user(db: Session, user_id: int, user: UserCreate):
    db_user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Không tìm thấy user")
    db_user.email = str(user.email)  # type: ignore
    db_user.hashed_password = get_password_hash(user.password)  # type: ignore
    db_user.name = user.name  # type: ignore
    # Không cập nhật role trực tiếp ở đây
    db.commit()
    db.refresh(db_user)
    return user_to_schema(db_user)

def delete_user(db: Session, user_id: int):
    db_user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Không tìm thấy user")
    db.delete(db_user)
    db.commit()
    return {"message": "Đã xóa user thành công"}

def get_user_by_email(db: Session, email: str):
    db_user = db.query(UserModel).filter(UserModel.email == email).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Không tìm thấy user")
    return user_to_schema(db_user)

def get_all_users(db: Session):
    users = db.query(UserModel).all()
    return [user_to_schema(u) for u in users]
