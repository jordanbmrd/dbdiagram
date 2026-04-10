import { useCallback, useRef, useEffect, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  useReactFlow,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
  BackgroundVariant,
  ReactFlowProvider,
} from '@xyflow/react';
import { LayoutGrid } from 'lucide-react';
import { useDiagramStore } from '@/store/diagramStore';
import '@xyflow/react/dist/style.css';
import { TableNode } from './TableNode';
import { RelationshipEdge } from './RelationshipEdge';

const nodeTypes = { tableNode: TableNode };
const edgeTypes = { relationshipEdge: RelationshipEdge };

function DiagramCanvasInner() {
  const nodes = useDiagramStore((s) => s.nodes);
  const edges = useDiagramStore((s) => s.edges);
  const setNodes = useDiagramStore((s) => s.setNodes);
  const setEdges = useDiagramStore((s) => s.setEdges);
  const setDiagramRef = useDiagramStore((s) => s.setDiagramRef);
  const setFitViewFn = useDiagramStore((s) => s.setFitViewFn);
  const relayout = useDiagramStore((s) => s.relayout);

  const containerRef = useRef<HTMLDivElement>(null);
  const { fitView } = useReactFlow();

  useEffect(() => {
    setDiagramRef(containerRef.current);
  }, [setDiagramRef]);

  useEffect(() => {
    setFitViewFn(() => fitView({ padding: 0.2, duration: 300 }));
    return () => setFitViewFn(null);
  }, [fitView, setFitViewFn]);

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      const updated = applyNodeChanges(changes, nodes);
      setNodes(updated as typeof nodes);
    },
    [nodes, setNodes]
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      const updated = applyEdgeChanges(changes, edges);
      setEdges(updated as typeof edges);
    },
    [edges, setEdges]
  );

  const onConnect: OnConnect = useCallback(
    (connection) => {
      if (!connection.source || !connection.target) return;

      const sourceField = connection.sourceHandle?.replace('-right', '') ?? '';
      const targetField = connection.targetHandle?.replace('-left', '') ?? '';

      const newEdge = {
        id: `${connection.source}.${sourceField}-${connection.target}.${targetField}`,
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle,
        targetHandle: connection.targetHandle,
        type: 'relationshipEdge' as const,
        data: {
          fromField: sourceField,
          toField: targetField,
          fromCardinality: 'N',
          toCardinality: '1',
        },
      };

      setEdges([...edges, newEdge]);

      setTimeout(() => {
        useDiagramStore.getState().syncFromDiagram();
      }, 50);
    },
    [edges, setEdges]
  );

  const proOptions = useMemo(() => ({ hideAttribution: true }), []);

  return (
    <div ref={containerRef} className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={proOptions}
        deleteKeyCode={['Backspace', 'Delete']}
        snapToGrid
        snapGrid={[16, 16]}
        defaultEdgeOptions={{
          type: 'relationshipEdge',
        }}
        colorMode="light"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="hsl(240, 5%, 80%)"
        />
        <Controls
          showInteractive={false}
          className="!rounded-lg !border !border-border/50 !shadow-lg"
        />
        <Panel position="top-right" style={{ marginTop: '8px', marginRight: '8px' }}>
          <button
            onClick={relayout}
            title="Réorganiser les tables"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-md transition-colors cursor-pointer"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Réorganiser
          </button>
        </Panel>
        <MiniMap
          nodeColor="hsl(240, 5%, 85%)"
          maskColor="rgba(255,255,255,0.7)"
          className="!rounded-lg !border !border-border/50 !shadow-lg"
          pannable
          zoomable
        />
      </ReactFlow>
    </div>
  );
}

export function DiagramCanvas() {
  return (
    <ReactFlowProvider>
      <DiagramCanvasInner />
    </ReactFlowProvider>
  );
}
