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
