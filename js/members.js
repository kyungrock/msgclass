document.addEventListener("DOMContentLoaded", async () => {
  const bodyEl = document.getElementById("members-body");
  const errorEl = document.getElementById("members-error");
  if (!bodyEl) return;

  const showError = (msg) => {
    if (!errorEl) return;
    errorEl.textContent = msg;
    errorEl.hidden = !msg;
  };

  const render = async () => {
    showError("");
    try {
      const user = await fetchCurrentUser();
      if (!user || user.role !== "admin") {
        alert("관리자만 접근할 수 있습니다.");
        window.location.href = "login.html";
        return;
      }
      setAdminMode(true);
      applyAdminVisibility();

      const members = await fetchMembers();
      bodyEl.innerHTML = "";

      if (!members.length) {
        bodyEl.innerHTML = `<tr><td colspan="6">회원이 없습니다.</td></tr>`;
        return;
      }

      members.forEach((member) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td class="members-actions"></td>
        `;
        const cells = tr.querySelectorAll("td");
        cells[0].textContent = member.username;
        cells[1].textContent = member.nickname;
        cells[2].textContent = member.role === "admin" ? "관리자" : "회원";
        cells[3].textContent = member.status === "banned" ? "정지" : "정상";
        cells[4].textContent = String(member.createdAt || "").slice(0, 10);

        const actions = cells[5];
        if (member.role !== "admin") {
          const banBtn = document.createElement("button");
          banBtn.type = "button";
          banBtn.className = "btn";
          banBtn.textContent = member.status === "banned" ? "해제" : "정지";
          banBtn.addEventListener("click", async () => {
            const next = member.status === "banned" ? "active" : "banned";
            if (!confirm(next === "banned" ? "이 회원을 정지할까요?" : "정지를 해제할까요?")) return;
            try {
              await updateMember(member.id, { status: next });
              await render();
            } catch (err) {
              alert(err.message || "처리에 실패했습니다.");
            }
          });
          actions.appendChild(banBtn);

          const delBtn = document.createElement("button");
          delBtn.type = "button";
          delBtn.className = "btn";
          delBtn.textContent = "삭제";
          delBtn.addEventListener("click", async () => {
            if (!confirm("이 회원을 삭제할까요?")) return;
            try {
              await deleteMember(member.id);
              await render();
            } catch (err) {
              alert(err.message || "삭제에 실패했습니다.");
            }
          });
          actions.appendChild(delBtn);
        } else {
          actions.textContent = "-";
        }

        bodyEl.appendChild(tr);
      });
    } catch (err) {
      bodyEl.innerHTML = `<tr><td colspan="6">목록을 불러오지 못했습니다.</td></tr>`;
      showError(err.message || "회원 목록을 불러오지 못했습니다.");
    }
  };

  await render();
});
