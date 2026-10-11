const isExamPath = () => /\/test\//.test(window.location.pathname);

const safeScrollIntoView = (element: HTMLElement | null) => {
  if (!element) return;

  const rect = element.getBoundingClientRect();
  const isBelowViewport = rect.bottom > window.innerHeight - 140;
  const isAboveViewport = rect.top < 120;

  if (isBelowViewport || isAboveViewport) {
    element.scrollIntoView({ behavior: "smooth", block: "center" });
  }
};

const handleBackButton = () => {
  if (isExamPath()) {
    const shouldLeave = window.confirm("You are in an active exam. Leave this exam?");
    if (!shouldLeave) return;
  }

  if (window.history.length > 1) {
    window.history.back();
  }
};

export const initMobileShell = () => {
  document.documentElement.style.setProperty("--safe-area-top", "env(safe-area-inset-top, 0px)");
  document.documentElement.style.setProperty("--safe-area-right", "env(safe-area-inset-right, 0px)");
  document.documentElement.style.setProperty("--safe-area-bottom", "env(safe-area-inset-bottom, 0px)");
  document.documentElement.style.setProperty("--safe-area-left", "env(safe-area-inset-left, 0px)");

  const onResize = () => {
    const vh = window.visualViewport?.height ? `${window.visualViewport.height}px` : "100dvh";
    document.documentElement.style.setProperty("--app-height", vh);
  };

  onResize();
  window.addEventListener("resize", onResize);
  window.visualViewport?.addEventListener("resize", onResize);

  document.addEventListener("focusin", (event) => {
    const target = event.target as HTMLElement | null;
    if (target && target.tagName !== "BODY") {
      safeScrollIntoView(target);
    }
  });

  window.addEventListener("popstate", () => {
    if (isExamPath()) {
      const shouldLeave = window.confirm("You are in an active exam. Leave this exam?");
      if (!shouldLeave) {
        window.history.pushState(null, "", window.location.href);
      }
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Backspace" && isExamPath()) {
      const activeTag = document.activeElement?.tagName;
      if (activeTag && (activeTag === "INPUT" || activeTag === "TEXTAREA")) {
        return;
      }
    }

    if (event.key === "Escape") {
      handleBackButton();
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      document.body.classList.add("app-paused");
      return;
    }

    document.body.classList.remove("app-paused");
  });
};
