import { memo, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  BaseEdge,
  getBezierPath,
  type EdgeProps,
  EdgeLabelRenderer,
} from '@xyflow/react';
import type { RelationshipEdgeData } from '@/store/diagramStore';
import { useDiagramStore } from '@/store/diagramStore';

const CARDINALITY_OPTIONS = ['1', 'N'];

function CardinalityLabel({
  edgeId,
  side,
  value,
  x,
  y,
}: {
  edgeId: string;
  side: 'from' | 'to';
  value: string;
  x: number;
  y: number;
}) {
  const updateEdgeCardinality = useDiagramStore((s) => s.updateEdgeCardinality);
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLSpanElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);

  const handleClick = useCallback(() => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 4, left: rect.left });
    }
    setOpen((o) => !o);
  }, []);

  const handleSelect = useCallback(
    (option: string) => {
      updateEdgeCardinality(edgeId, side, option);
      setOpen(false);
    },
    [edgeId, side, updateEdgeCardinality]
  );

  return (
    <div
      className="nodrag nopan pointer-events-auto"
      style={{
        position: 'absolute',
        transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
      }}
    >
      <span
        ref={btnRef}
        onClick={handleClick}
        className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-card border border-border/50 text-foreground shadow-sm cursor-pointer hover:bg-blue-50 hover:border-blue-400 hover:text-blue-600 transition-colors select-none"
        title="Modifier la cardinalité"
      >
        {value}
      </span>
      {open && dropdownPos &&
        createPortal(
          <div
            className="fixed z-[9999] bg-white border border-zinc-300 rounded-md shadow-xl overflow-hidden"
            style={{ top: dropdownPos.top, left: dropdownPos.left, minWidth: '48px' }}
          >
            {CARDINALITY_OPTIONS.map((opt) => (
              <button
                key={opt}
                className={`w-full text-left px-3 py-1 text-[11px] font-bold hover:bg-blue-50 hover:text-blue-700 transition-colors ${opt === value ? 'bg-blue-100 text-blue-700' : 'text-zinc-800'}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSelect(opt);
                }}
              >
                {opt}
              </button>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}

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
        <CardinalityLabel
          edgeId={id}
          side="from"
          value={fromCard}
          x={sourceX + (targetX > sourceX ? 20 : -20)}
          y={sourceY - 10}
        />
        {/* Target cardinality label */}
        <CardinalityLabel
          edgeId={id}
          side="to"
          value={toCard}
          x={targetX + (sourceX > targetX ? 20 : -20)}
          y={targetY - 10}
        />
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
