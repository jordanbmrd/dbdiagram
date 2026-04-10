import { useRef, useCallback } from 'react';
import MonacoEditor, { type OnMount } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { useDiagramStore } from '@/store/diagramStore';
import {
  dbmlLanguageId,
  dbmlMonarchLanguage,
  dbmlLightTheme,
} from './dbmlLanguage';

let languageRegistered = false;

export function DBMLEditor() {
  const dbmlCode = useDiagramStore((s) => s.dbmlCode);
  const parseError = useDiagramStore((s) => s.parseError);
  const syncFromDbml = useDiagramStore((s) => s.syncFromDbml);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const isExternalUpdate = useRef(false);

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    if (!languageRegistered) {
      monaco.languages.register({ id: dbmlLanguageId });
      monaco.languages.setMonarchTokensProvider(dbmlLanguageId, dbmlMonarchLanguage);
      monaco.editor.defineTheme('dbml-light', dbmlLightTheme);
      languageRegistered = true;
    }

    monaco.editor.setTheme('dbml-light');

    // Initial parse
    syncFromDbml(dbmlCode, false);
  };

  const handleChange = useCallback(
    (value: string | undefined) => {
      if (isExternalUpdate.current) {
        isExternalUpdate.current = false;
        return;
      }
      if (value === undefined) return;

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        syncFromDbml(value, true);
      }, 300);
    },
    [syncFromDbml]
  );

  // Sync editor content when DBML changes from diagram side
  const prevCodeRef = useRef(dbmlCode);
  if (editorRef.current && dbmlCode !== prevCodeRef.current) {
    const currentVal = editorRef.current.getValue();
    if (currentVal !== dbmlCode) {
      isExternalUpdate.current = true;
      editorRef.current.setValue(dbmlCode);
    }
    prevCodeRef.current = dbmlCode;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0">
        <MonacoEditor
          height="100%"
          language={dbmlLanguageId}
          theme="dbml-light"
          value={dbmlCode}
          onChange={handleChange}
          onMount={handleMount}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineHeight: 22,
            padding: { top: 16, bottom: 16 },
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            automaticLayout: true,
            tabSize: 2,
            renderLineHighlight: 'line',
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
            fontLigatures: true,
          }}
        />
      </div>
      {parseError && (
        <div className="px-3 py-2 bg-red-500/10 border-t border-red-500/20 text-red-400 text-xs font-mono truncate">
          {parseError}
        </div>
      )}
    </div>
  );
}
