# TempTree — Design Spec

## 1. Brand Identity
- **Name:** TempTree
- **Concept:** A tree of templates — branches into categories (Y2K, Minimal, Dreamy, Vintage, Bold), rooted in a sakura (cherry blossom) visual motif
- **Tone:** Soft, aesthetic-forward, slightly moody-to-dreamy (not cutesy, not corporate)

## 2. Color Palette
Sourced from the reference sakura palette (Pinterest board):

| Name | Hex | RGB | Usage |
|---|---|---|---|
| Deep Plum | `#601D49` | 96, 29, 73 | Darkest tone — hero background depth, headers on light sections |
| Mauve | `#BD5579` | 189, 85, 121 | Primary accent — buttons, active states, category tags |
| Dusty Pink | `#EA9D9D` | 234, 157, 157 | Secondary accent — hover states, soft highlights |
| Cream | `#FFEBB8` | 255, 235, 184 | Background base for gallery/editor sections, light text on dark |

Gradient direction: plum → mauve → dusty pink → cream mirrors the hero's scroll journey (dark/moody at top of scroll, light/soft by the time the user reaches the gallery).

## 3. Typography
- **Headers/wordmark:** Playfair Display (elegant serif, matches the sakura/dreamy aesthetic)
- **UI/body text:** Poppins (clean, legible, keeps the editor functional)
- Both available via Google Fonts

## 4. Sakura Scroll Hero — Animation Spec
- **Source:** AI-generated video (Google Flow), converted to a frame sequence
- **Frame count:** 300
- **Naming pattern:** `ezgif-frame-001.png` through `ezgif-frame-300.png` (3-digit, zero-padded)
- **Location in project:** `/public/sakura-frames/`
- **Sequence content:**
  1. Frame 1 (0% scroll): tight bunch of sakura petals floating in a soft grey studio space
  2. Early-mid frames: petals gradually loosen and drift apart while the camera descends
  3. Mid frames: a fully bloomed sakura tree comes into view below the petals
  4. Late frames: camera arcs into a low-angle orbit around the tree, circling its full form
  5. Frame 300 (100% scroll): settled orbit view of the full tree, used as backdrop for category name reveals before the gallery section appears
- **Playback mechanism:** scroll-scrubbed canvas (not a video element) — frame index driven by scroll position within a tall (300vh) wrapper section
- **Overlay timing (as % of scroll through the hero section):**
  - 0–10%: "TempTree" wordmark + tagline
  - 35–65%: category names (Y2K, Minimal, Dreamy, Vintage) fade in one at a time
  - 90–100%: hero fades out, gallery preview fades in

## 5. UI Principles
- The chrome (nav, buttons, editor controls) should stay minimal and get out of the way of the templates and the sakura visuals — this is a design tool, not a dashboard
- Gallery and editor sections use the cream background to feel like a continuation of the hero's scroll journey, not a jarring switch
- Category tags/accents use mauve and dusty pink from the palette rather than introducing new colors

## 6. Open Questions
- Logo mark (separate from wordmark) — not yet designed
- Whether the sakura motif appears anywhere beyond the hero (e.g. loading states, editor background accents)
