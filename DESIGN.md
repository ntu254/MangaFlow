# MangaFlow — Design System & UI/UX Architecture

> **MangaFlow Design Philosophy**: A high-density, modern editorial operating system for mangakas, editors, assistants, and board members. Combines the elegance of luxury editorial publishing with high-performance operational workbenches.

---

## 🎨 Visual Identity & Core Aesthetic

### 1. Modern Editorial Glassmorphic Stance
- **Surfaces**: Semi-transparent card layers (`bg-card/80` or `bg-card/60`) paired with subtle backdrop blur (`backdrop-blur-md` / `backdrop-blur-xs`) and fine neutral borders (`border-border/80`).
- **Depth & Shadows**: Subtly elevated cards using micro-shadows (`shadow-xs`, `shadow-2xs`) avoiding heavy blur shadows.
- **Card Hierarchy**:
  - Top Level Outer Container: `rounded-2xl border border-border/80 bg-card/80 shadow-xs backdrop-blur-md`
  - Inner Section Card: `rounded-2xl border border-border/80 bg-card/60 p-5 shadow-2xs backdrop-blur-xs`
  - Inner Sub-item / Input Box: `rounded-xl border border-border/60 bg-background/50 p-3.5`
  - Interactive Action Pill / Badge: `rounded-lg` or `rounded-full`

---

## 📐 Layout Architecture

### 1. Asymmetric 2-Column Operational Workbench (`7:5` / `8:4` Split)
Used across proposal creation (`/app/proposals/new`), submission review, and series management.
- **Left Column (Primary Form / Editing Surface — 7 to 8 cols)**:
  - Focused form inputs, multi-step stepper, rich text areas, file upload dropzones.
  - Generous internal padding (`p-6 md:p-8`), organized section headers with icon chips.
- **Right Column (Live Preview & Action Control Sidebar — 4 to 5 cols)**:
  - Sticky positioning (`lg:sticky lg:top-6 lg:self-start`).
  - **Live Pitch Preview Card**: Displays series cover, live title, logline, genre tags, target audience, and planned chapter badges.
  - **Header Preview Action**: `Full Preview` button with icon (`Eye`) triggering full-screen pitch presentation modal.
  - **Readiness Checklist**: Real-time step completion indicators with glowing emerald check icons (`CheckCircle2`).
  - **Action Navigation Bar**: Sticky bottom controls for `Back`, `Continue`, `Save draft`, and `Submit to editor`.

---

## 🔤 Typography & Font Hierarchy

| Role | Font Family | Style / Weight | Usage Examples |
| :--- | :--- | :--- | :--- |
| **Display / Titles** | EB Garamond (`font-serif`) | Bold, Normal (24px - 32px) | Series titles, Executive dossiers, Hero headers |
| **Section Titles** | Instrument Sans / Inter | Bold (`font-bold`, 14px - 16px) | Form section titles, card headers |
| **Micro-labels** | Instrument Sans / Inter | Bold, Uppercase (`text-[10px] uppercase tracking-wider text-muted-foreground`) | Input field labels, badge headers, status captions |
| **Body & Inputs** | Instrument Sans / Inter | Medium / Regular (12px - 14px) | Form textareas, synopses, character descriptions |

---

## 🎨 Color Palette & Status Tokens

### 1. Brand & Semantic Tokens
- **Primary Accent (`primary`)**: Deep indigo/violet brand accent for primary CTAs, active step indicators, and brand badges (`bg-primary/10 text-primary border-primary/20`).
- **High-Trust Emerald (`emerald`)**: Verification, copyright attestation, and upload success (`border-emerald-500/30 bg-emerald-500/10 text-emerald-600`).
- **Warning & Attention (`amber`)**: Missing required files, action items needed before submission (`border-amber-500/30 bg-amber-500/10 text-amber-700`).
- **Destructive / Error (`rose`)**: Deletion, file size limit errors, missing upload warnings (`text-rose-500`, `border-rose-500/30 bg-rose-500/10`).

---

## 🧩 Key Component Specifications

### 1. Smart Auto-Titling File Uploaders (`ManuscriptUploader` & `MaterialsUploader`)
- **Seamless Drag & Drop**: Visual dropzone with file type icons (`FileText` for PDF, `FileArchive` for ZIP, `ImageIcon` for PNG/JPG).
- **Auto-Titling**: Automatically derives material title from uploaded filename (e.g., `Storyboard_Ch1.pdf`) if left blank, avoiding "title required" friction.
- **Uploaded File Card**: Displays file icon, filename, size in MB, `CheckCircle2` badge, **View (`Eye`)** preview trigger, **Replace** button, and **Delete (`X`)** button.

### 2. Instant File Preview Modal (`FilePreviewModal`)
- Triggered by clicking **View (`Eye`)** on any uploaded manuscript, storyboard, or reference file.
- **PDF Files**: Embedded interactive iframe reader (`<iframe src={url} />`) + "Open in new tab" link.
- **Images**: Responsive centered image viewer with zoom capability.
- **Archives / ZIPs**: Informative card with direct secure download CTA.

### 3. High-Trust Legal & Rights Attestation Card
- Replaces raw checkboxes with an interactive trust card (`rounded-2xl border p-5`).
- Displays a `ShieldCheck` icon that glows emerald when activated (`border-emerald-500/40 bg-emerald-500/5 ring-1 ring-emerald-500/20`).

### 4. Executive Pitch Preview Sheet (`PitchPreviewModal`)
- Full-screen/modal presentation deck showing cover image, series metadata, pitch logline, full synopsis, character roster, and attached files.

---

## ✨ Micro-Interactions & UX Guidelines

1. **Hover State Feedback**: Buttons and cards transition smoothly (`transition-all duration-200 hover:border-primary/40`).
2. **Form Accessibility & Feedback**: Form fields include real-time character counters (`0/1000`) and clear micro-copy placeholders.
3. **No Decorative Clutter**: Every element serves an operational purpose. Colors are reserved for status, focus, and primary CTA emphasis.
