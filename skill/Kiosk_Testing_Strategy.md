# Kiosk Testing Strategy Skill

This skill guides the AI in setting up and writing tests for the Kiosk application to ensure stability.

## Context
The application lacks automated testing. Deployment to remote kiosks carries high risk of regression.

## Rules & Guidelines

### 1. Technology Stack
-   **Unit Testing**: `Vitest` (fast, Vite-native).
-   **Component Testing**: `React Testing Library`.
-   **E2E Testing**: `Playwright` (reliable, handles browser APIs well).

### 2. Testing Priorities
1.  **Critical Flows** (E2E):
    -   Boot -> Attraction -> Face Detect -> Greeting -> Home.
    -   Timeouts and auto-reset logic.
2.  **Complex Logic** (Unit):
    -   `kioskSettings` state transitions.
    -   Timeout hook logic (`useIdleTimer`).

### 3. Mocking
-   **Hardware**: Mock `CameraTracker` input for tests (inject fake video stream or events).
-   **AI Services**: Mock `useFaceDetection` hooks to simulate user presence/absence without real camera.

## Example Prompt
"Setup Vitest for the project and write a unit test for `useIdleTimer` ensuring it calls `onIdle` after the specified duration."
