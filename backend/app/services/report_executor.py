import re
import time
from datetime import date, datetime, timezone
from typing import Any
from uuid import UUID

from app.models.datasource import Datasource
from app.models.report import Report
from app.schemas.report import ColumnDef, ReportDataOut
from app.services.datasource_manager import datasource_manager


# PostgreSQL OID → наш тип столбца
PG_TYPE_MAP = {
    # numeric
    "int2": "number", "int4": "number", "int8": "number",
    "float4": "number", "float8": "number",
    "numeric": "number", "money": "number",
    # boolean
    "bool": "boolean",
    # date/time
    "date": "date",
    "timestamp": "datetime", "timestamptz": "datetime",
    "time": "string", "timetz": "string",
    # text
    "text": "string", "varchar": "string", "char": "string", "bpchar": "string",
    "name": "string", "uuid": "string", "json": "string", "jsonb": "string",
}


class ReportExecutor:

    @staticmethod
    def _pg_oid_to_type(oid: int, type_name: str) -> str:
        """Map PostgreSQL type to our column type."""
        return PG_TYPE_MAP.get(type_name, "string")

    @staticmethod
    def _prepare_sql(sql: str, params: dict[str, Any], limit: int | None = None) -> tuple[str, list]:
        """Replace :name placeholders with $1, $2... and build ordered params list."""
        used_names: list[str] = []

        def replacer(match):
            name = match.group(1)
            if name not in used_names:
                used_names.append(name)
            idx = used_names.index(name) + 1
            return f"${idx}"

        prepared_sql = re.sub(r":(\w+)", replacer, sql)

        if limit is not None:
            prepared_sql = f"SELECT * FROM ({prepared_sql}) _limited LIMIT {int(limit)}"

        ordered_params = []
        for name in used_names:
            val = params.get(name)
            if isinstance(val, date) and not isinstance(val, datetime):
                val = datetime(val.year, val.month, val.day)
            ordered_params.append(val)

        return prepared_sql, ordered_params

    @staticmethod
    def _build_columns(config: dict) -> list[ColumnDef]:
        raw = config.get("columns", [])
        return [ColumnDef(key=c["key"], label=c["label"], type=c.get("type", "string")) for c in raw]

    @staticmethod
    def _rows_to_dicts(records, columns: list[ColumnDef]) -> list[dict[str, Any]]:
        keys = [c.key for c in columns]
        result = []
        for row in records:
            row_dict = {}
            for i, key in enumerate(keys):
                val = row[i] if i < len(row) else None
                if isinstance(val, (date, datetime)):
                    val = val.isoformat()
                row_dict[key] = val
            result.append(row_dict)
        return result

    async def execute(
        self,
        report: Report,
        datasource: Datasource,
        params: dict[str, Any],
        test_mode: bool = False,
    ) -> ReportDataOut:
        config = report.config or {}
        max_range = config.get("max_range_days", 90)

        date_from = params.get("date_from")
        date_to = params.get("date_to")
        if date_from and date_to and (date_to - date_from).days > max_range:
            raise ValueError(f"Date range exceeds maximum of {max_range} days")
        if date_from and date_to and date_from > date_to:
            raise ValueError("date_from must be <= date_to")

        # Merge explicit filters into params
        filters = params.pop("extra_filters", {})
        all_params = {**params, **filters}

        limit = 10 if test_mode else None
        sql, ordered = self._prepare_sql(report.sql_query, all_params, limit=limit)

        columns = self._build_columns(config)

        start = time.monotonic()
        async with datasource_manager.connection(datasource) as conn:
            records = await conn.fetch(sql, *ordered)
        elapsed = int((time.monotonic() - start) * 1000)

        data = self._rows_to_dicts(records, columns)

        meta = {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "execution_time_ms": elapsed,
            "total_rows": len(data),
            "filters_applied": {k: v.isoformat() if isinstance(v, date) else v for k, v in all_params.items()},
        }
        if test_mode:
            meta["test_mode"] = True

        return ReportDataOut(
            report_id=report.id,
            slug=report.slug,
            title=report.name,
            type=report.type,
            columns=columns,
            data=data,
            meta=meta,
        )


    async def analyze_sql(
        self,
        datasource: Datasource,
        sql_query: str,
        params: dict[str, Any] | None = None,
    ) -> list[ColumnDef]:
        """Execute SQL with LIMIT 0, inspect result columns, return auto-generated ColumnDefs."""
        params = params or {}
        prepared_sql, ordered = self._prepare_sql(sql_query, params, limit=0)

        async with datasource_manager.connection(datasource) as conn:
            stmt = await conn.prepare(prepared_sql)
            attributes = stmt.get_attributes()

        columns = []
        for attr in attributes:
            col_type = self._pg_oid_to_type(attr.type.oid, attr.type.name)
            label = attr.name.replace("_", " ").title()
            columns.append(ColumnDef(key=attr.name, label=label, type=col_type))

        return columns


report_executor = ReportExecutor()
