import { useEffect, useCallback } from 'react'

interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  action: () => void
  preventDefault?: boolean
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean
}

export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  options: UseKeyboardShortcutsOptions = {}
) {
  const { enabled = true } = options

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return
    
    // Don't trigger shortcuts when typing in inputs
    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return
    }

    for (const shortcut of shortcuts) {
      const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase()
      const ctrlMatch = shortcut.ctrlKey ? (e.ctrlKey || e.metaKey) : !(e.ctrlKey || e.metaKey)
      const shiftMatch = shortcut.shiftKey ? e.shiftKey : !e.shiftKey
      const altMatch = shortcut.altKey ? e.altKey : !e.altKey

      if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
        if (shortcut.preventDefault !== false) {
          e.preventDefault()
        }
        shortcut.action()
        break
      }
    }
  }, [enabled, shortcuts])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

// Common shortcut presets
export const COMMON_SHORTCUTS = {
  undo: { key: 'z', ctrlKey: true },
  redo: { key: 'y', ctrlKey: true },
  redoAlt: { key: 'z', ctrlKey: true, shiftKey: true },
  copy: { key: 'c', ctrlKey: true },
  save: { key: 's', ctrlKey: true },
  delete: { key: 'Delete' },
  escape: { key: 'Escape' }
}
