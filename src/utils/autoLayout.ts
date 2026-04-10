import dagre from '@dagrejs/dagre';
import type { Node, Edge } from '@xyflow/react';

const NODE_WIDTH = 280;
const NODE_BASE_HEIGHT = 50;
const FIELD_HEIGHT = 36;
const GAP_X = 60;
const GAP_Y = 60;

function getNodeHeight(node: Node): number {
  const fieldCount = (node.data as { fields?: unknown[] })?.fields?.length ?? 3;
  return NODE_BASE_HEIGHT + fieldCount * FIELD_HEIGHT;
}

/**
 * Find connected components among nodes using edges.
 * Returns groups of node IDs.
 */
function findConnectedComponents(nodeIds: string[], edges: Edge[]): string[][] {
  const parent = new Map<string, string>();
  nodeIds.forEach((id) => parent.set(id, id));

  function find(a: string): string {
    while (parent.get(a) !== a) {
      parent.set(a, parent.get(parent.get(a)!)!);
      a = parent.get(a)!;
    }
    return a;
  }
  function union(a: string, b: string) {
    parent.set(find(a), find(b));
  }

  edges.forEach((e) => {
    if (parent.has(e.source) && parent.has(e.target)) {
      union(e.source, e.target);
    }
  });

  const groups = new Map<string, string[]>();
  nodeIds.forEach((id) => {
    const root = find(id);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root)!.push(id);
  });

  return Array.from(groups.values());
}

/**
 * Layout a connected subgraph using dagre.
 * Returns positioned nodes and the bounding box size.
 */
function layoutSubgraph(
  nodes: Node[],
  edges: Edge[]
): { nodes: Node[]; width: number; height: number } {
  if (nodes.length === 1) {
    const h = getNodeHeight(nodes[0]);
    return {
      nodes: [{ ...nodes[0], position: { x: 0, y: 0 } }],
      width: NODE_WIDTH,
      height: h,
    };
  }

  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'LR', nodesep: 80, ranksep: 160, marginx: 0, marginy: 0 });

  const nodeSet = new Set(nodes.map((n) => n.id));

  nodes.forEach((node) => {
    g.setNode(node.id, { width: NODE_WIDTH, height: getNodeHeight(node) });
  });

  edges.forEach((edge) => {
    if (nodeSet.has(edge.source) && nodeSet.has(edge.target)) {
      g.setEdge(edge.source, edge.target);
    }
  });

  dagre.layout(g);

  let maxX = 0;
  let maxY = 0;

  const positioned = nodes.map((node) => {
    const pos = g.node(node.id);
    const x = pos.x - NODE_WIDTH / 2;
    const y = pos.y - (pos.height ?? 150) / 2;
    maxX = Math.max(maxX, x + NODE_WIDTH);
    maxY = Math.max(maxY, y + (pos.height ?? 150));
    return { ...node, position: { x, y } };
  });

  return { nodes: positioned, width: maxX, height: maxY };
}

export function autoLayout(nodes: Node[], edges: Edge[] = []): Node[] {
  if (nodes.length === 0) return [];

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const components = findConnectedComponents(
    nodes.map((n) => n.id),
    edges
  );

  // Layout each connected component independently
  const blocks: { nodes: Node[]; width: number; height: number }[] = [];
  for (const group of components) {
    const groupNodes = group.map((id) => nodeMap.get(id)!);
    const groupEdges = edges.filter(
      (e) => group.includes(e.source) && group.includes(e.target)
    );
    blocks.push(layoutSubgraph(groupNodes, groupEdges));
  }

  // Arrange blocks in a grid
  const cols = Math.ceil(Math.sqrt(blocks.length));
  const result: Node[] = [];
  let offsetX = 0;
  let offsetY = 0;
  let rowMaxHeight = 0;

  for (let i = 0; i < blocks.length; i++) {
    const col = i % cols;
    if (col === 0 && i > 0) {
      offsetY += rowMaxHeight + GAP_Y;
      offsetX = 0;
      rowMaxHeight = 0;
    }

    const block = blocks[i];
    for (const node of block.nodes) {
      result.push({
        ...node,
        position: {
          x: node.position.x + offsetX,
          y: node.position.y + offsetY,
        },
      });
    }

    offsetX += block.width + GAP_X;
    rowMaxHeight = Math.max(rowMaxHeight, block.height);
  }

  return result;
}
