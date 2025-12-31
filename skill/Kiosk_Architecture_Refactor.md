# Kiosk Architecture Refactoring Skill

This skill guides the AI in refactoring the Kiosk application towards a modular, Feature-Sliced Design (FSD) inspired architecture.

## Context
The current application uses a flat structure (`src/components`, `src/pages`) which couples logic and UI, making maintenance difficult as the app scales.

## Rules & Guidelines

### 1. Folder Structure
-   **Adopt Feature-based Structure**:
    ```text
    src/
      features/           # Business logic & Domain features
        welcome/          # Welcome screen logic
        attraction/       # Attraction/Idle logic
        face-detection/   # Camera & AI logic
        settings/         # Kiosk settings
      components/
        ui/               # Generic, reusable UI (Buttons, Cards) - NO business logic
        layouts/          # App layouts
      hooks/              # Global shared hooks
      services/           # API & External integrations
      stores/             # Global Zoning state
    ```

### 2. Component Separation
-   **Smart vs Dumb**:
    -   `features/*`: "Smart" components connected to stores/API.
    -   `components/ui/*`: "Dumb" components triggered by props only.
-   **Colocation**: Keep styles, tests, and types close to the component.

### 5. Common UI Primitives (MANDATORY)
-   **Do NOT write raw Tailwind for Buttons/Cards**. Use:
    -   `KioskButton` for all interactive elements.
    -   `GlassCard` for containers with backdrop blur.
    -   `KioskText` for standardized typography.
-   **Path**: `src/components/common/*`

### 3. State Management
-   Split the giant `sessionStore` into smaller slices if needed.
-   Use `zustand` selectors to prevent unnecessary re-renders.

### 4. Logic Extraction
-   Move heavy logic (like `useEffect` with timers or complex API calls) out of `.tsx` files into custom hooks (e.g., `useAttractionLogic`).

## Example Prompt
"Refactor `GreetingFlow.tsx` by moving the business logic into `src/features/greeting/useGreeting.ts` and keeping the UI in `src/features/greeting/GreetingView.tsx`."
