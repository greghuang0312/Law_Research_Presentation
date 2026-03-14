# Generation Module

Task 6 adds deterministic PPT composition and export.

- `ppt-composition-service.mjs`: orchestrates outline loading, deck assembly, export, and record persistence
- `pptx-writer.mjs`: builds a minimal Open XML `.pptx` package without external dependencies
- `/api/ppt/export`: exports a slide deck into `outputs/ppt/` and stores a generation record
