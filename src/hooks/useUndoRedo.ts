import { useState, useCallback } from 'react'

interface UseUndoRedoReturn<T> {
  current: T
  set: (value: T) => void
  push: (value: T) => void
  undo: () => void
  redo: () => void
  reset: (initialValue: T) => void
  canUndo: boolean
  canRedo: boolean
  historyLength: number
}

export function useUndoRedo<T>(initialValue: T): UseUndoRedoReturn<T> {
  const [history, setHistory] = useState<T[]>([initialValue])
  const [currentIndex, setCurrentIndex] = useState(0)

  const current = history[currentIndex]

  const push = useCallback((value: T) => {
    setHistory(prev => {
      // Remove any future states if we're not at the end
      const newHistory = prev.slice(0, currentIndex + 1)
      return [...newHistory, value]
    })
    setCurrentIndex(prev => prev + 1)
  }, [currentIndex])

  const set = useCallback((value: T) => {
    // Replace current value without adding to history
    setHistory(prev => {
      const newHistory = [...prev]
      newHistory[currentIndex] = value
      return newHistory
    })
  }, [currentIndex])

  const undo = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
    }
  }, [currentIndex])

  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(prev => prev + 1)
    }
  }, [currentIndex, history.length])

  const reset = useCallback((initialValue: T) => {
    setHistory([initialValue])
    setCurrentIndex(0)
  }, [])

  return {
    current,
    set,
    push,
    undo,
    redo,
    reset,
    canUndo: currentIndex > 0,
    canRedo: currentIndex < history.length - 1,
    historyLength: history.length
  }
}
