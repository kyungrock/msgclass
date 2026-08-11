const ADMIN_STORAGE_KEY = "gnclass-admin-mode";

function getAuthUserSafe() {
  try {
    return typeof getCachedAuthUser === "function" ? getCachedAuthUser() : null;
  } catch {
    return null;
  }
}

function isLoggedInUser() {
  const user = getAuthUserSafe();
  return !!(user && user.status !== "banned");
}

function isAdminMode() {
  try {
    const cached = getAuthUserSafe();
    if (cached && cached.role === "admin" && cached.status !== "banned") {
      return true;
    }

    // 하위 호환: 예전 ?admin=1 플래그 (로그인 관리자로 대체 권장)
    const params = new URLSearchParams(window.location.search);
    if (params.get("admin") === "1") {
      localStorage.setItem(ADMIN_STORAGE_KEY, "1");
      return true;
    }
    if (params.get("admin") === "0") {
      localStorage.removeItem(ADMIN_STORAGE_KEY);
      return false;
    }
    return false;
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

function applyMemberVisibility() {
  const loggedIn = isLoggedInUser();
  document.body.classList.toggle("is-member", loggedIn);
  document.querySelectorAll("[data-member-only]").forEach((el) => {
    el.hidden = !loggedIn;
  });
}

function applyAuthVisibility() {
  applyAdminVisibility();
  applyMemberVisibility();
}

document.addEventListener("DOMContentLoaded", applyAuthVisibility);
