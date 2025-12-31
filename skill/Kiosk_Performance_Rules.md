# Kiosk Performance Optimization Skill

This skill guides the AI in optimizing the Kiosk application for fast startup and smooth runtime performance.

## Context
The application bundle is large (~2MB+ warnings), causing slow boot times. Animation smoothness is critical.

## Rules & Guidelines

### 1. Code Splitting
-   **Lazy Load Routes**: Use `React.lazy()` for all top-level pages (`pages/*`).
-   **Defer Heavy Libs**: Load `Three.js`, `TensorFlow`, or `MediaPipe` only when the specific feature (e.g., VR360, Camera) is mounted.

### 2. Asset Management
-   Convert large images to `WebP` or `AVIF`.
-   Preload critical assets (backgrounds) in `AttractionPage` but lazy load assets for deep pages.

### 3. React Optimization
-   Use `useMemo` and `useCallback` for functions passed to `CameraTracker` or other high-frequency event handlers.
-   Avoid re-renders on the root layout by isolating high-frequency state (like `faceProximity`) into leaf components or specialized context subscribers.

## Example Prompt
"Analyze `AppRoutes.tsx` and implement lazy loading for all routes. Configure Vite to split the vendor chunk separately."
