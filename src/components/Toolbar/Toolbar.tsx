import { useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useDiagramStore } from '@/store/diagramStore';
import { exportSql } from '@/utils/exportUtils';
import {
  Copy,
  Database,
  FileCode,
  ChevronDown,
  Check,
  X,
  LayoutGrid,
  Image,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toPng } from 'html-to-image';

type SqlDialect = 'postgres' | 'mysql' | 'mssql';

const dialectLabels: Record<SqlDialect, string> = {
  postgres: 'PostgreSQL',
  mysql: 'MySQL',
  mssql: 'MSSQL',
};

export function Toolbar() {
  const diagramRef = useDiagramStore((s) => s.diagramRef);
  const dbmlCode = useDiagramStore((s) => s.dbmlCode);
  const parseError = useDiagramStore((s) => s.parseError);
  const relayout = useDiagramStore((s) => s.relayout);

  const [sqlDialect, setSqlDialect] = useState<SqlDialect>('postgres');
  const [showSqlDropdown, setShowSqlDropdown] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [sqlContent, setSqlContent] = useState('');
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const sqlButtonRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; right: number } | null>(null);

  const showFeedback = useCallback((msg: string) => {
    setCopyFeedback(msg);
    setTimeout(() => setCopyFeedback(null), 2000);
  }, []);

  /**
   * Get the React Flow viewport element which contains the actual rendered diagram.
   */
  const getViewportElement = useCallback((): HTMLElement | null => {
    if (!diagramRef) return null;
    return diagramRef.querySelector('.react-flow__viewport') as HTMLElement | null;
  }, [diagramRef]);

  const handleCopyDiagram = useCallback(async () => {
    const viewport = getViewportElement();
    if (!viewport) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(viewport, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
      showFeedback('Diagram copied!');
    } catch {
      showFeedback('Failed to copy');
    } finally {
      setExporting(false);
    }
  }, [getViewportElement, showFeedback]);

  const handleExportPng = useCallback(async () => {
    const viewport = getViewportElement();
    if (!viewport) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(viewport, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });
      const link = document.createElement('a');
      link.download = 'diagram.png';
      link.href = dataUrl;
      link.click();
      showFeedback('PNG exported!');
    } catch {
      showFeedback('Failed to export');
    } finally {
      setExporting(false);
    }
  }, [getViewportElement, showFeedback]);

  const handleExportSql = useCallback(
    (dialect: SqlDialect) => {
      try {
        const sql = exportSql(dbmlCode, dialect);
        setSqlContent(sql);
        setSqlDialect(dialect);
        setShowSqlModal(true);
        setShowSqlDropdown(false);
        setDropdownPos(null);
      } catch {
        showFeedback('SQL export failed — fix DBML errors first');
      }
    },
    [dbmlCode, showFeedback]
  );

  const handleCopySql = useCallback(async () => {
    await navigator.clipboard.writeText(sqlContent);
    showFeedback('SQL copied!');
  }, [sqlContent, showFeedback]);

  return (
    <>
      <div className="h-12 border-b border-border/50 flex items-center justify-between px-4 bg-card/80 backdrop-blur-sm shrink-0">
        {/* Left: Logo */}
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-primary" />
          <span className="font-bold text-sm tracking-tight">
            DB Diagram
          </span>
          {parseError && (
            <span className="ml-2 text-[10px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded">
              Parse Error
            </span>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          {/* Copy feedback */}
          {copyFeedback && (
            <span className="text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded mr-2 animate-pulse">
              <Check className="w-3 h-3 inline mr-1" />
              {copyFeedback}
            </span>
          )}

          {/* Copy diagram */}
          <ToolbarButton
            onClick={handleCopyDiagram}
            tooltip="Copy diagram to clipboard"
          >
            <Copy className="w-4 h-4" />
          </ToolbarButton>

          {/* Export PNG */}
          <button
            onClick={handleExportPng}
            title="Exporter en PNG"
            className="px-3 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors flex items-center gap-1.5"
          >
            <Image className="w-3.5 h-3.5" />
            Exporter en PNG
          </button>

          {/* Export SQL dropdown */}
          <div className="relative" ref={sqlButtonRef}>
            <ToolbarButton
              onClick={() => {
                if (showSqlDropdown) {
                  setShowSqlDropdown(false);
                  setDropdownPos(null);
                } else if (sqlButtonRef.current) {
                  const rect = sqlButtonRef.current.getBoundingClientRect();
                  setDropdownPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
                  setShowSqlDropdown(true);
                }
              }}
              tooltip="Export SQL"
            >
              <FileCode className="w-4 h-4" />
              <ChevronDown className="w-3 h-3 ml-0.5" />
            </ToolbarButton>
          </div>
          {showSqlDropdown && dropdownPos && createPortal(
            <>
              <div
                className="fixed inset-0"
                style={{ zIndex: 9998 }}
                onClick={() => { setShowSqlDropdown(false); setDropdownPos(null); }}
              />
              <div
                className="fixed bg-white border border-zinc-200 rounded-lg shadow-xl min-w-[160px] py-1"
                style={{ zIndex: 9999, top: dropdownPos.top, right: dropdownPos.right }}
              >
                {(Object.entries(dialectLabels) as [SqlDialect, string][]).map(
                  ([key, label]) => (
                    <button
                      key={key}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-zinc-100 transition-colors text-zinc-800"
                      onClick={() => handleExportSql(key)}
                    >
                      {label}
                    </button>
                  )
                )}
              </div>
            </>,
            document.body
          )}

          {/* Separator */}
          <div className="w-px h-5 bg-border/50 mx-1" />

          {/* Relayout */}
          <ToolbarButton onClick={relayout} tooltip="Réorganiser les tables">
            <LayoutGrid className="w-4 h-4" />
          </ToolbarButton>
        </div>
      </div>

      {/* SQL Export Modal */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white border border-zinc-200 rounded-xl shadow-2xl w-[600px] max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h2 className="font-bold text-sm">
                Export SQL — {dialectLabels[sqlDialect]}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopySql}
                  className="text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  Copy
                </button>
                <button
                  onClick={() => setShowSqlModal(false)}
                  className="p-1 rounded hover:bg-accent transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <pre className="text-xs font-mono whitespace-pre-wrap text-foreground/90 leading-relaxed">
                {sqlContent}
              </pre>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ToolbarButton({
  children,
  onClick,
  tooltip,
}: {
  children: React.ReactNode;
  onClick: () => void;
  tooltip: string;
}) {
  return (
    <button
      onClick={onClick}
      title={tooltip}
      className={cn(
        'p-2 rounded-md text-muted-foreground transition-colors',
        'hover:bg-accent hover:text-foreground',
        'flex items-center gap-0.5'
      )}
    >
      {children}
    </button>
  );
}
