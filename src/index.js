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
    "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
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

async function requireMember(request, env) {
  const user = await getUserByToken(env, getBearerToken(request));
  if (!user) return { error: json({ error: "로그인이 필요합니다." }, 401) };
  if (user.status === "banned") return { error: json({ error: "정지된 계정입니다." }, 403) };
  return { user };
}

async function requireAdmin(request, env) {
  const auth = await requireMember(request, env);
  if (auth.error) return auth;
  if (auth.user.role !== "admin") {
    return { error: json({ error: "관리자만 접근할 수 있습니다." }, 403) };
  }
  return auth;
}

function publicPost(row) {
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    body: row.body,
    date: row.date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    likes: row.likes || 0,
    views: row.views || 0,
    userId: row.user_id,
  };
}

function formatDateKo(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}.${m}.${d}`;
}

async function listPosts(env, table) {
  const { results } = await env.DB.prepare(
    `SELECT * FROM ${table} ORDER BY created_at DESC, id DESC`
  ).all();
  return (results || []).map(publicPost);
}

async function getPost(env, table, id) {
  const row = await env.DB.prepare(`SELECT * FROM ${table} WHERE id = ?`)
    .bind(id)
    .first();
  return row ? publicPost(row) : null;
}

async function handleBoardList(env, table) {
  const items = await listPosts(env, table);
  return json({ items });
}

async function handleBoardGet(env, table, id) {
  const item = await getPost(env, table, id);
  if (!item) return json({ error: "글을 찾을 수 없습니다." }, 404);
  return json({ item });
}

async function handleBoardCreate(request, env, table) {
  const adminOnly = table === "attendance" || table === "notices";
  const auth = adminOnly
    ? await requireAdmin(request, env)
    : await requireMember(request, env);
  if (auth.error) return auth.error;

  const body = await readJson(request);
  if (!body) return json({ error: "잘못된 요청입니다." }, 400);

  const title = String(body.title || "").trim();
  const content = String(body.body || "").trim();
  const requireBody = table !== "attendance";
  if (!title || (requireBody && !content)) {
    return json(
      { error: requireBody ? "제목과 내용을 입력해 주세요." : "제목을 입력해 주세요." },
      400
    );
  }
  if (title.length > 200) return json({ error: "제목이 너무 깁니다." }, 400);
  if (content.length > 10000) return json({ error: "내용이 너무 깁니다." }, 400);

  const author =
    body.author != null && String(body.author).trim()
      ? String(body.author).trim()
      : String(auth.user.nickname || auth.user.username);
  const id = `${Date.now()}-${randomHex(4)}`;
  const createdAt = new Date().toISOString();
  const date = formatDateKo();

  await env.DB.prepare(
    `INSERT INTO ${table}
      (id, title, author, body, date, created_at, likes, views, user_id)
     VALUES (?, ?, ?, ?, ?, ?, 0, 0, ?)`
  )
    .bind(id, title, author, content, date, createdAt, auth.user.id)
    .run();

  const item = await getPost(env, table, id);
  return json({ item }, 201);
}

async function handleBoardPatch(request, env, table, id) {
  const auth = await requireAdmin(request, env);
  if (auth.error) return auth.error;

  const existing = await env.DB.prepare(`SELECT * FROM ${table} WHERE id = ?`)
    .bind(id)
    .first();
  if (!existing) return json({ error: "글을 찾을 수 없습니다." }, 404);

  const body = await readJson(request);
  if (!body) return json({ error: "잘못된 요청입니다." }, 400);

  const title = body.title != null ? String(body.title).trim() : existing.title;
  const content = body.body != null ? String(body.body).trim() : existing.body;
  const author =
    body.author != null ? String(body.author).trim() : existing.author;
  const requireBody = table !== "attendance";

  if (!title || (requireBody && !content)) {
    return json(
      { error: requireBody ? "제목과 내용을 입력해 주세요." : "제목을 입력해 주세요." },
      400
    );
  }

  await env.DB.prepare(
    `UPDATE ${table}
     SET title = ?, author = ?, body = ?, updated_at = ?
     WHERE id = ?`
  )
    .bind(title, author, content, new Date().toISOString(), id)
    .run();

  const item = await getPost(env, table, id);
  return json({ item });
}

async function handleBoardDelete(request, env, table, id) {
  const auth = await requireAdmin(request, env);
  if (auth.error) return auth.error;

  const existing = await env.DB.prepare(`SELECT id FROM ${table} WHERE id = ?`)
    .bind(id)
    .first();
  if (!existing) return json({ error: "글을 찾을 수 없습니다." }, 404);

  await env.DB.prepare(`DELETE FROM ${table} WHERE id = ?`).bind(id).run();
  return json({ ok: true });
}

async function handlePopupGet(env) {
  const row = await env.DB.prepare(`SELECT * FROM popup_config WHERE id = 1`).first();
  if (!row) {
    return json({
      popup: {
        enabled: true,
        title: "임시 작업중 입니다.",
        body: "참고바랍니다.",
        updatedAt: null,
      },
    });
  }
  return json({
    popup: {
      enabled: !!row.enabled,
      title: row.title,
      body: row.body,
      updatedAt: row.updated_at,
    },
  });
}

async function handlePopupPut(request, env) {
  const auth = await requireAdmin(request, env);
  if (auth.error) return auth.error;

  const body = await readJson(request);
  if (!body) return json({ error: "잘못된 요청입니다." }, 400);

  const title = String(body.title || "").trim();
  const content = String(body.body || "").trim();
  if (!title || !content) {
    return json({ error: "제목과 내용을 입력해 주세요." }, 400);
  }

  const enabled = body.enabled !== false ? 1 : 0;
  const updatedAt = new Date().toISOString();

  await env.DB.prepare(
    `INSERT INTO popup_config (id, enabled, title, body, updated_at)
     VALUES (1, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       enabled = excluded.enabled,
       title = excluded.title,
       body = excluded.body,
       updated_at = excluded.updated_at`
  )
    .bind(enabled, title, content, updatedAt)
    .run();

  return handlePopupGet(env);
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
      } else if (request.method === "GET" && path === "/api/reviews") {
        response = await handleBoardList(env, "reviews");
      } else if (request.method === "POST" && path === "/api/reviews") {
        response = await handleBoardCreate(request, env, "reviews");
      } else if (request.method === "GET" && /^\/api\/reviews\/[^/]+$/.test(path)) {
        response = await handleBoardGet(env, "reviews", decodeURIComponent(path.split("/").pop()));
      } else if (request.method === "PATCH" && /^\/api\/reviews\/[^/]+$/.test(path)) {
        response = await handleBoardPatch(
          request,
          env,
          "reviews",
          decodeURIComponent(path.split("/").pop())
        );
      } else if (request.method === "DELETE" && /^\/api\/reviews\/[^/]+$/.test(path)) {
        response = await handleBoardDelete(
          request,
          env,
          "reviews",
          decodeURIComponent(path.split("/").pop())
        );
      } else if (request.method === "GET" && path === "/api/profiles") {
        response = await handleBoardList(env, "profiles");
      } else if (request.method === "POST" && path === "/api/profiles") {
        response = await handleBoardCreate(request, env, "profiles");
      } else if (request.method === "GET" && /^\/api\/profiles\/[^/]+$/.test(path)) {
        response = await handleBoardGet(env, "profiles", decodeURIComponent(path.split("/").pop()));
      } else if (request.method === "PATCH" && /^\/api\/profiles\/[^/]+$/.test(path)) {
        response = await handleBoardPatch(
          request,
          env,
          "profiles",
          decodeURIComponent(path.split("/").pop())
        );
      } else if (request.method === "DELETE" && /^\/api\/profiles\/[^/]+$/.test(path)) {
        response = await handleBoardDelete(
          request,
          env,
          "profiles",
          decodeURIComponent(path.split("/").pop())
        );
      } else if (request.method === "GET" && path === "/api/notices") {
        response = await handleBoardList(env, "notices");
      } else if (request.method === "POST" && path === "/api/notices") {
        response = await handleBoardCreate(request, env, "notices");
      } else if (request.method === "GET" && /^\/api\/notices\/[^/]+$/.test(path)) {
        response = await handleBoardGet(env, "notices", decodeURIComponent(path.split("/").pop()));
      } else if (request.method === "PATCH" && /^\/api\/notices\/[^/]+$/.test(path)) {
        response = await handleBoardPatch(
          request,
          env,
          "notices",
          decodeURIComponent(path.split("/").pop())
        );
      } else if (request.method === "DELETE" && /^\/api\/notices\/[^/]+$/.test(path)) {
        response = await handleBoardDelete(
          request,
          env,
          "notices",
          decodeURIComponent(path.split("/").pop())
        );
      } else if (request.method === "GET" && path === "/api/attendance") {
        response = await handleBoardList(env, "attendance");
      } else if (request.method === "POST" && path === "/api/attendance") {
        response = await handleBoardCreate(request, env, "attendance");
      } else if (request.method === "GET" && /^\/api\/attendance\/[^/]+$/.test(path)) {
        response = await handleBoardGet(
          env,
          "attendance",
          decodeURIComponent(path.split("/").pop())
        );
      } else if (request.method === "PATCH" && /^\/api\/attendance\/[^/]+$/.test(path)) {
        response = await handleBoardPatch(
          request,
          env,
          "attendance",
          decodeURIComponent(path.split("/").pop())
        );
      } else if (request.method === "DELETE" && /^\/api\/attendance\/[^/]+$/.test(path)) {
        response = await handleBoardDelete(
          request,
          env,
          "attendance",
          decodeURIComponent(path.split("/").pop())
        );
      } else if (request.method === "GET" && path === "/api/popup") {
        response = await handlePopupGet(env);
      } else if (request.method === "PUT" && path === "/api/popup") {
        response = await handlePopupPut(request, env);
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
