"use client";

import { useState, useCallback, useEffect } from "react";

/**
 * Custom hook for managing localStorage operations with type safety and error handling.
 * Used across components that store user preferences, uploaded files list, etc.
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prevValue: T) => T)) => void, () => void] {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return defaultValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  });

  const setStoredValue = useCallback(
    (newValue: T | ((prevValue: T) => T)) => {
      try {
        const valueToStore =
          newValue instanceof Function ? newValue(value) : newValue;
        setValue(valueToStore);

        if (typeof window !== "undefined") {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, value]
  );

  const removeValue = useCallback(() => {
    try {
      setValue(defaultValue);
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, defaultValue]);

  // Listen for changes from other tabs
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setValue(JSON.parse(e.newValue));
        } catch (error) {
          console.warn(
            `Error parsing localStorage change for "${key}":`,
            error
          );
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [key]);

  return [value, setStoredValue, removeValue];
}

/**
 * Hook for managing uploaded files in localStorage
 */
export function useUploadedFiles() {
  return useLocalStorage<any[]>("uploadedFiles", []);
}

/**
 * Hook for managing user preferences in localStorage
 */
export function useUserPreferences() {
  return useLocalStorage("userPreferences", {
    theme: "system",
    defaultExpiration: "24h",
    showAnimations: true,
  });
}
