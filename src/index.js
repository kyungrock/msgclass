const SESSION_DAYS = 30;
const PBKDF2_ITERATIONS = 100000;

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...headers,
    },
  });
}

function parseOrigins(env) {
  return String(env.CORS_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowed = parseOrigins(env);
  const headers = {
    "access-control-allow-methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "access-control-allow-headers": "content-type,authorization",
    "access-control-max-age": "86400",
    vary: "Origin",
  };
  if (origin && allowed.includes(origin)) {
    headers["access-control-allow-origin"] = origin;
  }
  return headers;
}

function withCors(response, request, env) {
  const headers = new Headers(response.headers);
  const cors = corsHeaders(request, env);
  for (const [k, v] of Object.entries(cors)) headers.set(k, v);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function bytesToHex(bytes) {
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex) {
  const clean = String(hex || "");
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

async function hashPassword(password, saltHex) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: hexToBytes(saltHex),
      iterations: PBKDF2_ITERATIONS,
    },
    keyMaterial,
    256
  );
  return bytesToHex(new Uint8Array(bits));
}

function randomHex(byteLength = 32) {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength));
  return bytesToHex(bytes);
}

function publicUser(row) {
  return {
    id: row.id,
    username: row.username,
    nickname: row.nickname,
    role: row.role,
    status: row.status,
    createdAt: row.created_at,
  };
}

function getBearerToken(request) {
  const auth = request.headers.get("Authorization") || "";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : "";
}

async function getUserByToken(env, token) {
  if (!token) return null;
  const row = await env.DB.prepare(
    `SELECT u.* FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token = ? AND s.expires_at > datetime('now')
     LIMIT 1`
  )
    .bind(token)
    .first();
  return row || null;
}

async function createSession(env, userId) {
  const token = randomHex(32);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000)
    .toISOString()
    .replace("T", " ")
    .slice(0, 19);
  await env.DB.prepare(
    `INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)`
  )
    .bind(token, userId, expiresAt)
    .run();
  return token;
}

async function ensureAdmin(env) {
  const existing = await env.DB.prepare(
    `SELECT id FROM users WHERE role = 'admin' LIMIT 1`
  ).first();
  if (existing) return;

  const username = String(env.ADMIN_USERNAME || "admin").trim().toLowerCase();
  const password = String(env.ADMIN_BOOTSTRAP_PASSWORD || "admin1234");
  const nickname = String(env.ADMIN_NICKNAME || "관리자");
  const salt = randomHex(16);
  const hash = await hashPassword(password, salt);

  await env.DB.prepare(
    `INSERT INTO users (username, nickname, password_salt, password_hash, role, status)
     VALUES (?, ?, ?, ?, 'admin', 'active')`
  )
    .bind(username, nickname, salt, hash)
    .run();
}

function validateUsername(username) {
  return /^[a-zA-Z0-9_]{4,20}$/.test(username);
}

function validatePassword(password) {
  return typeof password === "string" && password.length >= 6 && password.length <= 72;
}

function validateNickname(nickname) {
  return typeof nickname === "string" && nickname.trim().length >= 2 && nickname.trim().length <= 20;
}

async function handleSignup(request, env) {
  const body = await readJson(request);
  if (!body) return json({ error: "잘못된 요청입니다." }, 400);

  const username = String(body.username || "").trim();
  const password = String(body.password || "");
  const nickname = String(body.nickname || "").trim();

  if (!validateUsername(username)) {
    return json({ error: "아이디는 영문/숫자/밑줄 4~20자여야 합니다." }, 400);
  }
  if (!validatePassword(password)) {
    return json({ error: "비밀번호는 6~72자여야 합니다." }, 400);
  }
  if (!validateNickname(nickname)) {
    return json({ error: "닉네임은 2~20자여야 합니다." }, 400);
  }

  const exists = await env.DB.prepare(
    `SELECT id FROM users WHERE username = ? COLLATE NOCASE LIMIT 1`
  )
    .bind(username)
    .first();
  if (exists) return json({ error: "이미 사용 중인 아이디입니다." }, 409);

  const salt = randomHex(16);
  const hash = await hashPassword(password, salt);

  const result = await env.DB.prepare(
    `INSERT INTO users (username, nickname, password_salt, password_hash, role, status)
     VALUES (?, ?, ?, ?, 'member', 'active')`
  )
    .bind(username.toLowerCase(), nickname, salt, hash)
    .run();

  const userId = result.meta.last_row_id;
  const token = await createSession(env, userId);
  const user = await env.DB.prepare(`SELECT * FROM users WHERE id = ?`)
    .bind(userId)
    .first();

  return json({ token, user: publicUser(user) }, 201);
}

async function handleLogin(request, env) {
  const body = await readJson(request);
  if (!body) return json({ error: "잘못된 요청입니다." }, 400);

  const username = String(body.username || "").trim();
  const password = String(body.password || "");
  if (!username || !password) {
    return json({ error: "아이디와 비밀번호를 입력해 주세요." }, 400);
  }

  const user = await env.DB.prepare(
    `SELECT * FROM users WHERE username = ? COLLATE NOCASE LIMIT 1`
  )
    .bind(username)
    .first();

  if (!user) return json({ error: "아이디 또는 비밀번호가 올바르지 않습니다." }, 401);

  const hash = await hashPassword(password, user.password_salt);
  if (hash !== user.password_hash) {
    return json({ error: "아이디 또는 비밀번호가 올바르지 않습니다." }, 401);
  }
  if (user.status === "banned") {
    return json({ error: "정지된 계정입니다. 관리자에게 문의해 주세요." }, 403);
  }

  const token = await createSession(env, user.id);
  return json({ token, user: publicUser(user) });
}

