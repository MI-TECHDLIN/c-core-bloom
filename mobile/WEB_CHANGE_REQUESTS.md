# Web Change Requests (Mobile App Parity & Robustness)

This document tracks identified issues or recommendations in the web codebase that would benefit both web and mobile, but are deferred from direct modification under Golden Rule 1 ("Do NOT edit, move, rename, reformat, or delete any existing web app file").

---

## Request 1: Exam Timer Interval Drift on Tab Switch / Backgrounding

- **Affected File**: `src/components/TestTimer.tsx` (lines 30–52)
- **Observed Behavior**:
  The web component decrements remaining time via `setInterval(() => setTimeLeft(prev => prev - 1), 1000)`. When a browser tab or mobile webview is backgrounded or minimized, JavaScript timers are throttled or frozen by modern browsers/OS engines (Chrome, Safari, Android WebView).
  When returning to the app after several minutes, the exam timer has only decremented for active foreground ticks, resulting in timer drift and the potential to bypass exam time limits.
- **Mobile Mitigation**:
  Added mobile override in `mobile/src/overrides/TestTimer.tsx` that re-calculates remaining time against `Date.now() - startTime` on every interval tick and immediately on `visibilitychange` (`document.visibilityState === 'visible'`) and window `focus`.
- **Suggested Patch for Web**:
  ```tsx
  // In src/components/TestTimer.tsx:
  useEffect(() => {
    const syncTime = () => {
      if (startTime) {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const rem = Math.max(0, durationMinutes * 60 - elapsed);
        setTimeLeft(rem);
      }
    };
    const interval = setInterval(syncTime, 1000);
    window.addEventListener('focus', syncTime);
    document.addEventListener('visibilitychange', syncTime);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', syncTime);
      document.removeEventListener('visibilitychange', syncTime);
    };
  }, [startTime, durationMinutes]);
  ```

---

## Request 2: Supabase Session Storage Adapter for Native Preferences

- **Affected File**: `src/integrations/supabase/client.ts`
- **Observed Behavior**:
  The web client initializes `brokeredPreviewStorage()` which falls back to `localStorage`. In native mobile contexts, `localStorage` can be cleared by the OS during memory pressure or system cleanup.
- **Mobile Mitigation**:
  Can provide an override via `@/integrations/supabase/client` or custom storage adapter in Phase 3.
