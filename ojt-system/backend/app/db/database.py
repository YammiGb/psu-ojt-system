from supabase import create_client, Client
from app.core.config import settings

_client: Client = None

def get_supabase_client() -> Client:
    global _client
    if _client is None:
        _client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    return _client

async def get_supabase() -> Client:
    return get_supabase_client()
