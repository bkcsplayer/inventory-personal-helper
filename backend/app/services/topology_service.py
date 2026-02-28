from uuid import UUID

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


class TopologyService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_topology(self, item_id: UUID) -> list[dict]:
        query = text("""
            WITH RECURSIVE topology AS (
                SELECT id, name, category, status, parent_item_id,
                       item_type, quantity, unit, attributes, 0 AS depth
                FROM items WHERE id = :item_id
                UNION ALL
                SELECT i.id, i.name, i.category, i.status, i.parent_item_id,
                       i.item_type, i.quantity, i.unit, i.attributes, t.depth + 1
                FROM items i
                JOIN topology t ON i.parent_item_id = t.id
                WHERE t.depth < 20
            )
            SELECT * FROM topology ORDER BY depth, name;
        """)
        result = await self.db.execute(query, {"item_id": str(item_id)})
        rows = result.mappings().all()
        return [dict(row) for row in rows]

    async def get_topology_tree(self, item_id: UUID) -> dict | None:
        flat = await self.get_topology(item_id)
        if not flat:
            return None

        nodes = {}
        for row in flat:
            rid = str(row["id"])
            nodes[rid] = {
                "id": rid,
                "name": row["name"],
                "category": row["category"],
                "status": row["status"],
                "item_type": row["item_type"],
                "quantity": float(row["quantity"]),
                "unit": row["unit"],
                "attributes": row["attributes"] or {},
                "depth": row["depth"],
                "children": [],
            }

        root = None
        for row in flat:
            rid = str(row["id"])
            pid = str(row["parent_item_id"]) if row["parent_item_id"] else None
            if pid and pid in nodes:
                nodes[pid]["children"].append(nodes[rid])
            if row["depth"] == 0:
                root = nodes[rid]

        return root
