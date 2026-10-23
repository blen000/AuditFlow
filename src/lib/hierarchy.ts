type NodeLike = { id: string; number: string; level: number; parentId?: string | null };

/**
 * Next free Ref No. for a new child of `parent` (or a new Level 1 mission when
 * `parent` is null): "3" after missions 1 and 2, "2.4" after sub-levels 2.1-2.3.
 * Skips numbers already used anywhere, since Ref No. must be unique.
 */
export function suggestNextNumber(nodes: NodeLike[], parent: NodeLike | null): string {
  const parentId = parent?.id ?? null;
  const prefix = parent ? `${parent.number}.` : '';
  const taken = new Set(nodes.map((n) => n.number));

  let max = 0;
  for (const sibling of nodes) {
    if ((sibling.parentId ?? null) !== parentId) continue;
    const tail = prefix && sibling.number.startsWith(prefix) ? sibling.number.slice(prefix.length) : sibling.number;
    const n = parseInt(tail, 10);
    if (!isNaN(n) && n > max) max = n;
  }

  let next = max + 1;
  while (taken.has(`${prefix}${next}`)) next++;
  return `${prefix}${next}`;
}

/**
 * Titles from a pasted list: one per line, blank lines dropped, bullets and outline
 * numbering ("1.", "2)", "3.1") stripped. A bare leading number ("2026 Budget") is kept.
 */
export function parseTitleList(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*(?:[-*•]|\d+\.\d+(?:\.\d+)*[.)]?|\d+[.)])\s+/, '').trim())
    .filter(Boolean);
}

type TreeNode = { id: string; number: string; parentId?: string | null };

const byNumber = (a: TreeNode, b: TreeNode) => a.number.localeCompare(b.number, undefined, { numeric: true, sensitivity: 'base' });

/**
 * Orders nodes as a tree: each level's sub-levels directly under it (1, 1.1, 1.2, 2, 2.1 ...),
 * siblings by Ref No. Nodes whose parent is missing are treated as top-level so none are lost.
 * With `keep`, only those nodes plus their ancestors are returned (for search results).
 */
export function orderHierarchyAsTree<T extends TreeNode>(nodes: T[], keep?: Set<string>): T[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  let visible = nodes;
  if (keep) {
    const ids = new Set<string>();
    for (const id of keep) {
      let cur = byId.get(id);
      const seen = new Set<string>();
      while (cur && !seen.has(cur.id)) {
        seen.add(cur.id);
        ids.add(cur.id);
        cur = cur.parentId ? byId.get(cur.parentId) : undefined;
      }
    }
    visible = nodes.filter((n) => ids.has(n.id));
  }

  const visibleIds = new Set(visible.map((n) => n.id));
  const children = new Map<string | null, T[]>();
  for (const n of visible) {
    const key = n.parentId && visibleIds.has(n.parentId) ? n.parentId : null;
    (children.get(key) ?? children.set(key, []).get(key)!).push(n);
  }

  const out: T[] = [];
  const walk = (key: string | null, trail: Set<string>) => {
    for (const n of (children.get(key) ?? []).sort(byNumber)) {
      if (trail.has(n.id)) continue; // guard against a cyclic parent chain
      out.push(n);
      walk(n.id, new Set(trail).add(n.id));
    }
  };
  walk(null, new Set());
  return out;
}
