/* =========================================================
   common.js — عدّاد + قلوب خفيفة + ضغط صور + أدوات
   ========================================================= */

// ====== Supabase client ======
let db = null;
function initDB() {
  if (!window.supabase) return null;
  const configured = SUPABASE_URL.startsWith("https://") && SUPABASE_ANON_KEY.length > 40;
  if (!configured) return null;
  try {
    return window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (e) {
    console.error("Supabase error:", e);
    return null;
  }
}

function reportSetup(onUnavailable) {
  db = initDB();
  if (!db) onUnavailable();
  return db;
}

// ====== العدّاد ======
function startCountdown(cb) {
  const target = new Date(RELEASE_DATE);
  const parts = [
    ["d", "يوم"],
    ["h", "ساعة"],
    ["m", "دقيقة"],
    ["s", "ثانية"],
  ];

  function tick() {
    const now = new Date();
    const isReleased = now >= target;
    const diff = Math.max(0, target - now);
    const d = Math.floor(diff / 86400000);
    const h = Math.floor(diff / 3600000) % 24;
    const m = Math.floor(diff / 60000) % 60;
    const s = Math.floor(diff / 1000) % 60;
    const vals = { d, h, m, s };

    document.querySelectorAll("[data-countdown]").forEach((host) => {
      host.innerHTML = parts
        .map(
          ([key, label]) =>
            `<div class="cd-card">
               <div class="cd-num">${String(vals[key]).padStart(2, "0")}</div>
               <div class="cd-label">${label}</div>
             </div>`
        )
        .join("");
    });

    if (cb) cb(isReleased, { d, h, m, s });
    setTimeout(tick, 1000);
  }
  tick();
}

// ====== فقاعات بينك خفيفة في الخلفية (بدل الإيموجيز) ======
function heartsRain() {
  const host = document.createElement("div");
  host.className = "float-bg";
  for (let i = 0; i < 14; i++) {
    const el = document.createElement("i");
    el.style.left = Math.random() * 100 + "%";
    el.style.animationDuration = 14 + Math.random() * 14 + "s";
    el.style.animationDelay = Math.random() * 14 + "s";
    const size = 14 + Math.random() * 26;
    el.style.width = size + "px";
    el.style.height = size + "px";
    host.appendChild(el);
  }
  document.body.appendChild(host);
}

// ====== ضغط الصور قبل الرفع ======
function compressImage(file, maxDim = 1200, quality = 0.82) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) return reject(new Error("الملف مش صورة"));
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      let { width, height } = img;
      const ratio = Math.min(1, maxDim / Math.max(width, height));
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
      const c = document.createElement("canvas");
      c.width = width;
      c.height = height;
      c.getContext("2d").drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      c.toBlob(
        (blob) => {
          blob ? resolve(blob) : reject(new Error("مش قادرين نستخدم الصورة"));
        },
        "image/jpeg",
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("الصورة معطوبة"));
    };
    img.src = url;
  });
}

// ====== حماية نصوص المستخدمين (XSS) ======
function esc(str) {
  const d = document.createElement("div");
  d.textContent = str ?? "";
  return d.innerHTML;
}

const LOVE_LABELS = ["عادي", "حلو", "كتير", "أوي", "أوي أوي"];
