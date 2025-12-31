# Kiosk Grid System Skill

This skill guides the AI in designing and implementing UI using the Kiosk's strict 30px grid system.

## The Grid Standard
The standard layout is based on a **1920x1080** touchscreen divided into **30px** square units.

-   **Base Unit**: `1u = 30px`
-   **Screen Width**: `64u` (1920px)
-   **Screen Height**: `36u` (1080px)

## Rules & Guidelines

### 1. Sizing
-   All component dimensions (width, height) MUST be multiples of `30px`.
-   **Margins/Padding**: Should also follow the unit (e.g., `30px` gap, `15px` padding is allowed as 0.5u but prefer full units for layout blocks).

### 2. Positioning
-   Components should snap to the grid lines.
-   Avoid "magic numbers" like `top-[123px]`. Use `top-[120px]` (4u) or `top-[150px]` (5u).

### 3. Implementation (Tailwind)
-   Since Tailwind's default spacing scale (`4` = `1rem` = `16px`) does not align with 30px, prefer using explicit pixels (JIT) or define a custom theme config if requested.
-   **Example**:
    -   `w-[300px]` (10u) -> ✅ Correct
    -   `w-[320px]` -> ❌ Incorrect (Not divisible by 30)
    
### 4. Component Mapping
When defining a new component lay out, think in "Cells":
-   **Toolbar**: `64u x 3u` (1920x90)
-   **Sidebar**: `10u x 33u` (300x990)
-   **Main Content**: `54u x 33u`

## Example Prompt
"Create a sidebar component that occupies the left 10 units (300px) and full height minus header (33 units / 990px). Use the glass card style."
