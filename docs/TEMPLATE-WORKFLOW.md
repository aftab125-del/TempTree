# TempTree — Reference-to-Template Workflow

This is the standard process for turning a design reference image (Pinterest, Instagram, etc.) into a new original, editable template in TempTree's library. Use this exact prompt structure every time, attaching a new reference image.

## The prompt to use with Antigravity (Gemini 3.8, high effort)

```
You are adding a new template to TempTree's template library.

CONTEXT:
TempTree stores templates as JSON objects in data/templates.json, following this structure (match the existing Template/LayoutJson types in types/template.ts):
- id (unique string)
- name (original name, not related to any source)
- category (one of: Y2K, Minimal, Dreamy, Vintage, Bold)
- background (hex color or gradient)
- elements (array of text/image/shape objects with type, position x/y, width/height, and styling)

TASK:
I'm attaching a reference image of a design I like the LAYOUT and STYLE of. Analyze it and create ONE new template entry based on it, following these rules exactly:

1. LAYOUT: Estimate the position, size, and alignment of each text and image element based on the reference's composition.
2. TEXT CONTENT: Do NOT copy the exact wording, caption, or any text visible in the reference image. Replace all text with original, generic placeholder content appropriate to the category (e.g. a short original quote-style line for Dreamy, a bold short phrase for Y2K).
3. IMAGES: Any photo/image area in the reference becomes an image PLACEHOLDER element in the template (empty frame with position/size only) — never reference, embed, or link to the actual photo from the source image.
4. COLORS: Estimate the background color(s), text colors, and any accent colors from the reference and use those hex values.
5. FONTS: Suggest a font style that matches the visual feel (e.g. bold sans for Y2K, elegant serif for Dreamy) from fonts already used in the project (Playfair Display, Poppins) or a reasonable close alternative if neither fits.
6. CATEGORY: Assign the single best-fit category from: Y2K, Minimal, Dreamy, Vintage, Bold.
7. NAMING: Give it a new unique id (kebab-case, category-prefixed, e.g. "dreamy-04") and an original name unrelated to the source image or its creator.
8. Add this as a NEW entry appended to the existing array in data/templates.json — do not modify, remove, or reorder any existing template entries.

After adding it, confirm: the new template's id/name/category, and that it renders correctly in both the gallery thumbnail and the editor page without errors.
```

## What to do each time you use this

1. Find a reference design (Pinterest, Instagram, wherever)
2. Attach the image + paste the prompt above into Antigravity
3. Review the result yourself — confirm it feels "inspired by," not "copied from," the reference (different wording, no reused photo, layout approximated not pixel-identical)
4. Test it renders correctly in the gallery and editor
5. Commit: `git add . && git commit -m "add new template: <name>"` then `git push`

## Rules that never change, regardless of the reference

- Never copy exact text/captions from a source image
- Never use or link to the actual photo from a source image — always a placeholder
- Every new template gets an original name and id
- This process is for YOU curating templates with AI assistance — not an end-user-facing upload feature

---

## Automated Frame-Template Conversion Tool

For reference designs featuring graphical frames with solid flat-colored photo placeholder regions (black, maroon, dark green, white, grey, etc.), use the automated conversion tool:

```bash
npm run convert:frame -- <path-to-image> [options]
```

### Options:
- `--variance=<number>`: Max RGB variance tolerance for flat-color detection (default: `15`). Tune this if artwork has slight gradients or compression noise.
- `--id=<id>`: Unique template ID (e.g. `--id=vintage-polaroid-frame`).
- `--name="<name>"`: Display name for the template.
- `--category=<category>`: One of `Y2K`, `Minimal`, `Dreamy`, `Vintage`, `Bold` (default: `Minimal`).
- `--min-width=<number>`: Minimum placeholder width (default: `160`).
- `--min-height=<number>`: Minimum placeholder height (default: `180`).

### How It Works:
1. **Low Color Variance Scanning**: Identifies contiguous flat-colored rectangular regions of any hue.
2. **Background Rejection**: Ignores decorative full-bleed backgrounds and ribbons based on canvas coverage and aspect ratio.
3. **Plus-Icon Confirmation**: Scans region centers for optional `+` add-photo glyphs.
4. **Cutout Frame Generation**: Punches transparent holes in detected slots and saves the PNG into `public/frames/`.
5. **JSON Recipe Creation**: Automatically appends the layout recipe into `data/templates.json` with user photo placeholders beneath the transparent frame overlay.
