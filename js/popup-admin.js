document.addEventListener("DOMContentLoaded", async () => {
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

  const statusEl = document.getElementById("popup-status");
  const listEl = document.getElementById("popup-list");
  const writeBtn = document.getElementById("popup-write-btn");

  const render = async () => {
    try {
      const config = await loadPopupConfig();
      const hasContent = !!(config.title && config.body);

      if (statusEl) statusEl.textContent = hasContent
        ? config.enabled
          ? "표시중"
          : "숨김"
        : "없음";

      if (writeBtn) {
        writeBtn.textContent = hasContent ? "팝업 수정" : "팝업 글 작성";
      }

      if (!listEl) return;
      listEl.innerHTML = "";

      if (!hasContent) {
        listEl.innerHTML = `
          <li class="board-item">
            <p class="board-item-title">등록된 팝업이 없습니다.</p>
            <p class="board-item-meta">팝업 글 작성으로 추가해 주세요.</p>
          </li>
        `;
        return;
      }

      const date = String(config.updatedAt || "").slice(0, 10).replace(/-/g, ".");
      const li = document.createElement("li");
      li.className = "board-item";
      li.innerHTML = `
        <div class="board-item-row">
          <a class="board-item-main" href="popup-write.html">
            <p class="board-item-title"></p>
            <p class="board-item-meta"></p>
          </a>
          <a class="btn board-edit-btn" href="popup-write.html">수정</a>
          <button type="button" class="btn board-delete-btn">삭제</button>
        </div>
      `;
      li.querySelector(".board-item-title").textContent = config.title;
      li.querySelector(".board-item-meta").textContent =
        `${config.enabled ? "표시중" : "숨김"} | 수정 ${date || "-"}`;
      li.querySelector(".board-delete-btn").addEventListener("click", async () => {
        if (!confirm("팝업을 삭제할까요? 메인에 더 이상 표시되지 않습니다.")) return;
        try {
          await deletePopupConfig();
          try {
            sessionStorage.removeItem("gnclass-popup-dismissed");
          } catch {
            /* ignore */
          }
          await render();
        } catch (err) {
          alert(err.message || "삭제에 실패했습니다.");
        }
      });
      listEl.appendChild(li);
    } catch (err) {
      if (statusEl) statusEl.textContent = "오류";
      if (listEl) {
        listEl.innerHTML = `
          <li class="board-item">
            <p class="board-item-title">불러오기 실패</p>
            <p class="board-item-meta"></p>
          </li>
        `;
        listEl.querySelector(".board-item-meta").textContent = err.message || "오류";
      }
    }
  };

  await render();
});
