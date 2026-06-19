import time
import uuid
from contextlib import asynccontextmanager

import asyncpg

from app.models.datasource import Datasource


class DatasourceManager:
    """Manages connection pools to external datasources."""

    def __init__(self):
        self._pools: dict[uuid.UUID, asyncpg.Pool] = {}

    async def get_pool(self, ds: Datasource) -> asyncpg.Pool:
        if ds.id not in self._pools:
            self._pools[ds.id] = await asyncpg.create_pool(
                host=ds.host,
                port=ds.port,
                database=ds.database,
                user=ds.username,
                password=ds.password_encrypted,
                min_size=1,
                max_size=5,
                command_timeout=30,
            )
        return self._pools[ds.id]

    async def drop_pool(self, datasource_id: uuid.UUID):
        pool = self._pools.pop(datasource_id, None)
        if pool:
            await pool.close()

    @asynccontextmanager
    async def connection(self, ds: Datasource):
        pool = await self.get_pool(ds)
        async with pool.acquire() as conn:
            yield conn

    async def test_connection(self, ds: Datasource) -> tuple[bool, int, str | None]:
        """Returns (ok, response_time_ms, error_detail)."""
        start = time.monotonic()
        try:
            conn = await asyncpg.connect(
                host=ds.host,
                port=ds.port,
                database=ds.database,
                user=ds.username,
                password=ds.password_encrypted,
                timeout=10,
            )
            await conn.execute("SELECT 1")
            await conn.close()
            elapsed = int((time.monotonic() - start) * 1000)
            return True, elapsed, None
        except Exception as e:
            elapsed = int((time.monotonic() - start) * 1000)
            return False, elapsed, str(e)

    async def close_all(self):
        for pool in self._pools.values():
            await pool.close()
        self._pools.clear()


datasource_manager = DatasourceManager()
