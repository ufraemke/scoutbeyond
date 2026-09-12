import os
import json
import sqlite3
from pathlib import Path
from typing import Dict, Any, Optional, List

# In-memory storage cache
MEMORY_SESSIONS: Dict[str, Dict[str, Any]] = {}
MEMORY_SOURCES: Dict[str, List[Dict[str, Any]]] = {}

DB_PATH = Path(__file__).resolve().parent / "scoutbeyond.db"


class StorageManager:
    """
    Manages session persistence.
    1. Persists locally in SQLite (scoutbeyond.db) so sessions survive server restarts.
    2. Automatically syncs with Supabase whenever credentials are configured in .env.
       Supports custom schemas (e.g. scoutai_ingest).
    """
    def __init__(self):
        self._init_sqlite()
        
        supabase_url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
        self.schema_name = os.getenv("SUPABASE_SCHEMA") or os.getenv("NEXT_PUBLIC_SUPABASE_SCHEMA")
        
        self.supabase = None
        if supabase_url and supabase_key:
            try:
                from supabase import create_client
                self.supabase = create_client(supabase_url.strip(), supabase_key.strip())
                print(f"[Storage] Successfully connected to Supabase ({self.schema_name or 'public'})!")
            except Exception as e:
                print(f"[Storage] Supabase connection error: {e}. Falling back to local SQLite store.")
        else:
            print(f"[Storage] Running with local SQLite database at {DB_PATH.name}.")

    def _table(self, table_name: str):
        if not self.supabase:
            return None
        if self.schema_name and self.schema_name != "public":
            return self.supabase.schema(self.schema_name).table(table_name)
        return self.supabase.table(table_name)

    def _init_sqlite(self):
        """Initializes local SQLite database tables."""
        try:
            with sqlite3.connect(DB_PATH) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS problems (
                        id TEXT PRIMARY KEY,
                        data TEXT,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """)
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS sources (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        session_id TEXT,
                        title TEXT,
                        url TEXT,
                        tier TEXT,
                        metrics TEXT,
                        snippet TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """)
                conn.commit()
        except Exception as e:
            print(f"[Storage] SQLite init error: {e}")

    def save_session(self, session_id: str, data: Dict[str, Any]):
        # 1. Update in-memory cache
        if session_id not in MEMORY_SESSIONS:
            MEMORY_SESSIONS[session_id] = {}
        MEMORY_SESSIONS[session_id].update(data)

        # 2. Persist to local SQLite
        try:
            with sqlite3.connect(DB_PATH) as conn:
                cursor = conn.cursor()
                cursor.execute(
                    "INSERT INTO problems (id, data, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) "
                    "ON CONFLICT(id) DO UPDATE SET data=excluded.data, updated_at=CURRENT_TIMESTAMP",
                    (session_id, json.dumps(MEMORY_SESSIONS[session_id]))
                )
                conn.commit()
        except Exception as e:
            print(f"[Storage] SQLite save error: {e}")

        # 3. Sync to Supabase if configured
        if self.supabase:
            try:
                table = self._table("problems")
                if table:
                    table.upsert({
                        "id": session_id,
                        "raw_input": data.get("input", ""),
                        "statement": data.get("brief", {}).get("problem", ""),
                        "data": data
                    }).execute()
            except Exception as e:
                print(f"[Storage] Supabase save error: {e}")

    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        # 1. Check in-memory cache
        if session_id in MEMORY_SESSIONS:
            return MEMORY_SESSIONS[session_id]

        # 2. Check local SQLite
        try:
            with sqlite3.connect(DB_PATH) as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT data FROM problems WHERE id = ?", (session_id,))
                row = cursor.fetchone()
                if row and row[0]:
                    session_data = json.loads(row[0])
                    MEMORY_SESSIONS[session_id] = session_data
                    return session_data
        except Exception as e:
            print(f"[Storage] SQLite get error: {e}")

        # 3. Check Supabase
        if self.supabase:
            try:
                table = self._table("problems")
                if table:
                    res = table.select("*").eq("id", session_id).execute()
                    if res.data:
                        session_data = res.data[0].get("data") or {}
                        MEMORY_SESSIONS[session_id] = session_data
                        return session_data
            except Exception as e:
                print(f"[Storage] Supabase get error: {e}")

        return None

    def save_sources(self, session_id: str, sources: List[Dict[str, Any]]):
        if not sources:
            return

        # 1. Update in-memory cache
        if session_id not in MEMORY_SOURCES:
            MEMORY_SOURCES[session_id] = []
        MEMORY_SOURCES[session_id].extend(sources)

        # 2. Persist to local SQLite
        try:
            with sqlite3.connect(DB_PATH) as conn:
                cursor = conn.cursor()
                for s in sources:
                    cursor.execute(
                        "INSERT INTO sources (session_id, title, url, tier, metrics, snippet) VALUES (?, ?, ?, ?, ?, ?)",
                        (session_id, s.get("title", ""), s.get("url", ""), s.get("tier", ""), s.get("metrics", ""), s.get("snippet", ""))
                    )
                conn.commit()
        except Exception as e:
            print(f"[Storage] SQLite insert sources error: {e}")

        # 3. Sync to Supabase
        if self.supabase:
            try:
                table = self._table("sources")
                if table:
                    rows = [{"session_id": session_id, **s} for s in sources]
                    table.insert(rows).execute()
            except Exception as e:
                print(f"[Storage] Supabase insert sources error: {e}")

    def get_sources(self, session_id: str) -> List[Dict[str, Any]]:
        if session_id in MEMORY_SOURCES and MEMORY_SOURCES[session_id]:
            return MEMORY_SOURCES[session_id]

        # Read from local SQLite
        try:
            with sqlite3.connect(DB_PATH) as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT title, url, tier, metrics, snippet FROM sources WHERE session_id = ?", (session_id,))
                rows = cursor.fetchall()
                if rows:
                    sources = [
                        {"title": r[0], "url": r[1], "tier": r[2], "metrics": r[3], "snippet": r[4]}
                        for r in rows
                    ]
                    MEMORY_SOURCES[session_id] = sources
                    return sources
        except Exception as e:
            print(f"[Storage] SQLite get sources error: {e}")

        # Check Supabase
        if self.supabase:
            try:
                table = self._table("sources")
                if table:
                    res = table.select("*").eq("session_id", session_id).execute()
                    if res.data:
                        MEMORY_SOURCES[session_id] = res.data
                        return res.data
            except Exception as e:
                print(f"[Storage] Supabase get sources error: {e}")

        return []
