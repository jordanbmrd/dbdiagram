import type { Node, Edge } from '@xyflow/react';
import type { TableNodeData, RelationshipEdgeData } from '@/store/diagramStore';

function escapeDefault(val: string): string {
  if (val.startsWith('`') || val.startsWith("'") || val.startsWith('"')) return val;
  return `'${val}'`;
}

export function flowToDbml(
  nodes: Node<TableNodeData>[],
  edges: Edge<RelationshipEdgeData>[]
): string {
  const lines: string[] = [];

  for (const node of nodes) {
    const { tableName, fields } = node.data;
    lines.push(`Table ${tableName} {`);

    for (const field of fields) {
      const attrs: string[] = [];
      if (field.pk) attrs.push('pk');
      if (field.increment) attrs.push('increment');
      if (field.unique) attrs.push('unique');
      if (field.notNull) attrs.push('not null');
      if (field.defaultValue) attrs.push(`default: ${escapeDefault(field.defaultValue)}`);

      const attrStr = attrs.length > 0 ? ` [${attrs.join(', ')}]` : '';
      lines.push(`  ${field.name} ${field.type}${attrStr}`);
    }

    lines.push('}');
    lines.push('');
  }

  for (const edge of edges) {
    const data = edge.data;
    if (!data) continue;

    const sourceTable = nodes.find((n) => n.id === edge.source)?.data.tableName ?? edge.source;
    const targetTable = nodes.find((n) => n.id === edge.target)?.data.tableName ?? edge.target;

    let relSymbol = '-';
    if (data.fromCardinality === 'N' && data.toCardinality === '1') {
      relSymbol = '>';
    } else if (data.fromCardinality === '1' && data.toCardinality === 'N') {
      relSymbol = '<';
    } else if (data.fromCardinality === 'N' && data.toCardinality === 'N') {
      relSymbol = '<>';
    }

    lines.push(`Ref: ${sourceTable}.${data.fromField} ${relSymbol} ${targetTable}.${data.toField}`);
  }

  lines.push('');
  return lines.join('\n');
}
