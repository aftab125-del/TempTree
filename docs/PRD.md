# TempTree — Product Requirements Document

## 1. Overview
TempTree is a website where users browse aesthetic templates for Instagram Stories (Y2K, Minimal, Dreamy, Vintage, Bold, and more) and customize them in an in-browser editor before exporting a ready-to-post image.

## 2. Problem
Creating aesthetically consistent Instagram Stories is time-consuming for casual users. Existing tools (Canva, CapCut templates) are either generic, cluttered, or not focused specifically on the "aesthetic template" niche. TempTree focuses purely on this niche with a curated, visually distinctive experience.

## 3. Goals
- Let users discover templates fast, filtered by aesthetic category
- Let users personalize a template (text, photo, colors) without needing design skill
- Export a final image ready to post directly to Instagram Stories (1080×1920)
- Make the site itself feel like a piece of the aesthetic it's selling (the sakura scroll hero, brand palette, etc.)

## 4. Target Audience
Casual, everyday users making Instagram Stories for fun (not primarily content creators or brands). Templates and copy should stay approachable and low-effort rather than assuming professional design intent.

## 5. Core Features (v1)

### 5.1 Landing / Hero
- Sakura scroll-scrubbing animation (300 frames, descending drone shot through petals into a full orbit around a blooming sakura tree)
- Brand wordmark + tagline reveal, category names reveal mid-scroll
- Transitions into template gallery preview

### 5.2 Gallery
- Grid of templates, filterable by category (Y2K, Minimal, Dreamy, Vintage, Bold — expandable)
- Each template shows a live-rendered thumbnail preview (not a static image) so it matches what the editor will produce

### 5.3 Editor
- Load a template's layout onto a canvas (1080×1920 — Instagram Story ratio)
- Edit text content inline
- Replace image placeholders with user's own uploaded photo
- Adjust background color/gradient
- Export final result as PNG at full resolution

## 6. Out of Scope (v1)
- User accounts / saved projects (TODO: decide if needed for v1 or later)
- Payment / monetization — site is fully free for now, no paid tiers in v1
- Multi-page templates (carousel posts) — Stories only for now

## 7. Success Criteria (draft)
- A user can go from landing page → chosen template → customized export in under 2 minutes
- Templates feel visually distinct per category (a Y2K template should not feel interchangeable with a Dreamy one)

## 8. Open Questions
- Whether accounts/saved history are needed in v1
- How many templates per category at launch
