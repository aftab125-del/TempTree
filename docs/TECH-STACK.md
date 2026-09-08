# TempTree — Tech Stack & Architecture

## Frontend
- **Framework:** Next.js 14 (App Router), TypeScript
- **Styling:** Tailwind CSS, brand palette as CSS variables
- **Editor canvas engine:** Fabric.js — handles drag/drop text, image objects, layers, and PNG export
- **Scroll hero:** plain HTML5 `<canvas>` + scroll-position-driven frame swapping (no 3D library needed — the "3D" look comes from the pre-rendered AI video frames, not a live 3D scene)

## Data
- **Templates:** stored as JSON "layout" objects (position, font, color, image placeholder per element) rather than flat images, so one template can power many customizations
- **v1 storage:** local `/data/templates.json` mock file
- **Planned (post-v1):** Supabase (Postgres + storage) for real template data, thumbnails, and (if accounts are added later) user projects

## Hosting
- Vercel (consistent with the UTA-VERSE project's existing setup)

## Key Folders (once scaffolded)
```
/app
  /page.tsx              → homepage (sakura hero + gallery preview)
  /gallery/page.tsx       → full template gallery
  /editor/[templateId]/page.tsx → editor
/components
  SakuraScrollHero.tsx    → scroll-scrubbing canvas component
  TemplateCanvas.tsx      → Fabric.js render/edit component, reused by gallery thumbnails + editor
/data
  templates.json          → mock template layouts
/public
  /sakura-frames/         → 300 PNG frames, ezgif-frame-001.png ... ezgif-frame-300.png
```

## Notable Decisions
- No Three.js / react-three-fiber — original plan considered a live 3D scene, replaced with the frame-scrubbing technique for lower complexity and better performance
- Fabric.js chosen over Konva for the editor for ease of use with AI-assisted code generation

## Open Questions
- Whether Supabase gets wired in at v1 or after the mock-data version is validated
- Whether template thumbnails are pre-rendered static images or live Fabric.js renders (currently planned as live renders via shared TemplateCanvas component)
