import hashlib

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password using SHA256"""
    return get_password_hash(plain_password) == hashed_password

def get_password_hash(password: str) -> str:
    """Hash password using SHA256"""
    return hashlib.sha256(password.encode()).hexdigest() 