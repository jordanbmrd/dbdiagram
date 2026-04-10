import { memo, useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { TableNodeData, FieldData } from '@/store/diagramStore';
import { useDiagramStore } from '@/store/diagramStore';
import { cn } from '@/lib/utils';
import { Plus, Key, Link2 } from 'lucide-react';

const COMMON_TYPES = [
  'integer', 'bigint', 'smallint', 'serial',
  'varchar', 'varchar(255)', 'text', 'char(1)',
  'boolean', 'float', 'double', 'decimal',
  'date', 'datetime', 'timestamp', 'time',
  'json', 'jsonb', 'uuid', 'blob',
];

function FieldRow({
  field,
  index,
  nodeId,
  isLast,
}: Readonly<{
  field: FieldData;
  index: number;
  nodeId: string;
  isLast: boolean;
}>) {
  const updateFieldName = useDiagramStore((s) => s.updateFieldName);
  const updateFieldType = useDiagramStore((s) => s.updateFieldType);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(field.name);
  const [editingType, setEditingType] = useState(false);
  const [typeValue, setTypeValue] = useState(field.type);
  const [typeFilter, setTypeFilter] = useState('');
  const typeInputRef = useRef<HTMLInputElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);

  const handleNameBlur = useCallback(() => {
    setEditingName(false);
    if (nameValue.trim() && nameValue !== field.name) {
      updateFieldName(nodeId, index, nameValue.trim());
    } else {
      setNameValue(field.name);
    }
  }, [nameValue, field.name, nodeId, index, updateFieldName]);

  const handleNameKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
      if (e.key === 'Escape') {
        setNameValue(field.name);
        setEditingName(false);
      }
    },
    [field.name]
  );

  const closeTypeEditor = useCallback((applyValue?: string) => {
    const finalValue = applyValue ?? typeValue;
    setEditingType(false);
    setDropdownPos(null);
    if (finalValue.trim() && finalValue !== field.type) {
      updateFieldType(nodeId, index, finalValue.trim());
    } else {
      setTypeValue(field.type);
    }
    setTypeFilter('');
  }, [typeValue, field.type, nodeId, index, updateFieldType]);

  const handleTypeBlur = useCallback(() => {
    // Delay to allow portal click to fire first
    setTimeout(() => closeTypeEditor(), 200);
  }, [closeTypeEditor]);

  const handleTypeKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        closeTypeEditor();
      }
      if (e.key === 'Escape') {
        setTypeValue(field.type);
        setEditingType(false);
        setDropdownPos(null);
        setTypeFilter('');
      }
    },
    [field.type, closeTypeEditor]
  );

  const handleSelectType = useCallback(
    (type: string) => {
      setTypeValue(type);
      setEditingType(false);
      setDropdownPos(null);
      setTypeFilter('');
      updateFieldType(nodeId, index, type);
    },
    [nodeId, index, updateFieldType]
  );

  const openTypeEditor = useCallback(() => {
    setEditingType(true);
    // Position will be set after render via useEffect
  }, []);

  // Update dropdown position when editing
  useEffect(() => {
    if (editingType && typeInputRef.current) {
      const rect = typeInputRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 4, left: rect.left });
    }
  }, [editingType, typeValue]);

  const filteredTypes = COMMON_TYPES.filter((t) =>
    t.toLowerCase().includes((typeFilter || typeValue).toLowerCase())
  );

  return (
    <div
      className={cn(
        'group/field relative flex items-center gap-2 px-3 py-1.5 text-xs transition-colors',
        'hover:bg-black/[0.04]',
        !isLast && 'border-b border-zinc-200/60'
      )}
    >
      {/* Handles — invisible by default, appear on row hover for drag-to-connect */}
      <Handle
        type="target"
        position={Position.Left}
        id={`${field.name}-left`}
        className="!w-3 !h-3 !bg-transparent !border-2 !border-transparent group-hover/field:!border-blue-400 group-hover/field:!bg-blue-400/20 !-left-1.5 !transition-all !duration-150"
      />

      {/* PK / FK badges */}
      <div className="flex gap-0.5 w-10 shrink-0">
        {field.pk && (
          <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400">
            <Key className="w-2.5 h-2.5" />
          </span>
        )}
        {field.fk && (
          <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400">
            <Link2 className="w-2.5 h-2.5" />
          </span>
        )}
      </div>

      {/* Field name — double-click to edit */}
      {editingName ? (
        <input
          className="bg-transparent border-b border-primary/50 outline-none text-xs font-medium flex-1 min-w-0"
          value={nameValue}
          onChange={(e) => setNameValue(e.target.value)}
          onBlur={handleNameBlur}
          onKeyDown={handleNameKeyDown}
          autoFocus
        />
      ) : (
        <span
          className="font-medium flex-1 min-w-0 truncate cursor-text"
          onDoubleClick={() => setEditingName(true)}
        >
          {field.name}
        </span>
      )}

      {/* Field type — click to edit with autocomplete dropdown */}
      {editingType ? (
        <div className="relative shrink-0">
          <input
            ref={typeInputRef}
            className="bg-transparent border-b border-primary/50 outline-none text-[11px] w-24 text-muted-foreground"
            value={typeValue}
            onChange={(e) => {
              setTypeValue(e.target.value);
              setTypeFilter(e.target.value);
            }}
            onBlur={handleTypeBlur}
            onKeyDown={handleTypeKeyDown}
            autoFocus
          />
          {filteredTypes.length > 0 && dropdownPos && createPortal(
            <div
              className="fixed z-[9999] bg-white border border-zinc-300 rounded-md shadow-xl max-h-32 overflow-y-auto min-w-[120px]"
              style={{ top: dropdownPos.top, left: dropdownPos.left }}
            >
              {filteredTypes.slice(0, 8).map((t) => (
                <button
                  key={t}
                  className="w-full text-left px-2 py-1 text-[11px] hover:bg-zinc-100 transition-colors text-zinc-800"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSelectType(t);
                  }}
                >
                  {t}
                </button>
              ))}
            </div>,
            document.body
          )}
        </div>
      ) : (
        <span
          className="text-muted-foreground text-[11px] shrink-0 cursor-pointer hover:text-foreground hover:underline decoration-dotted transition-colors"
          onClick={openTypeEditor}
        >
          {field.type}
        </span>
      )}

      {/* Constraints */}
      <div className="flex gap-0.5 shrink-0">
        {field.notNull && (
          <span className="text-[9px] text-orange-400/70 font-mono">NN</span>
        )}
        {field.unique && (
          <span className="text-[9px] text-purple-400/70 font-mono">UQ</span>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        id={`${field.name}-right`}
        className="!w-3 !h-3 !bg-transparent !border-2 !border-transparent group-hover/field:!border-emerald-400 group-hover/field:!bg-emerald-400/20 !-right-1.5 !transition-all !duration-150"
      />
    </div>
  );
}

