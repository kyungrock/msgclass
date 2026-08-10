const ATTENDANCE_STORAGE_KEY = "gnclass-attendance";

function loadAttendance() {
  try {
    const data = JSON.parse(localStorage.getItem(ATTENDANCE_STORAGE_KEY) || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveAttendance(items) {
  localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(items));
}

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const items = loadAttendance();
  const item = items.find((entry) => entry.id === id) || items[0];
  const titleEl = document.getElementById("detail-title");
  const editLink = document.getElementById("detail-edit");
  const deleteBtn = document.getElementById("detail-delete");
  const admin = typeof isAdminMode === "function" ? isAdminMode() : false;

  if (!item) {
    titleEl.textContent = "출근부를 찾을 수 없습니다";
    return;
  }

  titleEl.textContent = item.title;
  document.title = `${item.title} | GN CLASS`;

  if (admin && editLink) {
    editLink.href = `attendance-write.html?id=${encodeURIComponent(item.id)}`;
  }

  if (admin && deleteBtn) {
    deleteBtn.addEventListener("click", () => {
      if (!confirm("이 출근부를 삭제할까요?")) return;
      const next = loadAttendance().filter((entry) => entry.id !== item.id);
      saveAttendance(next);
      window.location.href = "attendance.html";
    });
  }
});
