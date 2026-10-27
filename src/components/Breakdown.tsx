import type { BreakdownNode } from '../cost';
import { money, percent, qty, type MoneyFormat } from '../format';
import { useI18n } from '../i18n';

interface Props {
  nodes: BreakdownNode[];
  total: number;
  fmt: MoneyFormat;
}

/** Nested view of where the money goes, down to the last gram of salt. */
export function Breakdown({ nodes, total, fmt }: Props) {
  return (
    <ul className="tree">
      {nodes.map((n) => (
        <Node key={n.key} node={n} total={total} fmt={fmt} />
      ))}
    </ul>
  );
}

function Node({ node, total, fmt }: { node: BreakdownNode; total: number; fmt: MoneyFormat }) {
  const { t, unit, error } = useI18n();
  const share = node.cost !== null && total > 0 ? (node.cost / total) * 100 : 0;
  const row = (
    <span className="tree-row">
      <span className="grow ellipsis">
        {node.name || t('deleted')}{' '}
        <span className="muted small">
          {qty(node.qty, fmt.locale)} {unit(node.unit)}
        </span>
      </span>
      {node.cost === null ? (
        <span className="warn small">{node.error && error(node.error)}</span>
      ) : (
        <>
          <span className="bar" aria-hidden>
            <span style={{ width: `${Math.min(100, share)}%` }} />
          </span>
          <span className="muted small pct">{percent(share, fmt.locale)}</span>
          <span className="money">{money(node.cost, fmt)}</span>
        </>
      )}
    </span>
  );
  if (!node.children.length) return <li className="leaf">{row}</li>;
  return (
    <li>
      <details>
        <summary>{row}</summary>
        <Breakdown nodes={node.children} total={total} fmt={fmt} />
      </details>
    </li>
  );
}
