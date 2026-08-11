const ATTENDANCE_STORAGE_KEY = "gnclass-attendance";

const DEFAULT_ATTENDANCE = [
  {
    id: "sample-1",
    title: "NF하얀, NF희나, NF유정, 다인, 우리, 소이, 다윤, 윤진, 제시, 제니, 아영, 시연",
    createdAt: "2026-08-10T12:00:00.000Z",
  },
];

function loadAttendance() {
  if (typeof syncSiteContentVersion === "function") syncSiteContentVersion();
  try {
    const raw = localStorage.getItem(ATTENDANCE_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(DEFAULT_ATTENDANCE));
      return [...DEFAULT_ATTENDANCE];
    }
    const data = JSON.parse(raw);
    if (!Array.isArray(data) || data.length === 0) {
      localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(DEFAULT_ATTENDANCE));
      return [...DEFAULT_ATTENDANCE];
    }
    return data;
  } catch {
    return [...DEFAULT_ATTENDANCE];
  }
}

function saveAttendance(items) {
  localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(items));
}

document.addEventListener("DOMContentLoaded", () => {
  const listEl = document.getElementById("attendance-list");
  const countEl = document.getElementById("attendance-count");
  const emptyEl = document.getElementById("attendance-empty");
  const sortEl = document.getElementById("attendance-sort");

  if (!listEl) return;

  const render = () => {
    const admin = typeof isAdminMode === "function" ? isAdminMode() : false;
    let items = loadAttendance();
    const sort = sortEl ? sortEl.value : "newest";

    items = [...items].sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return sort === "oldest" ? aTime - bTime : bTime - aTime;
    });

    if (countEl) countEl.textContent = String(items.length);
    listEl.innerHTML = "";
    if (emptyEl) emptyEl.hidden = items.length > 0;

    items.forEach((item) => {
      const li = document.createElement("li");
      li.className = "board-item";

      if (admin) {
        li.innerHTML = `
          <div class="board-item-row">
            <a class="board-item-main" href="attendance-detail.html?id=${encodeURIComponent(item.id)}">
              <p class="board-item-title"></p>
            </a>
            <a class="btn board-edit-btn" href="attendance-write.html?id=${encodeURIComponent(item.id)}">수정</a>
            <button type="button" class="btn board-delete-btn">삭제</button>
          </div>
        `;
        li.querySelector(".board-item-title").textContent = item.title;
        li.querySelector(".board-delete-btn").addEventListener("click", () => {
          if (!confirm("이 출근부를 삭제할까요?")) return;
          const next = loadAttendance().filter((entry) => entry.id !== item.id);
          saveAttendance(next);
          render();
        });
      } else {
        li.innerHTML = `
          <a href="attendance-detail.html?id=${encodeURIComponent(item.id)}">
            <p class="board-item-title"></p>
          </a>
        `;
        li.querySelector(".board-item-title").textContent = item.title;
      }

      listEl.appendChild(li);
    });
  };

  if (sortEl) {
    sortEl.addEventListener("change", render);
  }

  render();
});
