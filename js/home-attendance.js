document.addEventListener("DOMContentLoaded", async () => {
  const listEl = document.getElementById("home-attendance-list");
  const emptyEl = document.getElementById("home-attendance-empty");
  if (!listEl || typeof fetchAttendance !== "function") return;

  let items = [];
  try {
    items = await fetchAttendance();
  } catch (err) {
    listEl.innerHTML = "";
    if (emptyEl) {
      emptyEl.hidden = false;
      emptyEl.textContent = err.message || "출근부를 불러오지 못했습니다.";
    }
    return;
  }

  items = [...items].sort((a, b) => {
    const aTime = new Date(a.createdAt || a.date).getTime();
    const bTime = new Date(b.createdAt || b.date).getTime();
    return bTime - aTime;
  });

  listEl.innerHTML = "";
  if (emptyEl) {
    emptyEl.hidden = items.length > 0;
    emptyEl.textContent = "등록된 출근부가 없습니다.";
  }

  items.forEach((item) => {
    const li = document.createElement("li");
    li.className = "board-item";
    li.innerHTML = `
      <a class="board-item-main" href="attendance-detail.html?id=${encodeURIComponent(item.id)}">
        <p class="board-item-title"></p>
      </a>
    `;
    li.querySelector(".board-item-title").textContent = item.title || "";
    listEl.appendChild(li);
  });
});
