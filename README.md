# DB Diagram

A browser-based database diagram editor that lets you write [DBML](https://dbml.dbdiagram.io/) and see a live, interactive entity-relationship diagram alongside your code.

## Features

- **Live DBML editor** — syntax-highlighted Monaco editor with real-time diagram updates
- **Interactive diagram canvas** — drag tables, pan, and zoom with React Flow
- **Bi-directional sync** — edit tables and fields directly on the diagram; the DBML updates automatically
- **Auto-layout** — one-click diagram re-arrangement using the Dagre layout engine
- **SQL export** — generate SQL DDL for PostgreSQL, MySQL, or MSSQL from your schema
- **PNG export** — download the diagram as a high-resolution PNG image
- **Copy to clipboard** — copy the diagram image directly to the clipboard
- **Persistent storage** — your DBML is saved in `localStorage` and restored between sessions

## Tech Stack

| Layer | Library |
|---|---|
| Framework | React 19 + TypeScript |
| Build tool | Vite 6 |
| Styling | Tailwind CSS 4 |
| Code editor | Monaco Editor (`@monaco-editor/react`) |
| Diagram engine | React Flow (`@xyflow/react`) |
| Auto-layout | Dagre (`@dagrejs/dagre`) |
| DBML parsing | `@dbml/core` |
| State management | Zustand |
| Image export | `html-to-image` |

## Getting Started

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9

### Installation

```bash
git clone https://github.com/jordanbmrd/dbdiagram.git
cd dbdiagram
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build

```bash
npm run build
npm run preview
```

## Usage

1. Write or paste [DBML](https://dbml.dbdiagram.io/docs/) in the left panel.
2. The diagram on the right updates in real time as you type.
3. Drag table nodes to rearrange the diagram, or click **Auto-layout** to reset positions.
4. Double-click table names or field names on the canvas to edit them inline — the DBML syncs back automatically.
5. Use the toolbar to:
   - **Copy** — copy the diagram as an image to the clipboard
   - **Export PNG** — download the diagram as a `.png` file
   - **Export SQL** — choose a SQL dialect and copy the generated DDL

## DBML Quick Reference

```dbml
Table users {
  id        integer  [pk, increment]
  username  varchar  [unique, not null]
  email     varchar  [not null]
  created_at timestamp [default: `now()`]
}

Table posts {
  id      integer [pk, increment]
  title   varchar [not null]
  user_id integer [not null]
}

Ref: posts.user_id > users.id  // many-to-one
```

Full DBML documentation: [dbml.dbdiagram.io/docs](https://dbml.dbdiagram.io/docs/)

## Project Structure

```
src/
├── components/
│   ├── Diagram/       # React Flow canvas, table nodes, relationship edges
│   ├── Editor/        # Monaco editor wrapper and DBML language definition
│   └── Toolbar/       # Top action bar (export, copy, etc.)
├── constants/         # Default DBML sample schema
├── lib/               # Utility helpers (cn, etc.)
├── store/             # Zustand diagram state
└── utils/             # DBML ↔ Flow conversion, auto-layout, SQL export
```

## License

This project is private. All rights reserved.
