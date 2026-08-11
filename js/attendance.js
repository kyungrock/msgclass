document.addEventListener("DOMContentLoaded", () => {
  const listEl = document.getElementById("attendance-list");
  const countEl = document.getElementById("attendance-count");
  const emptyEl = document.getElementById("attendance-empty");
  const sortEl = document.getElementById("attendance-sort");

  if (!listEl) return;

  const render = async () => {
    const admin = typeof isAdminMode === "function" ? isAdminMode() : false;
    let items = [];
    try {
      items = await fetchAttendance();
    } catch (err) {
      listEl.innerHTML = "";
      if (emptyEl) {
        emptyEl.hidden = false;
        emptyEl.textContent = err.message || "출근부를 불러오지 못했습니다.";
      }
      if (countEl) countEl.textContent = "0";
      return;
    }

    const sort = sortEl ? sortEl.value : "newest";
    items = [...items].sort((a, b) => {
      const aTime = new Date(a.createdAt || a.date).getTime();
      const bTime = new Date(b.createdAt || b.date).getTime();
      return sort === "oldest" ? aTime - bTime : bTime - aTime;
    });

    if (countEl) countEl.textContent = String(items.length);
    listEl.innerHTML = "";
    if (emptyEl) {
      emptyEl.hidden = items.length > 0;
      emptyEl.textContent = "등록된 출근부가 없습니다.";
    }

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
        li.querySelector(".board-delete-btn").addEventListener("click", async () => {
          if (!confirm("이 출근부를 삭제할까요?")) return;
          try {
            await deleteAttendance(item.id);
            await render();
          } catch (err) {
            alert(err.message || "삭제에 실패했습니다.");
          }
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

  if (sortEl) sortEl.addEventListener("change", () => void render());
  void render();
});
