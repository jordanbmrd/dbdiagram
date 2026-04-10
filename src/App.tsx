import { useState, useCallback } from 'react';
import { DBMLEditor } from '@/components/Editor/DBMLEditor';
import { DiagramCanvas } from '@/components/Diagram/DiagramCanvas';
import { Toolbar } from '@/components/Toolbar/Toolbar';

function ResizeHandle({ onMouseDown }: { onMouseDown: (e: React.MouseEvent) => void }) {
  return (
    <div
      className="w-1 cursor-col-resize bg-border/30 hover:bg-primary/40 active:bg-primary/60 transition-colors relative group shrink-0"
      onMouseDown={onMouseDown}
    >
      <div className="absolute inset-y-0 -left-1 -right-1" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-8 rounded-full bg-muted-foreground/30 group-hover:bg-primary/60 transition-colors" />
    </div>
  );
}

export default function App() {
  const [panelWidth, setPanelWidth] = useState(35); // percentage

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const startX = e.clientX;
      const startWidth = panelWidth;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const delta = moveEvent.clientX - startX;
        const containerWidth = window.innerWidth;
        const newWidth = startWidth + (delta / containerWidth) * 100;
        setPanelWidth(Math.max(15, Math.min(70, newWidth)));
      };

      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };

      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [panelWidth]
  );

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-background text-foreground">
      <Toolbar />

      <div className="flex-1 flex min-h-0">
        {/* Left panel — DBML Editor */}
        <div className="h-full overflow-hidden" style={{ width: `${panelWidth}%` }}>
          <div className="h-full flex flex-col">
            <div className="px-3 py-1.5 border-b border-border/30 bg-card/50 shrink-0">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                DBML Editor
              </span>
            </div>
            <div className="flex-1 min-h-0">
              <DBMLEditor />
            </div>
          </div>
        </div>

        {/* Resize handle */}
        <ResizeHandle onMouseDown={handleResizeStart} />

        {/* Right panel — Diagram */}
        <div className="h-full flex-1 min-w-0">
          <div className="h-full flex flex-col">
            <div className="px-3 py-1.5 border-b border-border/30 bg-card/50 shrink-0">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Diagram
              </span>
            </div>
            <div className="flex-1 min-h-0">
              <DiagramCanvas />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
