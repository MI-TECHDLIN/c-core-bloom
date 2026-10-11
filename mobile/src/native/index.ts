const isExamPath = () => /\/test\//.test(window.location.pathname);

interface WakeLockSentinelLike {
  release: () => Promise<void>;
  addEventListener: (type: string, listener: () => void) => void;
}

let wakeLockSentinel: WakeLockSentinelLike | null = null;
let lastBackPressTime = 0;
let exitToastTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Screen Wake Lock Management
 * Ensures device screen stays awake during CBT exams so candidates are not interrupted.
 */
const requestScreenWakeLock = async () => {
  if (typeof navigator !== "undefined" && "wakeLock" in navigator && isExamPath()) {
    try {
      if (!wakeLockSentinel) {
        const nav = navigator as unknown as { wakeLock: { request: (type: string) => Promise<WakeLockSentinelLike> } };
        wakeLockSentinel = await nav.wakeLock.request("screen");
        wakeLockSentinel.addEventListener("release", () => {
          wakeLockSentinel = null;
        });
      }
    } catch {
      // Screen wake lock request may fail or be rejected by OS battery saver policy
    }
  }
};

const releaseScreenWakeLock = async () => {
  if (wakeLockSentinel) {
    try {
      await wakeLockSentinel.release();
    } catch {
      // Ignore
    } finally {
      wakeLockSentinel = null;
    }
  }
};

/**
 * Show a lightweight native-style exit warning toast
 */
const showExitToast = (message: string) => {
  const existing = document.getElementById("mobile-exit-toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.id = "mobile-exit-toast";
  toast.innerText = message;
  toast.style.position = "fixed";
  toast.style.bottom = "calc(var(--safe-area-bottom, 0px) + 24px)";
  toast.style.left = "50%";
  toast.style.transform = "translateX(-50%)";
  toast.style.backgroundColor = "rgba(15, 23, 42, 0.95)";
  toast.style.color = "#f8fafc";
  toast.style.padding = "8px 16px";
  toast.style.borderRadius = "20px";
  toast.style.fontSize = "13px";
  toast.style.fontWeight = "500";
  toast.style.zIndex = "99999";
  toast.style.boxShadow = "0 4px 12px rgba(0,0,0,0.4)";
  toast.style.pointerEvents = "none";
  toast.style.transition = "opacity 0.2s ease";

  document.body.appendChild(toast);

  if (exitToastTimer) clearTimeout(exitToastTimer);
  exitToastTimer = setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 200);
  }, 2000);
};

/**
 * Safe scroll focused input field into view when the mobile keyboard expands
 */
const safeScrollIntoView = (element: HTMLElement | null) => {
  if (!element) return;

  const rect = element.getBoundingClientRect();
  const isBelowViewport = rect.bottom > window.innerHeight - 140;
  const isAboveViewport = rect.top < 120;

  if (isBelowViewport || isAboveViewport) {
    element.scrollIntoView({ behavior: "smooth", block: "center" });
  }
};

/**
 * Close any active modal, sheet, dropdown, or popover
 */
const closeOpenOverlays = (): boolean => {
  const openOverlay = document.querySelector(
    '[role="dialog"], [role="alertdialog"], [data-state="open"][role="menu"], [data-state="open"][role="listbox"]'
  );

  if (openOverlay) {
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
    return true;
  }

  return false;
};

/**
 * Android Hardware Back Button Handling
 */
