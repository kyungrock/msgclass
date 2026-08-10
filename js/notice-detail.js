const NOTICE_STORAGE_KEY = "gnclass-notices";

function loadNotices() {
  try {
    const data = JSON.parse(localStorage.getItem(NOTICE_STORAGE_KEY) || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveNotices(items) {
  localStorage.setItem(NOTICE_STORAGE_KEY, JSON.stringify(items));
}

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const notices = loadNotices();
  const notice = notices.find((item) => item.id === id) || notices[0];
  const editLink = document.getElementById("detail-edit");
  const deleteBtn = document.getElementById("detail-delete");
  const admin = typeof isAdminMode === "function" ? isAdminMode() : false;

  if (!notice) {
    document.getElementById("detail-title").textContent = "공지를 찾을 수 없습니다";
    document.getElementById("detail-meta").textContent = "";
    document.getElementById("detail-body").textContent = "목록으로 돌아가 다시 선택해 주세요.";
    return;
  }

  document.getElementById("detail-title").textContent = notice.title;
  document.getElementById("detail-meta").textContent =
    `${notice.author} | ${notice.date} | 추천 ${notice.likes || 0}`;
  document.getElementById("detail-body").textContent = notice.body;
  document.title = `${notice.title} | GN CLASS`;

  if (admin && editLink) {
    editLink.href = `notice-write.html?id=${encodeURIComponent(notice.id)}`;
  }

  if (admin && deleteBtn) {
    deleteBtn.addEventListener("click", () => {
      if (!confirm("이 공지를 삭제할까요?")) return;
      const next = loadNotices().filter((item) => item.id !== notice.id);
      saveNotices(next);
      window.location.href = "notice.html";
    });
  }
});
