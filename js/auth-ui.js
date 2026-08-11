async function refreshAuthNav() {
  const nav = document.querySelector(".site-nav");
  if (!nav) return;

  let user = typeof getCachedAuthUser === "function" ? getCachedAuthUser() : null;
  if (typeof fetchCurrentUser === "function") {
    try {
      user = await fetchCurrentUser();
    } catch {
      user = null;
    }
  }

  const loginLink = nav.querySelector('a[href="login.html"]');
  const signupLink = nav.querySelector('a[href="signup.html"]');
  const existingUser = nav.querySelector("[data-auth-user]");
  const existingLogout = nav.querySelector("[data-auth-logout]");
  const existingMembers = nav.querySelector('a[href="members.html"]');
  const existingPopup = nav.querySelector('a[href="popup.html"]');

  if (existingUser) existingUser.remove();
  if (existingLogout) existingLogout.remove();

  if (typeof applyAuthVisibility === "function") applyAuthVisibility();
  else {
    if (typeof applyAdminVisibility === "function") applyAdminVisibility();
    if (typeof applyMemberVisibility === "function") applyMemberVisibility();
  }

  if (!user) {
    if (loginLink) loginLink.hidden = false;
    if (signupLink) signupLink.hidden = false;
    if (existingMembers) existingMembers.hidden = true;
    if (existingPopup) existingPopup.hidden = true;
    return;
  }

  if (loginLink) loginLink.hidden = true;
  if (signupLink) signupLink.hidden = true;

  if (user.role === "admin") {
    if (!existingMembers) {
      const membersLink = document.createElement("a");
      membersLink.href = "members.html";
      membersLink.textContent = "회원관리";
      if (/members\.html$/i.test(location.pathname)) membersLink.classList.add("is-active");
      nav.appendChild(membersLink);
    } else {
      existingMembers.hidden = false;
    }

    if (!existingPopup) {
      const popupLink = document.createElement("a");
      popupLink.href = "popup.html";
      popupLink.textContent = "팝업관리";
      if (/popup(-write)?\.html$/i.test(location.pathname)) popupLink.classList.add("is-active");
      nav.appendChild(popupLink);
    } else {
      existingPopup.hidden = false;
    }
  } else {
    if (existingMembers) existingMembers.hidden = true;
    if (existingPopup) existingPopup.hidden = true;
  }

  const nameEl = document.createElement("span");
  nameEl.className = "nav-user";
  nameEl.dataset.authUser = "1";
  nameEl.textContent = user.nickname || user.username;
  nav.appendChild(nameEl);

  const logoutBtn = document.createElement("button");
  logoutBtn.type = "button";
  logoutBtn.className = "nav-logout";
  logoutBtn.dataset.authLogout = "1";
  logoutBtn.textContent = "로그아웃";
  logoutBtn.addEventListener("click", async () => {
    if (typeof logoutUser === "function") await logoutUser();
    if (typeof setAdminMode === "function") setAdminMode(false);
    window.location.href = "index.html";
  });
  nav.appendChild(logoutBtn);
}

document.addEventListener("DOMContentLoaded", () => {
  void refreshAuthNav();
});
