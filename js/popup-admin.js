document.addEventListener("DOMContentLoaded", async () => {
  let user = typeof getCachedAuthUser === "function" ? getCachedAuthUser() : null;
  if (typeof fetchCurrentUser === "function") {
    try {
      user = await fetchCurrentUser();
    } catch {
      user = null;
    }
  }

  if (!user || user.role !== "admin") {
    alert("관리자만 접근할 수 있습니다.");
    window.location.href = "login.html";
    return;
  }

  const config = loadPopupConfig();
  const statusEl = document.getElementById("popup-status");
  const titleEl = document.getElementById("popup-title-preview");
  const metaEl = document.getElementById("popup-meta-preview");

  if (statusEl) statusEl.textContent = config.enabled ? "표시중" : "숨김";
  if (titleEl) titleEl.textContent = config.title;
  if (metaEl) {
    const date = String(config.updatedAt || "").slice(0, 10).replace(/-/g, ".");
    metaEl.textContent = `${config.enabled ? "표시중" : "숨김"} | 수정 ${date || "-"}`;
  }
});
