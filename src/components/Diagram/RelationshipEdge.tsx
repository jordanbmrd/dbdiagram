import { memo } from 'react';
import {
  BaseEdge,
  getBezierPath,
  type EdgeProps,
  EdgeLabelRenderer,
} from '@xyflow/react';
import type { RelationshipEdgeData } from '@/store/diagramStore';

const RelationshipEdge = memo(function RelationshipEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  data,
}: EdgeProps & { data?: RelationshipEdgeData }) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    curvature: 0.3,
  });

  const fromCard = data?.fromCardinality ?? '1';
  const toCard = data?.toCardinality ?? '1';

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: selected ? 'hsl(220, 80%, 60%)' : 'hsl(220, 15%, 50%)',
          strokeWidth: selected ? 2.5 : 1.5,
          transition: 'stroke 0.2s, stroke-width 0.2s',
        }}
      />
      <EdgeLabelRenderer>
        {/* Source cardinality label */}
        <div
          className="nodrag nopan pointer-events-auto"
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${sourceX + (targetX > sourceX ? 20 : -20)}px, ${sourceY - 10}px)`,
          }}
        >
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-card border border-border/50 text-foreground shadow-sm">
            {fromCard}
          </span>
        </div>
        {/* Target cardinality label */}
        <div
          className="nodrag nopan pointer-events-auto"
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${targetX + (sourceX > targetX ? 20 : -20)}px, ${targetY - 10}px)`,
          }}
        >
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-card border border-border/50 text-foreground shadow-sm">
            {toCard}
          </span>
        </div>
        {/* Center label */}
        {selected && (
          <div
            className="nodrag nopan pointer-events-auto"
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
          >
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 border border-blue-500/30 text-blue-400 font-mono">
              {data?.fromField} → {data?.toField}
            </span>
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  );
});

export { RelationshipEdge };
