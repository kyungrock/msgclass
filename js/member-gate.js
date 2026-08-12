async function resolveCurrentUser() {
  let user = typeof getCachedAuthUser === "function" ? getCachedAuthUser() : null;
  if (typeof fetchCurrentUser === "function") {
    try {
      user = await fetchCurrentUser();
    } catch {
      user = null;
    }
  }
  if (!user || user.status === "banned") return null;
  return user;
}

function renderLoginRequiredGate(targetEl, { nextUrl = "" } = {}) {
  if (!targetEl) return;
  const next = nextUrl || `${location.pathname}${location.search}` || "index.html";
  const loginHref = `login.html?next=${encodeURIComponent(next)}`;
  const signupHref = `signup.html?next=${encodeURIComponent(next)}`;

  targetEl.hidden = false;
  targetEl.classList.add("login-required-gate");
  targetEl.innerHTML = `
    <p class="login-required-text">회원가입/로그인 하셔야 볼수있습니다.</p>
    <div class="login-required-actions">
      <a class="btn btn-primary" href="${loginHref}">로그인</a>
      <a class="btn" href="${signupHref}">회원가입</a>
    </div>
  `;
}

async function requireMemberToView(gateEl, options = {}) {
  const user = await resolveCurrentUser();
  if (user) return user;
  renderLoginRequiredGate(gateEl, options);
  return null;
}