async function handleLogout(request, env) {
  const token = getBearerToken(request);
  if (token) {
    await env.DB.prepare(`DELETE FROM sessions WHERE token = ?`).bind(token).run();
  }
  return json({ ok: true });
}

async function handleMe(request, env) {
  const user = await getUserByToken(env, getBearerToken(request));
  if (!user) return json({ error: "로그인이 필요합니다." }, 401);
  if (user.status === "banned") return json({ error: "정지된 계정입니다." }, 403);
  return json({ user: publicUser(user) });
}

async function requireAdmin(request, env) {
  const user = await getUserByToken(env, getBearerToken(request));
  if (!user) return { error: json({ error: "로그인이 필요합니다." }, 401) };
  if (user.status === "banned") return { error: json({ error: "정지된 계정입니다." }, 403) };
  if (user.role !== "admin") return { error: json({ error: "관리자만 접근할 수 있습니다." }, 403) };
  return { user };
}

async function handleMembersList(request, env) {
  const auth = await requireAdmin(request, env);
  if (auth.error) return auth.error;

  const { results } = await env.DB.prepare(
    `SELECT id, username, nickname, role, status, created_at
     FROM users
     ORDER BY id DESC`
  ).all();

  return json({
    members: (results || []).map((row) => ({
      id: row.id,
      username: row.username,
      nickname: row.nickname,
      role: row.role,
      status: row.status,
      createdAt: row.created_at,
    })),
  });
}

async function handleMemberPatch(request, env, id) {
  const auth = await requireAdmin(request, env);
  if (auth.error) return auth.error;

  const body = await readJson(request);
  if (!body) return json({ error: "잘못된 요청입니다." }, 400);

  const member = await env.DB.prepare(`SELECT * FROM users WHERE id = ?`)
    .bind(id)
    .first();
  if (!member) return json({ error: "회원을 찾을 수 없습니다." }, 404);
  if (member.id === auth.user.id) {
    return json({ error: "본인 계정은 변경할 수 없습니다." }, 400);
  }

  const status = body.status != null ? String(body.status) : member.status;
  const role = body.role != null ? String(body.role) : member.role;
  if (!["active", "banned"].includes(status)) {
    return json({ error: "상태 값이 올바르지 않습니다." }, 400);
  }
  if (!["member", "admin"].includes(role)) {
    return json({ error: "권한 값이 올바르지 않습니다." }, 400);
  }

  await env.DB.prepare(
    `UPDATE users SET status = ?, role = ?, updated_at = datetime('now') WHERE id = ?`
  )
    .bind(status, role, id)
    .run();

  if (status === "banned") {
    await env.DB.prepare(`DELETE FROM sessions WHERE user_id = ?`).bind(id).run();
  }

  const updated = await env.DB.prepare(`SELECT * FROM users WHERE id = ?`)
    .bind(id)
    .first();
  return json({ user: publicUser(updated) });
}

async function handleMemberDelete(request, env, id) {
  const auth = await requireAdmin(request, env);
  if (auth.error) return auth.error;

  const member = await env.DB.prepare(`SELECT * FROM users WHERE id = ?`)
    .bind(id)
    .first();
  if (!member) return json({ error: "회원을 찾을 수 없습니다." }, 404);
  if (member.id === auth.user.id) {
    return json({ error: "본인 계정은 삭제할 수 없습니다." }, 400);
  }

  await env.DB.prepare(`DELETE FROM sessions WHERE user_id = ?`).bind(id).run();
  await env.DB.prepare(`DELETE FROM users WHERE id = ?`).bind(id).run();
  return json({ ok: true });
}

export default {
  async fetch(request, env) {
    try {
      if (request.method === "OPTIONS") {
        return withCors(new Response(null, { status: 204 }), request, env);
      }

      await ensureAdmin(env);

      const url = new URL(request.url);
      const path = url.pathname.replace(/\/+$/, "") || "/";

      let response;
      if (request.method === "GET" && (path === "/" || path === "/api/health")) {
        response = json({ ok: true, service: "msg1000-api" });
      } else if (request.method === "POST" && path === "/api/signup") {
        response = await handleSignup(request, env);
      } else if (request.method === "POST" && path === "/api/login") {
        response = await handleLogin(request, env);
      } else if (request.method === "POST" && path === "/api/logout") {
        response = await handleLogout(request, env);
      } else if (request.method === "GET" && path === "/api/me") {
        response = await handleMe(request, env);
      } else if (request.method === "GET" && path === "/api/members") {
        response = await handleMembersList(request, env);
      } else if (request.method === "PATCH" && /^\/api\/members\/\d+$/.test(path)) {
        const id = Number(path.split("/").pop());
        response = await handleMemberPatch(request, env, id);
      } else if (request.method === "DELETE" && /^\/api\/members\/\d+$/.test(path)) {
        const id = Number(path.split("/").pop());
        response = await handleMemberDelete(request, env, id);
      } else {
        response = json({ error: "Not found" }, 404);
      }

      return withCors(response, request, env);
    } catch (err) {
      console.error(err);
      return withCors(json({ error: "서버 오류가 발생했습니다." }, 500), request, env);
    }
  },
};
