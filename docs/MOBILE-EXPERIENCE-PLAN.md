# TempTree — Mobile Experience & Background Treatment Plan

## Executive Summary

This document outlines a comprehensive architectural and design plan to elevate TempTree's mobile web experience across all viewports (375px iPhone SE, 390px iPhone 13/14/15, 428px iPhone Plus/Max, and standard Android devices).

It addresses two core pillars:
1. **Part 1 — Mobile Background Treatment**: Moving beyond heavy desktop-centric asset loading to a lightweight, responsive, brand-faithful visual background system.
2. **Part 2 — Overall Mobile Layout Quality**: A prioritized audit and structural redesign covering viewport responsiveness, touch ergonomics, editor ergonomics (bottom drawer vs. stacked sidebar), typography scaling, and tap-target compliance.

---

## PART 1 — Mobile Static Background Treatment

### 1.1 The Challenge with Current Mobile Backgrounds
* **Heavy Network & Memory Load**: The desktop homepage features a 300-frame scroll-scrubbed canvas (`/public/sakura-frames/`, ~1280px wide WebP frames). On mobile connections (4G/LTE), streaming hundreds of frames consumes ~15–25MB of data and risks memory pressure/crashes in mobile WebKit (Safari).
* **Scroll Fatigue**: 300vh of scroll distance requires 5–8 aggressive finger swipes on touch screens before users reach the interactive content.
* **Awkward Post-Hero Cropping**: In post-hero sections, the fixed background canvas pins Frame 300 at `z-0`. On tall/narrow mobile viewports, `object-cover` crops the tree unpredictably, producing dark, muddy contrast behind feature cards and text.
* **Page Inconsistencies**: Non-homepage views (`/gallery`, `/upload-template`, `/editor`) have disparate backgrounds (e.g. flat `#140e13` on gallery vs. `bg-plum` with dots on editor).

---

### 1.2 Recommended Strategy: Hand-Crafted Vector SVG + Palette Ambient Glows

We recommend a **three-tier background hierarchy** built purely with **CSS radial gradients and inline/vector SVG line art**, completely avoiding heavy raster or unpredictable AI-generated imagery.

| Background Tier | Description | Implementation | File Size / Performance |
|---|---|---|---|
| **Tier 1: Hero Ambient (Mobile Homepage Hero)** | Single high-fidelity settled bloom backdrop + floating SVG petals. On mobile, the hero provides an immediate aesthetic impact without 300-frame overhead. | Static WebP hero frame (Frame 300, 1080x1920 mobile-optimized) + CSS keyframe floating petals. | ~45KB total (down from ~20MB). Zero CPU lag. |
| **Tier 2: Atmospheric Botanical Texture (Post-Hero & Gallery)** | Subtle, handcrafted Japanese botanical line art (cherry blossom branches, delicate line motifs) layered over brand gradient glows. | Hand-designed SVG pattern (<2KB) with CSS `mask-image` or opacity, layered over `radial-gradient` of Charcoal (`#4A4A4A`), Dusty Mauve (`#E2B4BD`), and Peach Pink (`#F7D6D0`). | ~1.5KB SVG. Resolution-independent (crisp on 3x Retina). Zero AI artifacts. |
| **Tier 3: Editor Zen Texture (Workspace Background)** | Deep, distraction-free matte charcoal surface with an ultra-subtle micro-dot or cross-weave grid at 4% opacity. The canvas remains the hero. | Pure CSS radial gradient with SVG pattern mask. | 0 bytes extra transfer. 100% focus on user photos. |

---

### 1.3 Why Hand-Designed CSS/SVG Trumps AI-Generated Textures
1. **Zero Bandwidth & Instant Load**: An inline or component-level SVG pattern weighs under 2KB, loads in 0ms, and requires no external HTTP round-trips.
2. **True Color Harmony**: SVG vector strokes directly reference our Tailwind CSS variables (`--color-mauve`, `--color-dusty-pink`, `--color-charcoal`), reacting seamlessly if themes or palette shades adjust.
3. **No AI Artifacts or Hallucinations**: AI-generated background tiles frequently suffer from non-repeating seams, blurry smudges, or bizarre pseudo-text that cheapens a design tool's credibility.
4. **Retina Sharpness**: Vector line art scales infinitely to 3x and 4x device pixel ratios on high-density OLED mobile displays with zero pixelation or blurriness.

