document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const editLink = document.getElementById("detail-edit");
  const deleteBtn = document.getElementById("detail-delete");
  const admin = typeof isAdminMode === "function" ? isAdminMode() : false;

  let profile = null;
  try {
    if (!id) throw new Error("missing id");
    profile = await fetchProfile(id);
  } catch {
    document.getElementById("detail-title").textContent = "프로필을 찾을 수 없습니다";
    document.getElementById("detail-meta").textContent = "";
    document.getElementById("detail-body").textContent = "목록으로 돌아가 다시 선택해 주세요.";
    return;
  }

  document.getElementById("detail-title").textContent = profile.title;
  const views = profile.views != null ? ` | 조회 ${profile.views}` : "";
  const datePart = admin && profile.date ? ` | ${profile.date}` : "";
  document.getElementById("detail-meta").textContent =
    `${profile.author}${datePart} | 추천 ${profile.likes || 0}${views}`;
  document.getElementById("detail-body").textContent = profile.body;

  const pageUrl = `https://msg1000.com/profile-detail.html?id=${encodeURIComponent(profile.id)}`;
  const desc = `${profile.title} - 강남더라임 프로필. msg1000.com`.slice(0, 155);
  document.title = `${profile.title} | 강남더라임`;
  const descEl = document.querySelector('meta[name="description"]');
  if (descEl) descEl.setAttribute("content", desc);
  const canonical = document.getElementById("canonical-link");
  if (canonical) canonical.setAttribute("href", pageUrl);
  const ogTitle = document.getElementById("og-title");
  if (ogTitle) ogTitle.setAttribute("content", `${profile.title} | 강남더라임`);
  const ogDesc = document.getElementById("og-description");
  if (ogDesc) ogDesc.setAttribute("content", desc);
  const ogUrl = document.getElementById("og-url");
  if (ogUrl) ogUrl.setAttribute("content", pageUrl);

  if (admin && editLink) {
    editLink.href = `profile-write.html?id=${encodeURIComponent(profile.id)}`;
  }

  if (admin && deleteBtn) {
    deleteBtn.addEventListener("click", async () => {
      if (!confirm("이 프로필을 삭제할까요?")) return;
      try {
        await deleteProfile(profile.id);
        window.location.href = "profile.html";
      } catch (err) {
        alert(err.message || "삭제에 실패했습니다.");
      }
    });
  }
});
