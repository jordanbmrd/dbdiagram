import { create } from 'zustand';
import type { Node, Edge } from '@xyflow/react';
import { DEFAULT_DBML } from '@/constants/defaultDbml';
import { dbmlToFlow } from '@/utils/dbmlToFlow';
import { flowToDbml } from '@/utils/flowToDbml';
import { autoLayout } from '@/utils/autoLayout';

const DBML_STORAGE_KEY = 'dbdiagram-dbml-code';

function getStoredDbml(): string {
  try {
    const stored = localStorage.getItem(DBML_STORAGE_KEY);
    return stored && stored.trim() ? stored : DEFAULT_DBML;
  } catch {
    return DEFAULT_DBML;
  }
}

function saveDbml(code: string) {
  try {
    localStorage.setItem(DBML_STORAGE_KEY, code);
  } catch {
    // quota exceeded or unavailable
  }
}

export interface FieldData {
  name: string;
  type: string;
  pk?: boolean;
  fk?: boolean;
  notNull?: boolean;
  unique?: boolean;
  increment?: boolean;
  defaultValue?: string;
}

export interface TableNodeData {
  tableName: string;
  fields: FieldData[];
  schemaName?: string;
  [key: string]: unknown;
}

export interface RelationshipEdgeData {
  fromField: string;
  toField: string;
  fromCardinality: string;
  toCardinality: string;
  [key: string]: unknown;
}

interface DiagramState {
  dbmlCode: string;
  nodes: Node<TableNodeData>[];
  edges: Edge<RelationshipEdgeData>[];
  parseError: string | null;
  diagramRef: HTMLDivElement | null;
  fitViewFn: (() => void) | null;

  setDbmlCode: (code: string) => void;
  setNodes: (nodes: Node<TableNodeData>[]) => void;
  setEdges: (edges: Edge<RelationshipEdgeData>[]) => void;
  syncFromDbml: (code: string, preservePositions?: boolean) => void;
  syncFromDiagram: () => void;
  setDiagramRef: (ref: HTMLDivElement | null) => void;
  updateTableName: (nodeId: string, newName: string) => void;
  updateFieldName: (nodeId: string, fieldIndex: number, newName: string) => void;
  updateFieldType: (nodeId: string, fieldIndex: number, newType: string) => void;
  addField: (nodeId: string) => void;
  removeField: (nodeId: string, fieldIndex: number) => void;
  relayout: () => void;
  setFitViewFn: (fn: (() => void) | null) => void;
}

export const useDiagramStore = create<DiagramState>((set, get) => ({
  dbmlCode: getStoredDbml(),
  nodes: [],
  edges: [],
  parseError: null,
  diagramRef: null,
  fitViewFn: null,

  setDbmlCode: (code) => set({ dbmlCode: code }),

  setNodes: (nodes) => set({ nodes }),

  setEdges: (edges) => set({ edges }),

  syncFromDbml: (code, preservePositions = true) => {
    try {
      const currentNodes = get().nodes;
      const { nodes, edges } = dbmlToFlow(code, preservePositions ? currentNodes : []);
      set({ nodes, edges, parseError: null, dbmlCode: code });
      saveDbml(code);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Parse error';
      set({ parseError: msg, dbmlCode: code });
      saveDbml(code);
    }
  },

  syncFromDiagram: () => {
    const { nodes, edges } = get();
    try {
      const code = flowToDbml(nodes, edges);
      set({ dbmlCode: code, parseError: null });
      saveDbml(code);
    } catch {
      // keep current state
    }
  },

  setDiagramRef: (ref) => set({ diagramRef: ref }),

  updateTableName: (nodeId, newName) => {
    const nodes = get().nodes.map((n) => {
      if (n.id === nodeId) {
        return { ...n, data: { ...n.data, tableName: newName } };
      }
      return n;
    });
    set({ nodes });
    // sync edges that reference old table name
    const { edges } = get();
    const code = flowToDbml(nodes, edges);
    set({ dbmlCode: code });
    saveDbml(code);
  },

  updateFieldName: (nodeId, fieldIndex, newName) => {
    const nodes = get().nodes.map((n) => {
      if (n.id === nodeId) {
        const fields = [...n.data.fields];
        fields[fieldIndex] = { ...fields[fieldIndex], name: newName };
        return { ...n, data: { ...n.data, fields } };
      }
      return n;
    });
    set({ nodes });
    const { edges } = get();
    const code = flowToDbml(nodes, edges);
    set({ dbmlCode: code });
    saveDbml(code);
  },

  addField: (nodeId) => {
    const nodes = get().nodes.map((n) => {
      if (n.id === nodeId) {
        const newField: FieldData = { name: 'new_field', type: 'integer' };
        return { ...n, data: { ...n.data, fields: [...n.data.fields, newField] } };
      }
      return n;
    });
    set({ nodes });
    const { edges } = get();
    const code = flowToDbml(nodes, edges);
    set({ dbmlCode: code });
    saveDbml(code);
  },

  removeField: (nodeId, fieldIndex) => {
    const nodes = get().nodes.map((n) => {
      if (n.id === nodeId) {
        const fields = n.data.fields.filter((_, i) => i !== fieldIndex);
        return { ...n, data: { ...n.data, fields } };
      }
      return n;
    });
    set({ nodes });
    const { edges } = get();
    const code = flowToDbml(nodes, edges);
    set({ dbmlCode: code });
    saveDbml(code);
  },

  updateFieldType: (nodeId, fieldIndex, newType) => {
    const nodes = get().nodes.map((n) => {
      if (n.id === nodeId) {
        const fields = [...n.data.fields];
        fields[fieldIndex] = { ...fields[fieldIndex], type: newType };
        return { ...n, data: { ...n.data, fields } };
      }
      return n;
    });
    set({ nodes });
    const { edges } = get();
    const code = flowToDbml(nodes, edges);
    set({ dbmlCode: code });
    saveDbml(code);
  },

  relayout: () => {
    const { nodes, edges, fitViewFn } = get();
    const layouted = autoLayout(nodes, edges) as Node<TableNodeData>[];
    set({ nodes: layouted });
    // fitView after a tick so React Flow picks up the new positions
    setTimeout(() => fitViewFn?.(), 50);
  },

  setFitViewFn: (fn) => set({ fitViewFn: fn }),
}));
