
(() => {
  "use strict";

  const SITE_ID = "5b7f178e-61e9-47b6-8963-bc5177c71b4b";
  const ENDPOINT =
    "https://okdteswmwtdttvbmzbrz.supabase.co/functions/v1/collect-event";

  const SESSION_TIMEOUT = 30 * 60 * 1000;

  function getVisitorId() {
    try {
      let id = localStorage.getItem("ga_visitor_id");

      if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem("ga_visitor_id", id);
      }

      return id;
    } catch {
      return crypto.randomUUID();
    }
  }

  function getSessionId() {
    const now = Date.now();

    try {
      const saved = JSON.parse(
        sessionStorage.getItem("ga_session") || "null"
      );

      if (
        saved &&
        typeof saved.id === "string" &&
        now - saved.lastActive < SESSION_TIMEOUT
      ) {
        saved.lastActive = now;
        sessionStorage.setItem("ga_session", JSON.stringify(saved));
        return saved.id;
      }

      const session = {
        id: crypto.randomUUID(),
        lastActive: now
      };

      sessionStorage.setItem("ga_session", JSON.stringify(session));
      return session.id;
    } catch {
      return crypto.randomUUID();
    }
  }

  const visitorId = getVisitorId();
  const sessionId = getSessionId();

  function track(eventType, extra = {}) {
    const payload = {
      site_id: SITE_ID,
      event_type: eventType,
      visitor_id: visitorId,
      session_id: sessionId,
      event_id: crypto.randomUUID(),
      page_path: window.location.pathname,
      referrer_host: document.referrer
        ? new URL(document.referrer).hostname
        : "",
      ...extra
    };

    fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
      keepalive: true
    }).catch(error => {
      console.warn("Guiding Analytics:", error);
    });
  }

  track("page_view");

  window.GuidingAnalytics = {
    track
  };
})();