const handleBackButton = () => {
  // 1. Close open dialogs/sheets first
  if (closeOpenOverlays()) {
    return;
  }

  // 2. Exam protection: prevent accidental exit
  if (isExamPath()) {
    const shouldLeave = window.confirm(
      "You are currently taking an active exam. Are you sure you want to leave? Your exam will not be submitted."
    );
    if (!shouldLeave) return;
  }

  // 3. Double-back-to-exit on root paths
  const rootPaths = ["/", "/dashboard", "/admin", "/auth", "/super-admin"];
  const isRootScreen = rootPaths.includes(window.location.pathname) || window.history.length <= 1;

  if (isRootScreen) {
    const now = Date.now();
    if (now - lastBackPressTime < 2000) {
      // Exit or navigate to root
      if (window.history.length > 1) {
        window.history.back();
      }
    } else {
      lastBackPressTime = now;
      showExitToast("Press back again to exit");
    }
    return;
  }

  // Standard back navigation
  if (window.history.length > 1) {
    window.history.back();
  }
};

/**
 * Handle incoming deep links (e.g. auth callbacks, password reset tokens)
 */
const handleDeepLinkUrl = (urlStr: string) => {
  try {
    const parsed = new URL(urlStr);
    const targetPath = parsed.pathname + parsed.search + parsed.hash;
    if (targetPath && targetPath !== window.location.pathname) {
      window.history.pushState(null, "", targetPath);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  } catch {
    // URL parsing fallback
  }
};

export const initMobileShell = () => {
  // Setup CSS safe area environment variables
  document.documentElement.style.setProperty("--safe-area-top", "env(safe-area-inset-top, 0px)");
  document.documentElement.style.setProperty("--safe-area-right", "env(safe-area-inset-right, 0px)");
  document.documentElement.style.setProperty("--safe-area-bottom", "env(safe-area-inset-bottom, 0px)");
  document.documentElement.style.setProperty("--safe-area-left", "env(safe-area-inset-left, 0px)");

  // Sync theme-color for system chrome
  let metaTheme = document.querySelector('meta[name="theme-color"]');
  if (!metaTheme) {
    metaTheme = document.createElement("meta");
    metaTheme.setAttribute("name", "theme-color");
    document.head.appendChild(metaTheme);
  }
  metaTheme.setAttribute("content", "#020817");

  // Visual viewport height adjustment for on-screen keyboards
  const onResize = () => {
    const vh = window.visualViewport?.height ? `${window.visualViewport.height}px` : "100dvh";
    document.documentElement.style.setProperty("--app-height", vh);
  };

  onResize();
  window.addEventListener("resize", onResize);
  window.addEventListener("orientationchange", () => setTimeout(onResize, 50));
  window.visualViewport?.addEventListener("resize", onResize);

  // Keyboard scroll into view
  document.addEventListener("focusin", (event) => {
    const target = event.target as HTMLElement | null;
    if (target && target.tagName !== "BODY") {
      setTimeout(() => safeScrollIntoView(target), 100);
    }
  });

  // Manage Screen Wake Lock based on route navigation
  const checkWakeLockState = () => {
    if (isExamPath()) {
      requestScreenWakeLock();
    } else {
      releaseScreenWakeLock();
    }
  };

  checkWakeLockState();
  window.addEventListener("popstate", checkWakeLockState);

  // Back button protection during active exams
  window.addEventListener("popstate", (e) => {
    if (isExamPath()) {
      const shouldLeave = window.confirm(
        "You are currently taking an active exam. Are you sure you want to leave? Your exam will not be submitted."
      );
      if (!shouldLeave) {
        window.history.pushState(null, "", window.location.href);
      } else {
        releaseScreenWakeLock();
      }
    }
  });

  // Physical escape / back button listener
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      handleBackButton();
    }
  });

  // Lifecycle events: App backgrounding & foregrounding
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      document.body.classList.add("app-paused");
    } else {
      document.body.classList.remove("app-paused");
      // Restore wake lock if still on exam page
      if (isExamPath()) {
        requestScreenWakeLock();
      }
    }
  });

  // Deep links handler
  window.addEventListener("hashchange", () => {
    checkWakeLockState();
  });

  // Custom scheme link dispatcher
  (window as unknown as { __handleAppUrl?: (url: string) => void }).__handleAppUrl = handleDeepLinkUrl;
};
