document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const editLink = document.getElementById("detail-edit");
  const deleteBtn = document.getElementById("detail-delete");
  const admin = typeof isAdminMode === "function" ? isAdminMode() : false;

  let notice = null;
  try {
    if (!id) throw new Error("missing id");
    notice = await fetchNotice(id);
  } catch {
    document.getElementById("detail-title").textContent = "공지를 찾을 수 없습니다";
    document.getElementById("detail-meta").textContent = "";
    document.getElementById("detail-body").textContent = "목록으로 돌아가 다시 선택해 주세요.";
    return;
  }

  document.getElementById("detail-title").textContent = notice.title;
  const views = notice.views != null ? ` | 조회 ${notice.views}` : "";
  document.getElementById("detail-meta").textContent =
    `${notice.author} | ${notice.date} | 추천 ${notice.likes || 0}${views}`;
  document.getElementById("detail-body").textContent = notice.body;
  document.title = `${notice.title} | 강남비너스`;

  if (admin && editLink) {
    editLink.href = `notice-write.html?id=${encodeURIComponent(notice.id)}`;
  }

  if (admin && deleteBtn) {
    deleteBtn.addEventListener("click", async () => {
      if (!confirm("이 공지를 삭제할까요?")) return;
      try {
        await deleteNotice(notice.id);
        window.location.href = "notice.html";
      } catch (err) {
        alert(err.message || "삭제에 실패했습니다.");
      }
    });
  }
});
