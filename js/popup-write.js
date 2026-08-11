document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("popup-write-form");
  if (!form) return;

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

  const titleInput = document.getElementById("popup-title");
  const bodyInput = document.getElementById("popup-body");
  const enabledInput = document.getElementById("popup-enabled");
  const config = loadPopupConfig();

  titleInput.value = config.title || "";
  bodyInput.value = config.body || "";
  enabledInput.checked = config.enabled !== false;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = titleInput.value.trim();
    const body = bodyInput.value.trim();
    if (!title || !body) {
      alert("제목과 내용을 입력해 주세요.");
      return;
    }

    savePopupConfig({
      enabled: enabledInput.checked,
      title,
      body,
    });

    // 내용이 바뀌면 방문자가 다시 볼 수 있도록 세션 dismiss 초기화
    try {
      sessionStorage.removeItem("gnclass-popup-dismissed");
    } catch {
      /* ignore */
    }

    alert("팝업이 저장되었습니다.");
    window.location.href = "popup.html";
  });
});
