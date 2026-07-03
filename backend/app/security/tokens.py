import secrets

def public_token() -> str:
    return secrets.token_urlsafe(32)

def csrf_token() -> str:
    return secrets.token_urlsafe(32)