---

### 1.4 Background Application Matrix

| Page / Section | Current Desktop State | Proposed Mobile State |
|---|---|---|
| **Homepage: Hero (0–100vh)** | 300-frame scroll-scrub canvas (300vh) | Compact 120vh hero with settled sakura bloom visual, floating SVG petals, and instant 1-swipe transition to atelier. |
| **Homepage: Post-Hero (How It Works, Bento, FAQ, CTA)** | Fixed Frame 300 canvas behind content | Seamless transition to Tier 2 Botanical SVG + deep plum ambient glow. Completely detaches the canvas loop on mobile. |
| **Upload / Gallery Studio (`/gallery`)** | Flat `#140e13` with single blur blob | Tier 2 Botanical vector motif with dual ambient radial glows (mauve top-left, peach bottom-right). |
| **Editor Canvas Studio (`/editor/[templateId]`)** | Dark plum with basic radial dots | Tier 3 Zen Editor matte surface with subtle frame-boundary illumination so template edges pop clearly. |

---

## PART 2 — Overall Mobile Layout Quality Audit & Redesign

### 2.1 Critical Mobile Issues Identified

#### Issue 1: Editor Canvas Sizing Is Hardcoded to 0.38 Scale (CRITICAL OVERFLOW)
* **Location**: [`app/editor/[templateId]/page.tsx:59`](file:///d:/temptree/app/editor/%5BtemplateId%5D/page.tsx#L59)
* **Finding**: `canvasScale` is statically initialized to `0.38` and never recalculated for viewport dimensions (`1080 * 0.38 = 410.4px` width).
* **Impact**: On iPhone SE (375px wide) and iPhone 13/14 (390px wide), the canvas exceeds the viewport width. Users are forced to pan horizontally just to see their template borders, causing awkward horizontal scrolling glitches.
* **Recommended Fix**: Implement dynamic auto-scaling on mount and window resize:
  ```ts
  const calculateMobileScale = () => {
    const availableWidth = window.innerWidth - 32; // 16px padding each side
    const availableHeight = window.innerHeight - 260; // Leave room for header + bottom dock
    const scaleW = availableWidth / 1080;
    const scaleH = availableHeight / 1920;
    return Math.min(scaleW, scaleH, 0.42);
  };
  ```

#### Issue 2: Editor Sidebar vs. Canvas Architecture on Mobile
* **Location**: [`app/editor/[templateId]/page.tsx:1150`](file:///d:/temptree/app/editor/%5BtemplateId%5D/page.tsx#L1150)
* **Finding**: The desktop editor uses a side-by-side flex layout (`flex-col md:flex-row`). On mobile, the `<aside>` toolbar is stacked beneath the canvas with `max-h-[45vh] overflow-y-auto`.
* **Impact**: Creates a frustrating "nested-scroll trap". Users scroll down the page to reach controls, but their thumb gets caught scrolling the internal `<aside>` container instead of the page.
* **Recommended Fix**: Redesign the mobile editor with a **Mobile Bottom Action Bar + Slide-Up Bottom Sheet Drawer**:
  - Keep the canvas centered and locked in the primary mobile viewport.
  - Render a sticky bottom action bar with 4 primary touch pills:
    1. **Replace Photo** (direct file trigger)
    2. **Crop & Fit** (opens cropper)
    3. **Adjust Slot** (opens slot geometry nudge controls)
    4. **Template Slots** (quick slot switcher)
  - Secondary controls (rotation slider, nudge buttons, slot list) live inside a smooth, swipeable bottom drawer that slides up on demand.

#### Issue 3: Showcase Reveal Slider Intercepts Vertical Page Scrolling (`touch-none`)
* **Location**: [`components/ShowcaseReveal.tsx:197`](file:///d:/temptree/components/ShowcaseReveal.tsx#L197)
* **Finding**: The image reveal slider has `touch-none` across its entire container (`min-h-[420px]`).
* **Impact**: When mobile users swipe vertically with their finger touching anywhere inside this 420px tall block, standard page scrolling is blocked. Users get "stuck" on the page thinking the app has frozen.
* **Recommended Fix**: Change `touch-none` to `touch-pan-y`. Only the draggable center handle should capture horizontal touch gestures (`touch-none`), while vertical gestures allow normal page scrolling.

#### Issue 4: Header Actions Overflow on 375px–390px Viewports
* **Location**: [`app/editor/[templateId]/page.tsx:953-1025`](file:///d:/temptree/app/editor/%5BtemplateId%5D/page.tsx#L953-L1025)
* **Finding**: The top navigation bar packs: [Back link + "New Template"] + [Title + Subtitle] + ["Upload Photo"] + ["Export Story (PNG)"]. Total minimum horizontal width required exceeds 420px.
* **Impact**: On 375px/390px screens, the template name truncates to 2–3 letters or buttons wrap onto a second line, breaking the header height.
* **Recommended Fix**:
  - Collapse secondary labels on mobile: Show icon-only or shortened labels:
    - `"Export Story (PNG)"` &rarr; `<Download /> Export`
    - `"Upload Photo"` &rarr; `<Upload /> Photo`
  - Ensure all tap targets retain a minimum touch hit area of 44×44px.

#### Issue 5: Upload & Detection Results Render Below the Fold on Mobile
* **Location**: [`app/gallery/page.tsx:383`](file:///d:/temptree/app/gallery/page.tsx#L383)
* **Finding**: Form (left 5 cols) and Visual Review (right 7 cols) stack vertically on mobile. After clicking "Convert & Detect Slots", the review preview renders below the fold.
* **Impact**: Users on mobile see no immediate visual confirmation that slots were detected unless they manually scroll down 600px+.
* **Recommended Fix**: Automatically smooth-scroll to the preview section upon successful conversion, or introduce a 2-step mobile wizard tab: `[1. Upload Frame]` &rarr; `[2. Review & Edit]`.

#### Issue 6: Touch Targets Below 44px Minimum (Apple HIG & WCAG Compliance)
* **Findings Across Codebase**:
  - Slot nudge buttons in editor: `px-1.5 py-0.5 text-[10px]` (~22px tap area)
  - Zoom in/out buttons in editor: `p-1.5` (~26px tap area)
  - Swap/Crop buttons in slot list: `px-2 py-1 text-[11px]` (~28px tap area)
* **Impact**: High miss-tap rate when using thumbs on real mobile devices.
* **Recommended Fix**: Pad interactive targets to at least 44×44px bounding boxes using transparent padding or `touch-manipulation` hit areas without altering visual typography.

#### Issue 7: Mobile Navigation Drawer in Navbar
* **Location**: [`components/Navbar.tsx:87`](file:///d:/temptree/components/Navbar.tsx#L87)
* **Finding**: `hidden lg:flex` hides all navigation links (`How It Works`, `Showcase`, `Features`, `Templates`, `FAQ`) on mobile devices, leaving only the "Upload & Edit" button.
* **Recommended Fix**: Add a sleek mobile hamburger toggle with an animated sliding overlay menu reflecting the brand's aesthetic (warm charcoal background, peach pink accents, Playfair serif links).

---

## Prioritized Implementation Roadmap

### Phase 1: High Priority (Quick-Win Layout & Usability Fixes)
1. **Dynamic Canvas Auto-Scaling**: Ensure Fabric.js canvas dynamically fits 100% within mobile viewport width on mount and resize.
2. **Touch-Scroll Fix in Showcase Reveal**: Fix `touch-none` to allow vertical scrolling over the interactive comparison slider.
3. **Editor Header Mobile Responsive Layout**: Compact buttons and truncate titles cleanly for 375px/390px screens.
4. **44px Tap Target Optimization**: Expand touch-hit boundaries on slot adjusters, nudge arrows, and buttons.

### Phase 2: Medium Priority (Mobile Background & Architecture)
5. **Botanical SVG & Ambient Glow Background**: Implement the vector background pattern across post-hero homepage, `/gallery`, and editor.
6. **Mobile Hero Adaptation**: Condense hero scroll container on mobile, replacing the heavy 300-frame loop with a lightweight single-frame + floating petals implementation.
7. **Upload/Gallery Step Transition**: Add auto-scroll or step navigation on mobile so users immediately see their detected slots.

### Phase 3: Mobile Polish & Delight
8. **Mobile Editor Bottom Drawer**: Transition the editor sidebar on mobile into a floating bottom sheet / action dock.
9. **Mobile Hamburger Menu**: Add a mobile drawer in `Navbar.tsx` for quick section jumping.
10. **iOS Safe Area Support**: Add `safe-area-inset-bottom` padding to mobile sticky toolbars and modals.
