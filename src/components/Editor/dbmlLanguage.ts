import type { languages } from 'monaco-editor';

export const dbmlLanguageId = 'dbml';

export const dbmlLanguageConfig: languages.ILanguageExtensionPoint = {
  id: dbmlLanguageId,
};

export const dbmlMonarchLanguage: languages.IMonarchLanguage = {
  keywords: [
    'Table', 'table', 'Ref', 'ref', 'Enum', 'enum',
    'TableGroup', 'tablegroup', 'Project', 'project',
    'Note', 'note', 'indexes', 'Indexes',
    'as', 'null', 'not', 'true', 'false',
  ],
  typeKeywords: [
    'int', 'integer', 'bigint', 'smallint', 'tinyint',
    'float', 'double', 'decimal', 'numeric', 'real',
    'boolean', 'bool', 'bit',
    'varchar', 'char', 'text', 'nvarchar', 'nchar', 'ntext',
    'date', 'datetime', 'timestamp', 'time',
    'blob', 'binary', 'varbinary', 'image',
    'json', 'jsonb', 'xml', 'uuid', 'serial',
  ],
  attributes: [
    'pk', 'primary', 'key', 'unique', 'not null', 'null',
    'increment', 'default', 'ref',
  ],
  operators: ['>', '<', '-', '<>'],

  tokenizer: {
    root: [
      // Comments
      [/\/\/.*$/, 'comment'],
      [/\/\*/, 'comment', '@comment'],

      // Strings
      [/"([^"\\]|\\.)*$/, 'string.invalid'],
      [/'([^'\\]|\\.)*$/, 'string.invalid'],
      [/"/, 'string', '@string_double'],
      [/'/, 'string', '@string_single'],
      [/`[^`]*`/, 'string.backtick'],

      // Brackets
      [/[{}()\[\]]/, '@brackets'],

      // Relations
      [/<>/, 'operator'],
      [/[><\-]/, 'operator'],
      [/:/, 'delimiter'],
      [/,/, 'delimiter'],

      // Numbers
      [/\d+/, 'number'],

      // Identifiers
      [/[a-zA-Z_]\w*/, {
        cases: {
          '@keywords': 'keyword',
          '@typeKeywords': 'type',
          '@default': 'identifier',
        },
      }],

      // Whitespace
      [/\s+/, 'white'],
    ],

    comment: [
      [/[^/*]+/, 'comment'],
      [/\*\//, 'comment', '@pop'],
      [/[/*]/, 'comment'],
    ],

    string_double: [
      [/[^\\"]+/, 'string'],
      [/\\./, 'string.escape'],
      [/"/, 'string', '@pop'],
    ],

    string_single: [
      [/[^\\']+/, 'string'],
      [/\\./, 'string.escape'],
      [/'/, 'string', '@pop'],
    ],
  },
};

export const dbmlDarkTheme = {
  base: 'vs-dark' as const,
  inherit: true,
  rules: [
    { token: 'keyword', foreground: 'c586c0', fontStyle: 'bold' },
    { token: 'type', foreground: '4ec9b0' },
    { token: 'string', foreground: 'ce9178' },
    { token: 'string.backtick', foreground: 'dcdcaa' },
    { token: 'comment', foreground: '6a9955' },
    { token: 'number', foreground: 'b5cea8' },
    { token: 'operator', foreground: 'd4d4d4' },
    { token: 'identifier', foreground: '9cdcfe' },
    { token: 'delimiter', foreground: 'd4d4d4' },
  ],
  colors: {
    'editor.background': '#0d1117',
    'editor.foreground': '#e6edf3',
    'editorLineNumber.foreground': '#484f58',
    'editorCursor.foreground': '#58a6ff',
    'editor.selectionBackground': '#264f78',
  },
};

export const dbmlLightTheme = {
  base: 'vs' as const,
  inherit: true,
  rules: [
    { token: 'keyword', foreground: 'af00db', fontStyle: 'bold' },
    { token: 'type', foreground: '267f99' },
    { token: 'string', foreground: 'a31515' },
    { token: 'string.backtick', foreground: '795e26' },
    { token: 'comment', foreground: '008000' },
    { token: 'number', foreground: '098658' },
    { token: 'operator', foreground: '000000' },
    { token: 'identifier', foreground: '001080' },
    { token: 'delimiter', foreground: '000000' },
  ],
  colors: {
    'editor.background': '#ffffff',
    'editor.foreground': '#24292f',
  },
};
