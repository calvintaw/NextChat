"use client"
import { useCallback, useEffect, useState } from "react"

export function useLocalStorage(key, defaultValue) {
  if (typeof window === "undefined") return [defaultValue, () => {}] // prevent SSR issues

  return useStorage(key, defaultValue, window.localStorage)
}

export function useSessionStorage(key, defaultValue) {
  if (typeof window === "undefined") return [defaultValue, () => { }]

  return useStorage(key, defaultValue, window.sessionStorage)
}

function useStorage(key, defaultValue, storageObject) {
  const [value, setValue] = useState(() => {
    try {
      const jsonValue = storageObject.getItem(key)
      if (jsonValue != null) return JSON.parse(jsonValue)
      return typeof defaultValue === "function" ? defaultValue() : defaultValue
    } catch {
      return defaultValue
    }
  })

  useEffect(() => {
    if (value === undefined) {
      storageObject.removeItem(key)
      return
    }
    storageObject.setItem(key, JSON.stringify(value))
  }, [key, value, storageObject])

  const remove = useCallback(() => {
    setValue(undefined)
  }, [])

  return [value, setValue, remove]
}
