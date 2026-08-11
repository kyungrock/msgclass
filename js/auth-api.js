const AUTH_API_BASE = "https://msg1000-api.pages.dev";
const AUTH_TOKEN_KEY = "gnclass-auth-token";
const AUTH_USER_KEY = "gnclass-auth-user";

function getAuthToken() {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

function setAuthSession(token, user) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

function clearAuthSession() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}

function getCachedAuthUser() {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function authApi(path, options = {}) {
  const headers = {
    "content-type": "application/json",
    ...(options.headers || {}),
  };
  const token = getAuthToken();
  if (token) headers.authorization = `Bearer ${token}`;

  const res = await fetch(`${AUTH_API_BASE}${path}`, {
    ...options,
    headers,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const err = new Error((data && data.error) || "요청에 실패했습니다.");
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

async function signupUser({ username, password, nickname }) {
  const data = await authApi("/api/signup", {
    method: "POST",
    body: JSON.stringify({ username, password, nickname }),
  });
  setAuthSession(data.token, data.user);
  return data.user;
}

async function loginUser({ username, password }) {
  const data = await authApi("/api/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  setAuthSession(data.token, data.user);
  return data.user;
}

async function logoutUser() {
  try {
    await authApi("/api/logout", { method: "POST", body: "{}" });
  } catch {
    /* ignore */
  }
  clearAuthSession();
}

async function fetchCurrentUser() {
  const token = getAuthToken();
  if (!token) {
    clearAuthSession();
    return null;
  }
  try {
    const data = await authApi("/api/me");
    setAuthSession(token, data.user);
    return data.user;
  } catch (err) {
    if (err.status === 401 || err.status === 403) clearAuthSession();
    return null;
  }
}

async function fetchMembers() {
  const data = await authApi("/api/members");
  return data.members || [];
}

async function updateMember(id, patch) {
  const data = await authApi(`/api/members/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  return data.user;
}

async function deleteMember(id) {
  await authApi(`/api/members/${id}`, { method: "DELETE" });
}

async function fetchReviews() {
  const data = await authApi("/api/reviews");
  return data.items || [];
}

async function fetchReview(id) {
  const data = await authApi(`/api/reviews/${encodeURIComponent(id)}`);
  return data.item;
}

async function createReview(payload) {
  const data = await authApi("/api/reviews", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data.item;
}

async function updateReview(id, payload) {
  const data = await authApi(`/api/reviews/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return data.item;
}

async function deleteReview(id) {
  await authApi(`/api/reviews/${encodeURIComponent(id)}`, { method: "DELETE" });
}

async function fetchProfiles() {
  const data = await authApi("/api/profiles");
  return data.items || [];
}

async function fetchProfile(id) {
  const data = await authApi(`/api/profiles/${encodeURIComponent(id)}`);
  return data.item;
}

async function createProfile(payload) {
  const data = await authApi("/api/profiles", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data.item;
}

async function updateProfile(id, payload) {
  const data = await authApi(`/api/profiles/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return data.item;
}

async function deleteProfile(id) {
  await authApi(`/api/profiles/${encodeURIComponent(id)}`, { method: "DELETE" });
}

async function fetchPopupConfig() {
  const data = await authApi("/api/popup");
  return data.popup;
}

async function savePopupConfigApi(payload) {
  const data = await authApi("/api/popup", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return data.popup;
}

async function deletePopupConfigApi() {
  await authApi("/api/popup", { method: "DELETE" });
}

async function fetchNotices() {
  const data = await authApi("/api/notices");
  return data.items || [];
}

async function fetchNotice(id) {
  const data = await authApi(`/api/notices/${encodeURIComponent(id)}`);
  return data.item;
}

async function createNotice(payload) {
  const data = await authApi("/api/notices", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data.item;
}

async function updateNotice(id, payload) {
  const data = await authApi(`/api/notices/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return data.item;
}

async function deleteNotice(id) {
  await authApi(`/api/notices/${encodeURIComponent(id)}`, { method: "DELETE" });
}

async function fetchAttendance() {
  const data = await authApi("/api/attendance");
  return data.items || [];
}

async function fetchAttendanceItem(id) {
  const data = await authApi(`/api/attendance/${encodeURIComponent(id)}`);
  return data.item;
}

async function createAttendance(payload) {
  const data = await authApi("/api/attendance", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data.item;
}

async function updateAttendance(id, payload) {
  const data = await authApi(`/api/attendance/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return data.item;
}

async function deleteAttendance(id) {
  await authApi(`/api/attendance/${encodeURIComponent(id)}`, { method: "DELETE" });
}
