import { useEffect, useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import api from "@/services/api";
import { Badge } from "@/components/ui/badge";

export interface TopologyNode {
  id: string;
  name: string;
  category: string;
  status: string;
  item_type: string;
  quantity: number;
  unit: string;
  attributes: Record<string, unknown>;
  children: TopologyNode[];
}

export interface TopologyTreeProps {
  itemId: string;
}

export function TopologyTree({ itemId }: TopologyTreeProps) {
  const [node, setNode] = useState<TopologyNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!itemId) {
      setLoading(false);
      setError("Invalid item ID");
      return;
    }
    api
      .get<TopologyNode>(`/topology/${itemId}`)
      .then((res) => {
        setNode(res.data);
        setError(null);
        if (res.data?.children?.length) {
          setExpanded(new Set([res.data.id]));
        }
      })
      .catch(() => {
        setError("Item not found");
        setNode(null);
      })
      .finally(() => setLoading(false));
  }, [itemId]);

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  if (loading) {
    return (
      <div className="py-4 text-sm text-muted-foreground">Loading...</div>
    );
  }

  if (error || !node) {
    return (
      <div className="py-4 text-sm text-destructive">{error ?? "Not found"}</div>
    );
  }

  return (
    <div className="rounded-lg border p-4">
      <TreeNode
        node={node}
        depth={0}
        expanded={expanded}
        onToggle={toggle}
      />
    </div>
  );
}

function TreeNode({
  node,
  depth,
  expanded,
  onToggle,
}: {
  node: TopologyNode;
  depth: number;
  expanded: Set<string>;
  onToggle: (id: string) => void;
}) {
  const hasChildren = node.children?.length > 0;
  const isExpanded = expanded.has(node.id);

  return (
    <div className="select-none">
      <div
        className="flex cursor-pointer items-center gap-2 rounded-md py-2 px-2 hover:bg-muted/50"
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
        onClick={() => hasChildren && onToggle(node.id)}
      >
        <span className="flex w-5 shrink-0 items-center justify-center">
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )
          ) : (
            <span className="w-4" />
          )}
        </span>
        <span className="font-medium">{node.name}</span>
        {node.category && (
          <Badge variant="secondary" className="text-xs">
            {node.category}
          </Badge>
        )}
        {node.status && (
          <Badge variant="outline" className="text-xs">
            {node.status}
          </Badge>
        )}
      </div>
      {hasChildren && isExpanded && (
        <div className="border-l border-muted pl-2">
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}
