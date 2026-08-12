document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("notice-write-form");
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
    alert("관리자만 공지를 등록할 수 있습니다.");
    window.location.href = "login.html";
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const editId = params.get("id");
  const titleInput = document.getElementById("notice-title");
  const authorInput = document.getElementById("notice-author");
  const bodyInput = document.getElementById("notice-body");
  const submitBtn = form.querySelector('button[type="submit"]');
  const pageTitle = document.querySelector(".page-hero h1");

  if (authorInput && !authorInput.value) {
    authorInput.value = user.nickname || user.username || "운영자";
  }

  if (editId) {
    try {
      const item = await fetchNotice(editId, { countView: false });
      titleInput.value = item.title || "";
      authorInput.value = item.author || "";
      bodyInput.value = item.body || "";
      if (pageTitle) pageTitle.textContent = "공지 수정";
      if (submitBtn) submitBtn.textContent = "수정하기";
      document.title = "공지 수정 | 강남더라임";
    } catch {
      alert("수정할 공지를 찾을 수 없습니다.");
      window.location.href = "notice.html";
      return;
    }
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const title = titleInput.value.trim();
    const author = authorInput.value.trim() || user.nickname || "운영자";
    const body = bodyInput.value.trim();

    if (!title || !body) {
      alert("제목과 내용을 입력해 주세요.");
      return;
    }

    if (submitBtn) submitBtn.disabled = true;
    try {
      if (editId) {
        await updateNotice(editId, { title, author, body });
        window.location.href = `notice-detail.html?id=${encodeURIComponent(editId)}`;
      } else {
        await createNotice({ title, author, body });
        window.location.href = "notice.html";
      }
    } catch (err) {
      alert(err.message || "저장에 실패했습니다.");
      if (submitBtn) submitBtn.disabled = false;
    }
  });
});
