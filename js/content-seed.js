const CONTENT_VERSION = "2026-08-11-v3";
const CONTENT_VERSION_KEY = "gnclass-content-version";

function syncSiteContentVersion() {
  try {
    if (localStorage.getItem(CONTENT_VERSION_KEY) === CONTENT_VERSION) return;

    localStorage.setItem(
      "gnclass-attendance",
      JSON.stringify([
        {
          id: "sample-1",
          title: "수애, 보라, 제니, 아영, 소나, 제시",
          createdAt: new Date().toISOString(),
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
          createdAt: new Date().toISOString(),
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
          createdAt: new Date().toISOString(),
          likes: 0,
        },
      ])
    );

    localStorage.setItem(
      "gnclass-profiles",
      JSON.stringify([
        {
          id: "sample-1",
          title: "수애",
          author: "관리자",
          body: "강남클라스 프로필입니다.",
          date: "2026.08.10",
          createdAt: new Date().toISOString(),
          likes: 0,
        },
        {
          id: "sample-2",
          title: "보라",
          author: "관리자",
          body: "강남클라스 프로필입니다.",
          date: "2026.08.10",
          createdAt: new Date().toISOString(),
          likes: 0,
        },
        {
          id: "sample-3",
          title: "제니",
          author: "관리자",
          body: "강남클라스 프로필입니다.",
          date: "2026.08.10",
          createdAt: new Date().toISOString(),
          likes: 0,
        },
      ])
    );

    localStorage.removeItem("gnclass-profile-items");
    localStorage.setItem(CONTENT_VERSION_KEY, CONTENT_VERSION);
  } catch {
    /* ignore */
  }
}

document.addEventListener("DOMContentLoaded", syncSiteContentVersion);
