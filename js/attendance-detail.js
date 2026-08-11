document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const titleEl = document.getElementById("detail-title");
  const editLink = document.getElementById("detail-edit");
  const deleteBtn = document.getElementById("detail-delete");
  const admin = typeof isAdminMode === "function" ? isAdminMode() : false;

  let item = null;
  try {
    if (!id) throw new Error("missing id");
    item = await fetchAttendanceItem(id);
  } catch {
    titleEl.textContent = "출근부를 찾을 수 없습니다";
    return;
  }

  titleEl.textContent = item.title;
  document.title = `${item.title} | 강남더라임`;

  if (admin && editLink) {
    editLink.href = `attendance-write.html?id=${encodeURIComponent(item.id)}`;
  }

  if (admin && deleteBtn) {
    deleteBtn.addEventListener("click", async () => {
      if (!confirm("이 출근부를 삭제할까요?")) return;
      try {
        await deleteAttendance(item.id);
        window.location.href = "attendance.html";
      } catch (err) {
        alert(err.message || "삭제에 실패했습니다.");
      }
    });
  }
});