const TableNode = memo(function TableNode({ id, data, selected }: NodeProps & { data: TableNodeData }) {
  const updateTableName = useDiagramStore((s) => s.updateTableName);
  const addField = useDiagramStore((s) => s.addField);
  const [editingHeader, setEditingHeader] = useState(false);
  const [headerValue, setHeaderValue] = useState(data.tableName);

  const handleHeaderBlur = useCallback(() => {
    setEditingHeader(false);
    if (headerValue.trim() && headerValue !== data.tableName) {
      updateTableName(id, headerValue.trim());
    } else {
      setHeaderValue(data.tableName);
    }
  }, [headerValue, data.tableName, id, updateTableName]);

  const handleHeaderKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
      if (e.key === 'Escape') {
        setHeaderValue(data.tableName);
        setEditingHeader(false);
      }
    },
    [data.tableName]
  );

  if (!editingHeader && headerValue !== data.tableName) {
    setHeaderValue(data.tableName);
  }

  return (
    <div
      className={cn(
        'rounded-lg min-w-[240px] max-w-[360px]',
        'bg-white',
        'border-2 shadow-md',
        'transition-shadow duration-200',
        selected
          ? 'border-blue-500 shadow-blue-500/25 shadow-lg ring-1 ring-blue-500/30'
          : 'border-zinc-300 hover:border-zinc-400 shadow-black/10'
      )}
    >
      {/* Table Header */}
      <div className="bg-zinc-100 px-3 py-2 flex items-center justify-between border-b border-zinc-200 rounded-t-lg">
        {editingHeader ? (
          <input
            className="bg-transparent outline-none text-sm font-bold flex-1 min-w-0"
            value={headerValue}
            onChange={(e) => setHeaderValue(e.target.value)}
            onBlur={handleHeaderBlur}
            onKeyDown={handleHeaderKeyDown}
            autoFocus
          />
        ) : (
          <span
            className="text-sm font-bold tracking-wide cursor-text truncate flex-1"
            onDoubleClick={() => setEditingHeader(true)}
          >
            {data.tableName}
          </span>
        )}
        <span className="text-[10px] text-muted-foreground ml-2">
          {data.fields.length} fields
        </span>
      </div>

      {/* Fields */}
      <div>
        {data.fields.map((field, i) => (
          <FieldRow
            key={`${field.name}-${i}`}
            field={field}
            index={i}
            nodeId={id}
            isLast={i === data.fields.length - 1}
          />
        ))}
      </div>

      {/* Add field button */}
      <button
        className="w-full px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-black/[0.03] transition-colors flex items-center justify-center gap-1 border-t border-zinc-200 rounded-b-lg"
        onClick={() => addField(id)}
      >
        <Plus className="w-3 h-3" />
        Add field
      </button>
    </div>
  );
});

export { TableNode };
