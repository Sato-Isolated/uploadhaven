import { useState, useEffect } from 'react';

/**
 * Keyboard layout detection and key mapping utilities
 */

export interface KeyboardShortcuts {
  playPause: string;
  mute: string;
  fullscreen: string;
  volumeUp: string;
  volumeDown: string;
  seekForward: string;
  seekBackward: string;
  restart: string;
}

export interface KeyboardLayoutInfo {
  layout: 'qwerty' | 'azerty' | 'qwertz' | 'unknown';
  shortcuts: KeyboardShortcuts;
  confidence: number;
  detectionMethod: 'keyboard-api' | 'key-testing' | 'language-fallback';
}

// Define shortcuts for different layouts
const LAYOUT_SHORTCUTS: Record<string, KeyboardShortcuts> = {
  qwerty: {
    playPause: 'Space / K',
    mute: 'M',
    fullscreen: 'F',
    volumeUp: '↑',
    volumeDown: '↓',
    seekForward: '→ / L',
    seekBackward: '← / J',
    restart: 'R',
  },
  azerty: {
    playPause: 'Espace / K',
    mute: ',',
    fullscreen: 'F',
    volumeUp: '↑',
    volumeDown: '↓',
    seekForward: '→ / L',
    seekBackward: '← / J',
    restart: 'R',
  },
  qwertz: {
    playPause: 'Leertaste / K',
    mute: 'M',
    fullscreen: 'F',
    volumeUp: '↑',
    volumeDown: '↓',
    seekForward: '→ / L',
    seekBackward: '← / J',
    restart: 'R',
  },
};

// Key codes to test for layout detection
const DETECTION_KEYS: Record<string, Record<string, string>> = {
  // AZERTY: Q and A are swapped
  KeyQ: { qwerty: 'q', azerty: 'a', qwertz: 'q' },
  KeyA: { qwerty: 'a', azerty: 'q', qwertz: 'a' },
  // QWERTZ: Y and Z are swapped
  KeyY: { qwerty: 'y', azerty: 'y', qwertz: 'z' },
  KeyZ: { qwerty: 'z', azerty: 'z', qwertz: 'y' },
  // Additional AZERTY detection: M produces comma
  KeyM: { qwerty: 'm', azerty: ',', qwertz: 'm' },
  // AZERTY: W produces Z
  KeyW: { qwerty: 'w', azerty: 'z', qwertz: 'w' },
};

export function useKeyboardLayoutDetection(): KeyboardLayoutInfo {
  const [layoutInfo, setLayoutInfo] = useState<KeyboardLayoutInfo>({
    layout: 'unknown',
    shortcuts: LAYOUT_SHORTCUTS.qwerty,
    confidence: 0,
    detectionMethod: 'language-fallback',
  });

  useEffect(() => {
    const detectionResults: Record<string, number> = {
      qwerty: 0,
      azerty: 0,
      qwertz: 0,
    };

    // Method 1: Use Keyboard API (most accurate)
    const detectWithKeyboardAPI = async (): Promise<boolean> => {
      // Check if Keyboard API is available
      if (!('keyboard' in navigator) || !(navigator as any).keyboard) {
        return false;
      }

      try {
        // Get the keyboard layout map
        const layoutMap = await (navigator as any).keyboard.getLayoutMap();

        const layoutScores = { qwerty: 0, azerty: 0, qwertz: 0 };

        // Test key mappings against known layouts
        Object.entries(DETECTION_KEYS).forEach(([keyCode, expectedValues]) => {
          const actualValue = layoutMap.get(keyCode);
          if (actualValue) {
            Object.entries(expectedValues).forEach(([layout, expected]) => {
              if (actualValue.toLowerCase() === expected.toLowerCase()) {
                layoutScores[layout as keyof typeof layoutScores] += 1;
              }
            });
          }
        }); // Find the layout with the highest score
        const detectedLayout = Object.entries(layoutScores).reduce((a, b) =>
          a[1] > b[1] ? a : b
        )[0] as 'qwerty' | 'azerty' | 'qwertz';

        const totalTests = Object.keys(DETECTION_KEYS).length;
        const confidence = layoutScores[detectedLayout] / totalTests;

        setLayoutInfo({
          layout: detectedLayout,
          shortcuts: LAYOUT_SHORTCUTS[detectedLayout],
          confidence,
          detectionMethod: 'keyboard-api',
        });

        return true;
      } catch (error) {
        console.warn('Keyboard API detection failed:', error);
        return false;
      }
    };

    // Method 2: Real-time key testing (fallback)
    const setupKeyTesting = () => {
      const handleKeyDown = (event: KeyboardEvent) => {
        // Only test during normal typing, not shortcuts
        if (event.ctrlKey || event.altKey || event.metaKey || event.shiftKey)
          return;

        const expectedKeys = DETECTION_KEYS[event.code];
        if (!expectedKeys) return; // Compare actual key with expected keys for each layout
        Object.entries(expectedKeys).forEach(([layout, expectedKey]) => {
          if (
            event.key.toLowerCase() === (expectedKey as string).toLowerCase()
          ) {
            detectionResults[layout] += 1;
          }
        });

        // Update detection after collecting enough data
        const totalTests = Object.values(detectionResults).reduce(
          (a, b) => a + b,
          0
        );
        if (totalTests >= 3) {
          const bestMatch = Object.entries(detectionResults).reduce((a, b) =>
            a[1] > b[1] ? a : b
          );

          const confidence = totalTests > 0 ? bestMatch[1] / totalTests : 0;
          const layout =
            confidence > 0.4
              ? (bestMatch[0] as 'qwerty' | 'azerty' | 'qwertz')
              : 'qwerty';

          setLayoutInfo({
            layout,
            shortcuts: LAYOUT_SHORTCUTS[layout],
            confidence,
            detectionMethod: 'key-testing',
          });
        }
      };

      window.addEventListener('keydown', handleKeyDown);

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }; // Method 3: Language-based fallback (least accurate)
    const detectFromLanguage = () => {
      const language = navigator.language.toLowerCase();
      let layout: 'qwerty' | 'azerty' | 'qwertz' = 'qwerty';
      const confidence = 0.3; // Low confidence for language-based detection

      if (language.startsWith('fr') || language.includes('be')) {
        layout = 'azerty';
      } else if (
        language.startsWith('de') ||
        language.startsWith('at') ||
        language.includes('ch') ||
        language.startsWith('li')
      ) {
        layout = 'qwertz';
      }

      setLayoutInfo({
        layout,
        shortcuts: LAYOUT_SHORTCUTS[layout],
        confidence,
        detectionMethod: 'language-fallback',
      });
    };

    // Execute detection methods in order of accuracy
    const runDetection = async () => {
      // Try Keyboard API first
      const keyboardAPISuccess = await detectWithKeyboardAPI();

      if (!keyboardAPISuccess) {
        // Fall back to language detection
        detectFromLanguage();

        // Set up real-time key testing for future improvement
        return setupKeyTesting();
      }

      return () => {}; // No cleanup needed if Keyboard API worked
    };

    const cleanup = runDetection();

    return () => {
      cleanup.then((cleanupFn) => cleanupFn?.());
    };
  }, []);

  return layoutInfo;
}

