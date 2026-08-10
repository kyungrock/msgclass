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
  const form = document.getElementById("attendance-write-form");
  if (!form) return;

  const params = new URLSearchParams(window.location.search);
  const editId = params.get("id");
  const titleInput = document.getElementById("attendance-title");
  const submitBtn = form.querySelector('button[type="submit"]');
  const pageTitle = document.querySelector(".page-hero h1");

  if (editId) {
    const item = loadAttendance().find((entry) => entry.id === editId);
    if (!item) {
      alert("수정할 출근부를 찾을 수 없습니다.");
      window.location.href = "attendance.html";
      return;
    }
    titleInput.value = item.title || "";
    if (pageTitle) pageTitle.textContent = "출근부 수정";
    if (submitBtn) submitBtn.textContent = "수정하기";
    document.title = "출근부 수정 | GN CLASS";
  }

  const backLink = document.querySelector(".back-link");
  if (backLink) backLink.href = "attendance.html";

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const title = titleInput.value.trim();
    if (!title) {
      alert("제목을 입력해 주세요.");
      return;
    }

    const items = loadAttendance();

    if (editId) {
      const index = items.findIndex((entry) => entry.id === editId);
      if (index < 0) {
        alert("수정할 출근부를 찾을 수 없습니다.");
        return;
      }
      items[index] = {
        ...items[index],
        title,
        updatedAt: new Date().toISOString(),
      };
      saveAttendance(items);
      window.location.href = "attendance.html";
      return;
    }

    items.unshift({
      id: String(Date.now()),
      title,
      createdAt: new Date().toISOString(),
    });
    saveAttendance(items);
    window.location.href = "attendance.html";
  });
});
