/**
 * auth-guard.js
 * ใส่ใน <head> ของทุกหน้าที่ต้องการ login ก่อนเข้าถึง
 * ต้องโหลดหลัง Firebase SDK
 *
 * วิธีใช้:
 *   <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"></script>
 *   <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js"></script>
 *   <script src="auth-guard.js"></script>
 */

// ─── Firebase config (เหมือนใน login.html) ────────────────────────────────
const _FIREBASE_CONFIG = {
  apiKey:            "AIzaSyAM1iGG5pTvVanGhigSoQxoTUUuc-vxv-w",
  authDomain:        "school-info-bot.firebaseapp.com",
  projectId:         "school-info-bot",
  storageBucket:     "school-info-bot.firebasestorage.app",
  messagingSenderId: "7049219218",
  appId:             "1:7049219218:web:41f2fd74607188134b6a4b"
};
// ──────────────────────────────────────────────────────────────────────────

(function () {
  const IS_CONFIGURED = _FIREBASE_CONFIG.apiKey !== "YOUR_API_KEY";

  // ถ้ายังไม่ได้ตั้งค่า Firebase ให้ข้าม guard (dev mode)
  if (!IS_CONFIGURED) {
    console.warn('[auth-guard] Firebase not configured — guard disabled');
    return;
  }

  // Init Firebase (ป้องกัน init ซ้ำถ้ามีอยู่แล้ว)
  if (!firebase.apps.length) {
    firebase.initializeApp(_FIREBASE_CONFIG);
  }

  const auth = firebase.auth();

  // ซ่อนเนื้อหาก่อนเช็ค session (ป้องกัน flash)
  document.documentElement.style.visibility = 'hidden';

  auth.onAuthStateChanged(function (user) {
    if (user) {
      // ล็อกอินแล้ว → แสดงหน้า + ใส่ข้อมูล user ให้ header
      document.documentElement.style.visibility = '';
      _injectUserBar(user);
    } else {
      // ยังไม่ล็อกอิน → redirect ไป login.html
      const next = encodeURIComponent(location.pathname + location.search);
      location.replace('login.html?next=' + next);
    }
  });

  function _injectUserBar(user) {
    // รอให้ DOM พร้อมก่อน inject
    function inject() {
      if (document.getElementById('_auth_userbar')) return;

      const bar = document.createElement('div');
      bar.id = '_auth_userbar';
      bar.style.cssText = [
        'position:fixed', 'bottom:12px', 'right:12px', 'z-index:9999',
        'background:#1a3a6e', 'color:#fff',
        'border-radius:24px', 'padding:6px 14px 6px 8px',
        'display:flex', 'align-items:center', 'gap:8px',
        'font-family:Sarabun,sans-serif', 'font-size:0.82rem',
        'box-shadow:0 4px 16px rgba(0,0,0,0.25)',
        'cursor:default', 'user-select:none',
      ].join(';');

      const avatar = user.photoURL
        ? `<img src="${user.photoURL}" style="width:26px;height:26px;border-radius:50%;object-fit:cover;">`
        : `<span style="width:26px;height:26px;border-radius:50%;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-size:0.9rem;">👤</span>`;

      const name = user.displayName || user.email || 'ผู้ใช้';

      bar.innerHTML = `
        ${avatar}
        <span style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${name}</span>
        <button onclick="_authSignOut()" title="ออกจากระบบ" style="
          background:rgba(255,255,255,0.15);border:none;color:#fff;
          width:22px;height:22px;border-radius:50%;cursor:pointer;
          font-size:0.75rem;display:flex;align-items:center;justify-content:center;
          padding:0;margin-left:2px;
        ">✕</button>
      `;
      document.body.appendChild(bar);
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', inject);
    } else {
      inject();
    }
  }

  // expose globally so logout button can call it
  window._authSignOut = function () {
    firebase.auth().signOut().then(() => {
      location.replace('login.html');
    });
  };
})();
