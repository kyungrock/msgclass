document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("attendance-write-form");
  if (!form) return;

  let user = typeof getCachedAuthUser === "function" ? getCachedAuthUser() : null;
  if (typeof fetchCurrentUser === "function") {
    try {
      user = await fetchCurrentUser();
    } catch {
      user = null;
    }
  }

  if (!user || user.role !== "admin") {
    alert("관리자만 출근부를 등록할 수 있습니다.");
    window.location.href = "login.html";
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const editId = params.get("id");
  const titleInput = document.getElementById("attendance-title");
  const submitBtn = form.querySelector('button[type="submit"]');
  const pageTitle = document.querySelector(".page-hero h1");

  if (editId) {
    try {
      const item = await fetchAttendanceItem(editId);
      titleInput.value = item.title || "";
      if (pageTitle) pageTitle.textContent = "출근부 수정";
      if (submitBtn) submitBtn.textContent = "수정하기";
      document.title = "출근부 수정 | 강남더라임";
    } catch {
      alert("수정할 출근부를 찾을 수 없습니다.");
      window.location.href = "attendance.html";
      return;
    }
  }

  const backLink = document.querySelector(".back-link");
  if (backLink) backLink.href = "attendance.html";

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = titleInput.value.trim();
    if (!title) {
      alert("제목을 입력해 주세요.");
      return;
    }

    if (submitBtn) submitBtn.disabled = true;
    try {
      if (editId) {
        await updateAttendance(editId, { title, body: "" });
      } else {
        await createAttendance({ title, body: "" });
      }
      window.location.href = "attendance.html";
    } catch (err) {
      alert(err.message || "저장에 실패했습니다.");
      if (submitBtn) submitBtn.disabled = false;
    }
  });
});
