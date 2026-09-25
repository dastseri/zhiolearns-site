/* ============================================================================
   ZhioLearns privacy-safe analytics — added 2026-09-25
   ----------------------------------------------------------------------------
   What it does:
   - zlgTrack(eventName, series, detail)  → writes ONE row to the Supabase
     `events` table via the public REST endpoint.
   - zlgTrackPageview()                  → exactly one 'pageview' per browser
     session (sessionStorage guard), called automatically on page load.
   - zlgIdentify(memberId, accessToken)   → optional warm-up hook: the page's
     own auth flow calls this right after sign-in so events are attributed
     immediately instead of waiting for the identity cache refresh.

   Per-member engagement (added 2026-09-25, owner request):
   - When a parent is logged in, each event carries member_id = their own
     account id (parents-only accounts; no child data exists on this site).
   - Logged-in POSTs use the user's own JWT as the Authorization bearer, so
     the RLS policy `member_id = auth.uid()` is enforced server-side: a user
     can only ever attribute events to THEMSELVES. Spoofing is impossible.
   - When logged out, events are sent with member_id = null under the anon
     key, and the RLS policy requires member_id IS NULL for anon inserts.
   - Nothing else identifying is ever sent: no IP, no fingerprint, no cookies.

   Reliability: fire-and-forget. If Supabase is unreachable (offline, CDN
   blocked, project paused) every call silently no-ops. It MUST never break
   the page — wrap call sites in `if (window.zlgTrack)` for extra safety.
   ============================================================================ */
(function () {
  'use strict';

  var SESSION_FLAG = 'zlg_pv_sent';
  var CACHE_MS = 60 * 1000; /* re-check auth session at most once a minute */
  var _sb = null;
  var _idCache = { at: 0, memberId: null, token: null };

  function cfgOk() {
    try {
      return typeof SUPABASE_URL !== 'undefined' &&
             typeof SUPABASE_ANON_KEY !== 'undefined' &&
             !!SUPABASE_URL && !!SUPABASE_ANON_KEY;
    } catch (e) { return false; }
  }

  /* Own lightweight client sharing the page's stored session (localStorage). */
  function client() {
    try {
      if (!_sb && cfgOk() && window.supabase) {
        _sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      }
    } catch (e) { /* never break the page */ }
    return _sb;
  }

  /* Resolve { memberId, token } for the current visitor; cached briefly.
     Uses the locally stored session (no network), so it works offline and
     never delays the page. */
  function identity() {
    var now = Date.now();
    if (now - _idCache.at < CACHE_MS) return Promise.resolve(_idCache);
    var sb = client();
    if (!sb) return Promise.resolve(_idCache);
    return sb.auth.getSession().then(function (s) {
      var sess = s.data && s.data.session;
      _idCache = {
        at: now,
        memberId: sess ? sess.user.id : null,
        token: sess ? sess.access_token : null
      };
      return _idCache;
    }).catch(function () {
      _idCache = { at: now, memberId: null, token: null };
      return _idCache;
    });
  }

  /** Manual warm-up: call right after the page's own sign-in completes. */
  window.zlgIdentify = function (memberId, accessToken) {
    try {
      _idCache = {
        at: Date.now(),
        memberId: memberId || null,
        token: accessToken || null
      };
    } catch (e) { /* never break the page */ }
  };

  function post(row, token) {
    try {
      if (!cfgOk()) return;
      fetch(SUPABASE_URL + '/rest/v1/events', {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          /* Logged-in: the user's own JWT → RLS sees authenticated + auth.uid().
             Logged-out: the anon key → RLS sees anon, member_id must be null. */
          'Authorization': 'Bearer ' + (token || SUPABASE_ANON_KEY),
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(row),
        keepalive: true
      }).catch(function () { /* analytics must never surface errors */ });
    } catch (e) { /* never break the page */ }
  }

  /**
   * Track one analytics event.
   * @param {string} eventName 'pageview' | 'game_start' | 'level_complete' | 'printable_download'
   * @param {string|null} series 'adventure' | 'puzzle' | 'maze' (or null)
   * @param {string|null} detail level number (1-based) or printable slug (or null)
   */
  window.zlgTrack = function (eventName, series, detail) {
    try {
      var ok = eventName === 'pageview' ||
               eventName === 'game_start' ||
               eventName === 'level_complete' ||
               eventName === 'printable_download';
      if (!ok) return;
      var s = (series === 'adventure' || series === 'puzzle' || series === 'maze') ? series : null;
      var row = {
        event_name: eventName,
        series: s,
        detail: (detail == null || detail === '') ? null : String(detail).slice(0, 120),
        member_id: null
      };
      /* Fire-and-forget: resolve identity, then send. Never throws. */
      identity().then(function (id) {
        if (id.memberId) row.member_id = id.memberId;
        post(row, id.token);
      }).catch(function () { /* never break the page */ });
    } catch (e) { /* never break the page */ }
  };

  /** Send exactly one pageview per browser session. Safe to call any time. */
  window.zlgTrackPageview = function () {
    try {
      var done = false;
      try { done = !!window.sessionStorage.getItem(SESSION_FLAG); } catch (e) {}
      if (done) return;
      try { window.sessionStorage.setItem(SESSION_FLAG, '1'); } catch (e) {}
      window.zlgTrack('pageview');
    } catch (e) { /* never break the page */ }
  };

  /* Automatic pageview on load. */
  try {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      window.zlgTrackPageview();
    } else {
      document.addEventListener('DOMContentLoaded', function () { window.zlgTrackPageview(); });
    }
  } catch (e) { /* never break the page */ }
})();
