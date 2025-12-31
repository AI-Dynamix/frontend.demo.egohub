# Kiosk Security Audit Skill

This skill guides the AI in securing the Kiosk application configuration and data.

## Context
Client-side apps are vulnerable to key extraction. Kiosks are physically accessible.

## Rules & Guidelines

### 1. API Key Protection
-   **No Hardcoded Keys**: Remove any keys starting with `AIza`, `sk-`, etc. from the source.
-   **Environment Variables**: All sensitive configs must come from `import.meta.env`.
-   **Proxy**: Recommend moving direct external calls to a thin backend proxy to hide keys.

### 2. Kiosk Mode Policies
-   Disable right-click, text selection, and keyboard shortcuts (DevTools, Refresh) in Production build.
-   Ensure `ErrorBoundary` catches all crashes and redirects to a safe "Maintenance" screen to prevent revealing OS desktop.

## Example Prompt
"Audit `src/services` for any hardcoded API keys and refactor them to use environment variables. Implement a global event listener to block right-click context menu."
