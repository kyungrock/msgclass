const CONTENT_VERSION = "2026-08-11-v11";
const CONTENT_VERSION_KEY = "gnclass-content-version";

function getSeedProfiles() {
  return typeof NF_PROFILES_SEED !== "undefined" && Array.isArray(NF_PROFILES_SEED)
    ? NF_PROFILES_SEED
    : [];
}

function getSeedReviews() {
  return typeof BANGMUN_REVIEWS_SEED !== "undefined" && Array.isArray(BANGMUN_REVIEWS_SEED)
    ? BANGMUN_REVIEWS_SEED
    : [];
}

function getSeedNotices() {
  return typeof GONGJI_NOTICES_SEED !== "undefined" && Array.isArray(GONGJI_NOTICES_SEED)
    ? GONGJI_NOTICES_SEED
    : [];
}

function syncSiteContentVersion() {
  try {
    const current = localStorage.getItem(CONTENT_VERSION_KEY);
    const seedProfiles = getSeedProfiles();
    const seedReviews = getSeedReviews();
    const seedNotices = getSeedNotices();

    if (current !== CONTENT_VERSION) {
      localStorage.setItem(
        "gnclass-attendance",
        JSON.stringify([
          {
            id: "sample-1",
            title: "NF희나, NF유정, 다인, 우리, 민주, 소이, 다윤, 윤진, 제시, 제니, 아영, 시연",
            createdAt: "2026-08-10T12:00:00.000Z",
          },
        ])
      );

      if (seedReviews.length) {
        localStorage.setItem("gnclass-reviews", JSON.stringify(seedReviews));
      }

      if (seedNotices.length) {
        localStorage.setItem("gnclass-notices", JSON.stringify(seedNotices));
      }

      if (seedProfiles.length) {
        localStorage.setItem("gnclass-profiles", JSON.stringify(seedProfiles));
      }
      localStorage.removeItem("gnclass-profile-items");
      localStorage.setItem(CONTENT_VERSION_KEY, CONTENT_VERSION);
    }

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
            title: "NF희나, NF유정, 다인, 우리, 민주, 소이, 다윤, 윤진, 제시, 제니, 아영, 시연",
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
    if ((!Array.isArray(profiles) || profiles.length === 0) && seedProfiles.length) {
      localStorage.setItem("gnclass-profiles", JSON.stringify(seedProfiles));
    }

    const reviewsRaw = localStorage.getItem("gnclass-reviews");
    let reviews = [];
    try {
      reviews = JSON.parse(reviewsRaw || "[]");
    } catch {
      reviews = [];
    }
    if ((!Array.isArray(reviews) || reviews.length === 0) && seedReviews.length) {
      localStorage.setItem("gnclass-reviews", JSON.stringify(seedReviews));
    }

    const noticesRaw = localStorage.getItem("gnclass-notices");
    let notices = [];
    try {
      notices = JSON.parse(noticesRaw || "[]");
    } catch {
      notices = [];
    }
    if ((!Array.isArray(notices) || notices.length === 0) && seedNotices.length) {
      localStorage.setItem("gnclass-notices", JSON.stringify(seedNotices));
    }
  } catch {
    /* ignore */
  }
}

document.addEventListener("DOMContentLoaded", syncSiteContentVersion);
