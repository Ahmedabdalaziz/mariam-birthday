/* =========================================================
   💌 friends.html — منطق صفحة إرسال الرسايل
   ========================================================= */

// ====== إعداد الواجهة (وكالة على طول لو مش جاهزة) ======
reportSetup(() => {
  document.getElementById("setupWarn").innerHTML =
    `<div class="warn-banner">الإعدادات مش جاهزة — افتح ملف <code>js/config.js</code>
     وحط مكانها Project URL و Key بتوع Supabase (الشرح كله في <code>README.md</code>)</div>`;
});

// ====== إدراج الاسم في كل الأماكن ======
SITE_NAME && document.querySelectorAll("[data-her-name]").forEach((el) => (el.textContent = SITE_NAME));

// ====== مقياس الحب ======
let hearts = 5;
const loveScale = document.getElementById("loveScale");
const loveHint = document.getElementById("loveHint");
LOVE_LABELS.forEach((label, i) => {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.setAttribute("aria-label", label);
  btn.innerHTML = `<span>${i + 1}</span>`;
  btn.title = label;
  if (i === 4) btn.classList.add("on");
  btn.addEventListener("click", () => {
    hearts = i + 1;
    loveScale.querySelectorAll("button").forEach((b, j) => b.classList.toggle("on", j <= i));
    loveHint.textContent = LOVE_LABELS[i];
  });
  loveScale.appendChild(btn);
});
loveHint.textContent = LOVE_LABELS[4];

// ====== الصورة 📸 ======
const photoInput = document.getElementById("photo");
const drop = document.getElementById("drop");
const preview = document.getElementById("preview");
let photoFile = null;

drop.addEventListener("click", () => photoInput.click());
drop.addEventListener("keydown", (e) => e.key === "Enter" && photoInput.click());
photoInput.addEventListener("change", () => setPhoto(photoInput.files[0]));

["dragover", "dragenter", "dragleave", "drop"].forEach((ev) =>
  drop.addEventListener(ev, (e) => {
    e.preventDefault();
    drop.classList.toggle("drag", ev === "dragover" || ev === "dragenter");
  })
);
drop.addEventListener("drop", (e) => {
  const file = e.dataTransfer.files?.[0];
  if (file) setPhoto(file);
});

function setPhoto(file) {
  if (!file) return;
  if (!file.type.startsWith("image/")) return showErr("الملف ده مش صورة");
  photoFile = file;
  preview.src = URL.createObjectURL(file);
  preview.style.display = "block";
  document.getElementById("dropIdle").style.display = "none";
}

// ====== الفورم ======
const form = document.getElementById("wishForm");
const sendBtn = document.getElementById("sendBtn");
const errBox = document.getElementById("err");

function showErr(msg) { errBox.textContent = msg; }
function busy(on) {
  sendBtn.disabled = on;
  sendBtn.textContent = on ? "بيبعت…" : "إرسال";
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  showErr("");

  const name = document.getElementById("name").value.trim();
  const message = document.getElementById("message").value.trim();
  const memory = document.getElementById("memory").value.trim();

  if (!name) return showErr("اكتب اسمك الأول");
  if (!message) return showErr("رسالتك مهمة، اكتب جملة حلوة");
  if (!memory) return showErr("وصف مريم مهم — اكتب حتى سطر واحد");
  if (!db) return showErr("الإعدادات مش جاهزة — راجع js/config.js");

  busy(true);
  try {
    // 1) ارفع الصورة (لو في) بعد ما نضغطها
    let photo_url = null;
    if (photoFile) {
      const blob = await compressImage(photoFile);
      const path = `photos/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.jpg`;
      const up = await db.storage.from("birthday-photos").upload(path, blob, { contentType: "image/jpeg" });
      if (up.error) throw up.error;
      photo_url = db.storage.from("birthday-photos").getPublicUrl(path).data.publicUrl;
    }

    // 2) احفظ الرسالة
    const ins = await db.from("birthday_messages").insert({ name, message, memory, hearts, photo_url });
    if (ins.error) throw ins.error;

    // نجاح
    form.style.display = "none";
    document.getElementById("successBox").style.display = "block";
    if (typeof confetti === "function") {
      const colors = ["#d64a86", "#f8dfe9", "#c2255c", "#ffffff"];
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 }, colors, scalar: 0.8 });
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (err) {
    console.error(err);
    showErr(
      err?.message?.includes("row-level security") || err?.message?.includes("bucket")
        ? "مشكلة صلاحيات قاعدة البيانات — راجع سكربت SQL في README"
        : "حصلت مشكلة في الإرسال، جرّب تاني أو راجع README"
    );
  } finally {
    busy(false);
  }
});

// زر "رسالة تانية"
document.getElementById("againBtn").addEventListener("click", () => {
  form.reset();
  photoFile = null;
  preview.style.display = "none";
  document.getElementById("dropIdle").style.display = "block";
  document.getElementById("successBox").style.display = "none";
  form.style.display = "block";
  showErr("");
});
