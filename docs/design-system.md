# Design System Document: The Executive Editorial

## 1. Overview & Creative North Star: "The Digital Architect"
This design system rejects the "templated" look of generic SaaS platforms in favor of a high-end, editorial aesthetic. Our Creative North Star is **"The Digital Architect."** 

Like modern architecture, the UI relies on structural integrity, intentional voids (white space), and the interplay of light and shadow. We move beyond "Modern Blue" by utilizing **Asymmetric Compositions** and **Tonal Depth**. By overlapping containers and utilizing a sophisticated typography scale, we transform a professional interface into a curated experience that feels both authoritative and breathable.

---

## 2. Colors: Tonal Sovereignty
This palette is not just a set of colors; it is a system of atmospheric depth. We prioritize the "Blue-Grey" spectrum to maintain a professional, high-trust environment.

### The "No-Line" Rule
**Borders are a design failure.** To achieve a premium feel, you are prohibited from using 1px solid borders to section off content. Boundaries must be defined exclusively through:
1.  **Background Shifts:** Place a `surface_container_low` element against a `surface` background.
2.  **Tonal Transitions:** Use a subtle shift from `surface_container` to `surface_container_high` to define edge logic.

### Surface Hierarchy & Nesting
Treat the mobile screen as a physical desk with stacked sheets of fine vellum.
*   **The Base Layer:** `surface` (#f7f9ff).
*   **The Content Blocks:** `surface_container_low` (#f1f4fa).
*   **The Elevated Cards:** `surface_container_lowest` (#ffffff).
*   **The Interactive Pops:** `primary_container` (#0056d2) for high-importance highlights.

### The "Glass & Gradient" Rule
To avoid a "flat" corporate feel, use **Glassmorphism** for floating headers or navigation bars. Use `surface_container_lowest` at 80% opacity with a 20px backdrop blur. 
*   **Signature Textures:** For primary CTAs, apply a linear gradient from `primary` (#0040a1) to `primary_container` (#0056d2) at a 135-degree angle. This adds a "soul" and luster that static hex codes cannot provide.

---

## 3. Typography: The Editorial Voice
We utilize a dual-sans-serif approach to create a distinction between "Content" and "Interface."

*   **Display & Headlines (Manrope):** This is our "Editorial" voice. Manrope’s geometric yet warm curves provide a contemporary edge. Use `display-lg` (3.5rem) with tight letter-spacing (-0.02em) for hero sections to create an impactful, magazine-like hierarchy.
*   **Body & Labels (Inter):** The "Workhorse." Inter is used for maximum legibility in dense data. 
*   **Hierarchy Note:** Use `title-lg` (Inter, 1.375rem) in semi-bold for section headers to ground the page, ensuring the user always knows their location within the architecture.

---

## 4. Elevation & Depth: Tonal Layering
Traditional drop shadows are often messy. In this design system, we use **Ambient Light** and **Tonal Stacking**.

*   **The Layering Principle:** Depth is achieved by stacking. An "Inner Card" should be `surface_container_lowest` sitting on an "Outer Wrapper" of `surface_container`. The contrast is felt, not seen.
*   **Ambient Shadows:** When an element must float (e.g., a FAB or a Modal), use a highly diffused shadow:
    *   *Y: 8px, Blur: 24px, Color:* `on_surface` (#181c20) at **4% opacity**.
    *   This mimics natural light rather than a digital effect.
*   **The "Ghost Border" Fallback:** If a layout requires a boundary for accessibility (e.g., a search input), use a **Ghost Border**: `outline_variant` (#c3c6d6) at **20% opacity**. Never use a 100% opaque stroke.

---

## 5. Components: Structural Primitives

### Buttons (The Kinetic Signature)
*   **Primary:** Gradient (Primary to Primary Container), `rounded-md` (0.75rem). Padding: `4` (1rem) vertical, `6` (1.5rem) horizontal.
*   **Secondary:** `surface_container_high` background with `primary` text. No border.
*   **Tertiary:** Ghost style. `primary` text, no background. High interaction states should trigger a subtle `surface_container_low` fill.

### Cards & Lists (The Flow)
*   **Cards:** Use `rounded-lg` (1rem) or `rounded-xl` (1.5rem). **Forbid the use of divider lines.** Separate list items using the Spacing Scale: `3` (0.75rem) or `4` (1rem) of vertical white space.
*   **Interactive Lists:** Use a subtle background change (`surface_container_highest`) on press rather than a checkbox where possible to keep the UI clean.

### Input Fields (The Foundation)
*   **Text Inputs:** Use `surface_container_low` as the field fill. `rounded-md` (0.75rem).
*   **Focus State:** Instead of a thick border, use a 2px "Glow" using the `primary` color at 30% opacity.

### Navigation (The Floating Dock)
*   Use a floating Tab Bar rather than a pinned bottom bar. Use `surface_container_lowest` with an 80% opacity backdrop blur and an ambient shadow. This creates a "layered" feel that allows the content to scroll "underneath" the navigation.

---

## 6. Do’s and Don’ts

### Do:
*   **Do** use intentional asymmetry. Align a headline to the left but offset the body text to the right by `8` (2rem) to create visual interest.
*   **Do** use `tertiary` (#822800) sparingly as an "Accent of Interest"—use it for notification dots or small high-priority labels to break the blue/gray monotony.
*   **Do** leverage the `rounded-full` token for status chips and tags to contrast against the more structured `rounded-md` containers.

### Don’t:
*   **Don’t** use pure black (#000000). Always use `on_background` (#181c20) for text to maintain a premium, ink-on-paper feel.
*   **Don’t** use dividers. If you feel the need for a line, try adding `6` (1.5rem) of empty space instead.
*   **Don’t** cram. If a screen feels full, move content to a secondary "nested" surface layer or a horizontal scroll carousel.
