const ADMIN_STORAGE_KEY = "gnclass-admin-mode";

function isAdminMode() {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get("admin") === "1") {
      localStorage.setItem(ADMIN_STORAGE_KEY, "1");
      return true;
    }
    if (params.get("admin") === "0") {
      localStorage.removeItem(ADMIN_STORAGE_KEY);
      return false;
    }
    return localStorage.getItem(ADMIN_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function setAdminMode(enabled) {
  try {
    if (enabled) localStorage.setItem(ADMIN_STORAGE_KEY, "1");
    else localStorage.removeItem(ADMIN_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

function applyAdminVisibility() {
  const admin = isAdminMode();
  document.body.classList.toggle("is-admin", admin);
  document.querySelectorAll("[data-admin-only]").forEach((el) => {
    el.hidden = !admin;
  });
}

document.addEventListener("DOMContentLoaded", applyAdminVisibility);
