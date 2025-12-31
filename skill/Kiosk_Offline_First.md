# Kiosk Offline-First Strategy Skill

This skill guides the AI in making the Kiosk application resilient to network failures.

## Context
Kiosk devices may lose internet connection. The app must degrade gracefully rather than crashing or showing blank screens.

## Rules & Guidelines

### 1. PWA & Caching
-   Configure `vite-plugin-pwa`.
-   **Cache Strategy**: `StaleWhileRevalidate` for assets, `NetworkFirst` for dynamic API data.

### 2. Fallback Logic
-   **AI Fallback**: If Gemini/OpenAI is unreachable, fallback to local rule-based responses.
-   **TTS Fallback**: If Azure TTS fails, use Web Speech API (browser native) or show text bubbles.
-   **Asset Fallback**: Always ship default "placeholder" images in the bundle for when remote images fail to load.

### 3. Heartbeat & Retry
-   Implement exponential backoff for failed API requests.
-   Queue non-critical analytics/logs in `localStorage` and sync when online.

## Example Prompt
"Implement a `useTTS` hook that attempts to call Azure TTS first, and falls back to `window.speechSynthesis` if the request fails or times out."
