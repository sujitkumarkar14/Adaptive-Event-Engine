# Design System Strategy: The Stark Architect

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Stark Architect."** 

In an era of digital bloat and soft, rounded interfaces, this system takes a stance of absolute precision and functional brutalism. It is designed for high-performance utility under the harshest conditions—blinding sunlight, low-bandwidth environments, and high-pressure workflows. We move away from the "template" look by leaning into Swiss-inspired editorial layouts: extreme white space, a strict 90-degree geometry, and a high-contrast visual rhythm. 

By eliminating shadows, gradients, and radiuses, we don't just optimize for performance; we create a signature aesthetic of "Hyper-Clarity." The layout breaks the traditional grid through intentional asymmetry—placing weight in the margins and using structural lines to guide the eye, rather than decorative containers.

## 2. Colors & Structural Framing
This system utilizes a high-contrast palette to ensure readability at 100% brightness and visibility in monochrome-like conditions.

*   **Primary Action (#1A73E8):** Reserved exclusively for terminal actions. It is the "Light in the Dark."
*   **Surface Hierarchy:** We utilize the `surface-container` tiers to create logical zones. 
    *   `surface` (#faf9fd) is our base canvas.
    *   `surface-container-low` (#f4f3f7) defines secondary utility areas.
    *   `surface-container-highest` (#e3e2e6) is used for active, high-priority states.

### The "Architectural Line" Rule
While traditional UI uses borders to "box things in," this system uses lines to "frame the flow." We prohibit the use of generic 1px boxes around every element. Instead, use the `outline` (#727785) or `outline-variant` (#c1c6d6) tokens to create vertical or horizontal axes that anchor the typography. 

### Surface Nesting
Instead of shadows, depth is achieved through **Tonal Stepping**. An input field doesn't "float"; it is "carved" into the interface by using `surface-container-lowest` (#ffffff) against a `surface-container-low` (#f4f3f7) background.

## 3. Typography: The Editorial Voice
We use **Inter** (system-default sans-serif) as a tool of precision. The hierarchy is designed to be scanned at a distance.

*   **Display & Headline Scale:** Large, bold, and unapologetic. `display-lg` (3.5rem) should be used with tight letter-spacing to create a "header" that feels like a masthead.
*   **The Power of Labels:** `label-md` and `label-sm` are not just for captions; they are used in all-caps with increased letter-spacing to denote categories, creating an authoritative, technical feel.
*   **Body Text:** `body-lg` (1rem) is optimized for long-form legibility with a generous line-height to ensure that even on low-resolution screens, the "Zero Bloat" philosophy allows the text to breathe.

## 4. Elevation & Depth: Zero-Shadow Logic
In this design system, "Up" does not mean "Shadowed." We convey hierarchy through **Contrast and Line Weight.**

*   **The Layering Principle:** To elevate a component, increase its contrast against the background. A "floating" modal is simply a `surface-container-lowest` (#ffffff) block with a high-contrast `outline` (#727785) 1px border. No blurs, no offsets.
*   **The "Ghost Border" Fallback:** For secondary elements, use the `outline-variant` at 20% opacity. This creates a "suggestion" of a container without adding visual noise.
*   **Interaction States:** Since we do not use shadows, "Hover" and "Pressed" states must be represented by immediate color inversions. A button shifts from `primary` (#005bbf) to `on-primary-fixed-variant` (#004493) to provide instant tactile feedback.

## 5. Components

### Buttons: The Kinetic Block
*   **Primary:** Sharp 0px corners, `#1A73E8` background, `#FFFFFF` text. No gradients.
*   **Secondary:** 1px `outline` border, no background fill.
*   **Tertiary:** Text-only, bold `label-md` styling, reserved for low-priority navigation.

### Input Fields: The Carved Slot
*   Inputs must never have rounded corners. 
*   Use a `surface-container-lowest` (#ffffff) fill with a 1px `outline-variant` bottom border by default. 
*   On focus, the bottom border shifts to 2px `primary` (#1A73E8).

### Cards & Lists: The Infinite Grid
*   **No Dividers:** Prohibit the use of horizontal rules between list items. 
*   **Spacing as Separation:** Use the `body-lg` line-height and `surface-container` shifts to separate items. 
*   **The "Stark" Card:** A card is simply a layout of text with a heavy 2px left-side border (`primary`) to denote importance, rather than an enclosed box.

### Chips: The Technical Tag
*   Rectangular, tight padding, using `surface-container-high`. Used for filtering without the visual weight of a button.

## 6. Do's and Don'ts

### Do:
*   **Embrace the 0px:** Every element must have sharp, 90-degree corners. This communicates efficiency and technical rigor.
*   **Use Asymmetric Margins:** Push content to the edges or create wide gutters to make the mobile experience feel like a premium printed manual.
*   **Prioritize High Contrast:** Ensure `on-surface` text (#1a1b1e) is always against a high-value background to combat sunlight glare.

### Don't:
*   **Never use a Border-Radius:** Even a 2px radius breaks the "Stark Architect" logic.
*   **Avoid Shadows and Blurs:** These are "bloat" that require GPU cycles and soften the intentionality of the design.
*   **No Center-Alignment:** For an editorial look, stick to strong left-aligned axes. Center-alignment is for templates; left-alignment is for systems.
*   **No Decorative Icons:** Icons must be flat and purely functional. If an icon doesn't add immediate clarity to the action, remove it.