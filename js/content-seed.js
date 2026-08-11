const CONTENT_VERSION = "2026-08-11-v5";
const CONTENT_VERSION_KEY = "gnclass-content-version";

const SEED_PROFILES = [
  {
    id: "sample-1",
    title: "수애",
    author: "관리자",
    body: "강남클라스 프로필입니다.",
    date: "2026.08.10",
    createdAt: "2026-08-10T12:00:00.000Z",
    likes: 0,
  },
  {
    id: "sample-2",
    title: "보라",
    author: "관리자",
    body: "강남클라스 프로필입니다.",
    date: "2026.08.10",
    createdAt: "2026-08-10T11:00:00.000Z",
    likes: 0,
  },
  {
    id: "sample-3",
    title: "제니",
    author: "관리자",
    body: "강남클라스 프로필입니다.",
    date: "2026.08.10",
    createdAt: "2026-08-10T10:00:00.000Z",
    likes: 0,
  },
  {
    id: "sample-4",
    title: "아영",
    author: "관리자",
    body: "강남클라스 프로필입니다.",
    date: "2026.08.10",
    createdAt: "2026-08-10T09:00:00.000Z",
    likes: 0,
  },
  {
    id: "sample-5",
    title: "소나",
    author: "관리자",
    body: "강남클라스 프로필입니다.",
    date: "2026.08.10",
    createdAt: "2026-08-10T08:00:00.000Z",
    likes: 0,
  },
  {
    id: "sample-6",
    title: "제시",
    author: "관리자",
    body: "강남클라스 프로필입니다.",
    date: "2026.08.10",
    createdAt: "2026-08-10T07:00:00.000Z",
    likes: 0,
  },
];

function syncSiteContentVersion() {
  try {
    const current = localStorage.getItem(CONTENT_VERSION_KEY);
    if (current !== CONTENT_VERSION) {
      localStorage.setItem(
        "gnclass-attendance",
        JSON.stringify([
          {
            id: "sample-1",
            title: "NF희나 NF유정 다인 우리 민주 소이 다윤 윤진 제시 제니 아영 시연",
            createdAt: "2026-08-10T12:00:00.000Z",
          },
        ])
      );

      localStorage.setItem(
        "gnclass-reviews",
        JSON.stringify([
          {
            id: "sample-1",
            title: "수애",
            author: "손님",
            body: "정성스럽게 너무 좋았어요",
            date: "2026.08.10",
            createdAt: "2026-08-10T12:00:00.000Z",
            likes: 0,
          },
        ])
      );

      localStorage.setItem(
        "gnclass-notices",
        JSON.stringify([
          {
            id: "sample-1",
            title: "텔레그램 문의 가능합니다.",
            author: "운영자",
            body: "텔레그램으로도 문의가 가능합니다.",
            date: "2026.08.10",
            createdAt: "2026-08-10T12:00:00.000Z",
            likes: 0,
          },
        ])
      );

      localStorage.setItem("gnclass-profiles", JSON.stringify(SEED_PROFILES));
      localStorage.removeItem("gnclass-profile-items");
      localStorage.setItem(CONTENT_VERSION_KEY, CONTENT_VERSION);
    }

    // 출근부/프로필이 비어 있으면 기본글 채움
    const attendanceRaw = localStorage.getItem("gnclass-attendance");
    let attendance = [];
    try {
      attendance = JSON.parse(attendanceRaw || "[]");
    } catch {
      attendance = [];
    }
    if (!Array.isArray(attendance) || attendance.length === 0) {
      localStorage.setItem(
        "gnclass-attendance",
        JSON.stringify([
          {
            id: "sample-1",
            title: "NF희나 NF유정 다인 우리 민주 소이 다윤 윤진 제시 제니 아영 시연",
            createdAt: "2026-08-10T12:00:00.000Z",
          },
        ])
      );
    }

    const profilesRaw = localStorage.getItem("gnclass-profiles");
    let profiles = [];
    try {
      profiles = JSON.parse(profilesRaw || "[]");
    } catch {
      profiles = [];
    }
    if (!Array.isArray(profiles) || profiles.length === 0) {
      localStorage.setItem("gnclass-profiles", JSON.stringify(SEED_PROFILES));
    }
  } catch {
    /* ignore */
  }
}

document.addEventListener("DOMContentLoaded", syncSiteContentVersion);
