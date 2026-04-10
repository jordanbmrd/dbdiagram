import type { Node, Edge } from '@xyflow/react';
import type { TableNodeData, RelationshipEdgeData, FieldData } from '@/store/diagramStore';
import { autoLayout } from './autoLayout';
import { Parser } from '@dbml/core';

// @dbml/core types are not great, so we'll use loose typing for the parsed output
interface DbmlField {
  name: string;
  type: { type_name: string };
  pk?: boolean;
  not_null?: boolean;
  unique?: boolean;
  increment?: boolean;
  dbdefault?: { value: string; type: string };
}

interface DbmlEndpoint {
  tableName: string;
  fieldNames: string[];
  relation: string;
}

interface DbmlRef {
  endpoints: DbmlEndpoint[];
}

interface DbmlTable {
  name: string;
  schema?: { name: string };
  fields: DbmlField[];
}

interface DbmlDatabase {
  schemas: Array<{
    tables: DbmlTable[];
    refs: DbmlRef[];
  }>;
}

function getCardinality(ep: DbmlEndpoint): string {
  switch (ep.relation) {
    case '1': return '1';
    case '*': return 'N';
    default: return '1';
  }
}

export function dbmlToFlow(
  code: string,
  existingNodes: Node<TableNodeData>[] = []
): { nodes: Node<TableNodeData>[]; edges: Edge<RelationshipEdgeData>[] } {
  const database: DbmlDatabase = Parser.parse(code, 'dbmlv2');

  const positionMap = new Map<string, { x: number; y: number }>();
  existingNodes.forEach((n) => {
    positionMap.set(n.id, n.position);
  });

  const nodes: Node<TableNodeData>[] = [];
  const edges: Edge<RelationshipEdgeData>[] = [];
  const allRefEndpoints: DbmlRef[] = [];

  // Collect all refs to determine FK fields
  const fkFields = new Set<string>();

  for (const schema of database.schemas) {
    for (const ref of schema.refs) {
      allRefEndpoints.push(ref);
      for (const ep of ref.endpoints) {
        if (ep.relation === '*') {
          ep.fieldNames.forEach((f) => fkFields.add(`${ep.tableName}.${f}`));
        }
      }
    }

    for (const table of schema.tables) {
      const tableId = table.name;
      const fields: FieldData[] = table.fields.map((f) => ({
        name: f.name,
        type: f.type.type_name,
        pk: f.pk || false,
        fk: fkFields.has(`${table.name}.${f.name}`),
        notNull: f.not_null || false,
        unique: f.unique || false,
        increment: f.increment || false,
        defaultValue: f.dbdefault?.value,
      }));

      nodes.push({
        id: tableId,
        type: 'tableNode',
        position: positionMap.get(tableId) ?? { x: 0, y: 0 },
        data: {
          tableName: table.name,
          fields,
          schemaName: table.schema?.name,
        },
      });
    }
  }

  // Create edges from refs
  for (const ref of allRefEndpoints) {
    if (ref.endpoints.length === 2) {
      const [ep1, ep2] = ref.endpoints;
      const edgeId = `${ep1.tableName}.${ep1.fieldNames[0]}-${ep2.tableName}.${ep2.fieldNames[0]}`;

      edges.push({
        id: edgeId,
        source: ep1.tableName,
        target: ep2.tableName,
        sourceHandle: `${ep1.fieldNames[0]}-right`,
        targetHandle: `${ep2.fieldNames[0]}-left`,
        type: 'relationshipEdge',
        data: {
          fromField: ep1.fieldNames[0],
          toField: ep2.fieldNames[0],
          fromCardinality: getCardinality(ep1),
          toCardinality: getCardinality(ep2),
        },
      });
    }
  }

  // Auto-layout if no existing positions
  const needsLayout = existingNodes.length === 0 || nodes.some((n) => n.position.x === 0 && n.position.y === 0 && !positionMap.has(n.id));
  const layoutNodes = needsLayout ? autoLayout(nodes, edges) as Node<TableNodeData>[] : nodes;

  return { nodes: layoutNodes, edges };
}
