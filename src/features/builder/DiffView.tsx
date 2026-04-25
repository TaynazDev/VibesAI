import { useMemo } from "react";

// ── Minimal LCS-based line diff ───────────────────────────────────────────
type DiffOp = { type: "equal" | "add" | "remove"; line: string };

function diffLines(oldText: string, newText: string): DiffOp[] {
  const a = oldText.split("\n");
  const b = newText.split("\n");

  // Build LCS table (capped to avoid freeze on huge files)
  const maxLines = 800;
  const A = a.slice(0, maxLines);
  const B = b.slice(0, maxLines);
  const m = A.length;
  const n = B.length;

  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      if (A[i] === B[j]) {
        dp[i][j] = 1 + dp[i + 1][j + 1];
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  const ops: DiffOp[] = [];
  let i = 0;
  let j = 0;
  while (i < m && j < n) {
    if (A[i] === B[j]) {
      ops.push({ type: "equal", line: A[i] });
      i++; j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      ops.push({ type: "remove", line: A[i] });
      i++;
    } else {
      ops.push({ type: "add", line: B[j] });
      j++;
    }
  }
  while (i < m) { ops.push({ type: "remove", line: A[i++] }); }
  while (j < n) { ops.push({ type: "add", line: B[j++] }); }

  // If truncated, append the overflow as-is
  if (a.length > maxLines) {
    a.slice(maxLines).forEach((l) => ops.push({ type: "equal", line: l }));
  }

  return ops;
}

// ── Collapse unchanged context ────────────────────────────────────────────
const CONTEXT = 4; // lines of context around each change

interface DiffViewProps {
  oldCode: string;
  newCode: string;
}

export function DiffView({ oldCode, newCode }: DiffViewProps) {
  const ops = useMemo(() => diffLines(oldCode, newCode), [oldCode, newCode]);

  // Determine which indices are "interesting" (changed ± CONTEXT)
  const changed = new Set<number>();
  ops.forEach((op, idx) => {
    if (op.type !== "equal") {
      for (let k = Math.max(0, idx - CONTEXT); k <= Math.min(ops.length - 1, idx + CONTEXT); k++) {
        changed.add(k);
      }
    }
  });

  const additions = ops.filter((o) => o.type === "add").length;
  const deletions = ops.filter((o) => o.type === "remove").length;

  if (additions === 0 && deletions === 0) {
    return (
      <div className="diff-empty">
        <span>No changes in this version</span>
      </div>
    );
  }

  const rows: JSX.Element[] = [];
  let lineOld = 1;
  let lineNew = 1;
  let skipping = false;

  ops.forEach((op, idx) => {
    const isVisible = changed.has(idx);

    if (!isVisible) {
      if (!skipping) {
        skipping = true;
        rows.push(
          <div key={`skip-${idx}`} className="diff-skip">
            ⋯ unchanged
          </div>,
        );
      }
      if (op.type !== "add") lineOld++;
      if (op.type !== "remove") lineNew++;
      return;
    }

    skipping = false;

    const oldNum = op.type !== "add" ? lineOld : undefined;
    const newNum = op.type !== "remove" ? lineNew : undefined;

    rows.push(
      <div key={idx} className={`diff-row diff-row--${op.type}`}>
        <span className="diff-gutter diff-gutter-old">{oldNum ?? ""}</span>
        <span className="diff-gutter diff-gutter-new">{newNum ?? ""}</span>
        <span className="diff-sigil">
          {op.type === "add" ? "+" : op.type === "remove" ? "−" : " "}
        </span>
        <span className="diff-line-content">{op.line || "\u00a0"}</span>
      </div>,
    );

    if (op.type !== "add") lineOld++;
    if (op.type !== "remove") lineNew++;
  });

  return (
    <div className="diff-view">
      <div className="diff-stat">
        <span className="diff-stat-add">+{additions}</span>
        <span className="diff-stat-remove">−{deletions}</span>
        <span className="diff-stat-label">lines changed</span>
      </div>
      <div className="diff-body">{rows}</div>
    </div>
  );
}
