/* =========================================================
   wall.html — منطق سكرول مريم (مفاجأة + عرض الرسايل)
   ========================================================= */

const lockScreen = document.getElementById("lockScreen");
const partyWall = document.getElementById("partyWall");
let unlocked = false;
let subscribed = false;

// لو الإعدادات مش جاهزة نعرض تنبيه
reportSetup(() => {
  document.getElementById("dbWarn").innerHTML =
    `<div class="warn-banner">الإعدادات مش جاهزة — افتح ملف <code>js/config.js</code>
     وحط مكانها Project URL و Key بتوع Supabase (الشرح كله في <code>README.md</code>)</div>`;
});

heartsRain();

// ====== العد التنازلي وفتح المفاجأة ======
startCountdown(async (isReleased) => {
  if (isReleased) unlock();
});

// فتح بدري بكلمة سر (لو متفعلة في config.js)
if (UNLOCK_CODE && UNLOCK_CODE.trim()) {
  document.getElementById("unlockBonus").style.display = "block";
  const tryCode = () => {
    const val = document.getElementById("codeInput").value.trim();
    if (val === UNLOCK_CODE.trim()) unlock();
    else document.getElementById("codeErr").textContent = "الكلمة دي مش صح، جرّب تاني";
  };
  document.getElementById("codeBtn").addEventListener("click", tryCode);
  document.getElementById("codeInput").addEventListener("keydown", (e) => e.key === "Enter" && tryCode());
}

function unlock() {
  if (unlocked) return;
  unlocked = true;

  lockScreen.style.transition = "opacity .6s, transform .6s";
  lockScreen.style.opacity = "0";
  lockScreen.style.transform = "scale(.9)";
  setTimeout(() => (lockScreen.style.display = "none"), 600);

  partyWall.style.display = "block";
  document.getElementById("todayChip").textContent = "وصلنا";
  if (typeof confetti === "function") {
    const colors = ["#d64a86", "#f8dfe9", "#c2255c", "#ffffff"];
    confetti({ particleCount: 90, spread: 80, origin: { y: 0.5 }, colors, scalar: 0.85 });
    setTimeout(() => confetti({ particleCount: 50, spread: 90, origin: { x: 0.2, y: 0.6 }, colors, scalar: 0.75 }), 500);
    setTimeout(() => confetti({ particleCount: 50, spread: 90, origin: { x: 0.8, y: 0.6 }, colors, scalar: 0.75 }), 900);
  }
  load();
}

// ====== جلب وعرض الرسايل ======
const wallEl = document.getElementById("wall");
const emptyState = document.getElementById("emptyState");
const dateFmt = new Intl.DateTimeFormat("ar-EG", {
  day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit",
});

async function load(silent = false) {
  if (!db) return;
  try {
    const { data, error } = await db
      .from("birthday_messages")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw error;

    document.getElementById("msgCount").textContent = data.length;
    wallEl.innerHTML = "";

    data.forEach((row, i) => {
      const card = document.createElement("article");
      card.className = "msg-card";
      card.style.animationDelay = `${Math.min(i * 0.08, 1.2)}s`;

      const photo = row.photo_url
        ? `<img class="msg-photo" src="${esc(row.photo_url)}" alt="صورة ${esc(row.name)}" loading="lazy" />`
        : `<div class="msg-photo initial">${esc((row.name || "?").charAt(0))}</div>`;

      const love = `<span class="love">حب ${row.hearts || 5} من 5</span>`;

      card.innerHTML = `
        ${photo}
        <div>
          <div class="msg-name">${esc(row.name)} ${love}</div>
          ${row.memory ? `<div class="msg-memory">${esc(row.memory)}</div>` : ""}
          <p class="msg-text">${esc(row.message)}</p>
          <div class="msg-date">${dateFmt.format(new Date(row.created_at))}</div>
        </div>`;
      wallEl.appendChild(card);
    });

    emptyState.style.display = data.length ? "none" : "block";
  } catch (err) {
    console.error(err);
    document.getElementById("dbWarn").innerHTML =
       `<div class="warn-banner">مش قادرين يجيبوا الرسايل (${esc(err.message)}).
       اتأكد إن سكربت <code>supabase-setup.sql</code> اتنفذ من SQL Editor وإن الإعدادات في <code>js/config.js</code> صح.</div>`;
  }

  // realtime: أي رسالة جديدة بتظهر فورًا من غير refresh
  if (!subscribed) {
    subscribed = true;
    db.channel("wall")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "birthday_messages" },
        () => {
          load(true);
          if (typeof confetti === "function") {
            confetti({ particleCount: 25, spread: 60, origin: { y: 0.9 }, colors: ["#d64a86", "#f8dfe9"], scalar: 0.7 });
          }
        }
      )
      .subscribe();
  }
}

document.getElementById("refreshBtn").addEventListener("click", () => load(true));
