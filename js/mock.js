/* ==========================================================================
   Mockup engine: keeps the demo "real" inside the browser (localStorage).
   - Store.user      signed-in applicant (null = guest)
   - Store.profile   applicant profile filled once (steps 1-3)
   - Store.draft     application in progress (program + round)
   - Store.apps      submitted applications with their status
   Nothing is sent anywhere; "รีเซ็ตข้อมูลจำลอง" in the footer clears it all.
   Page flags: <body data-auth="1"> needs sign-in, data-nav = highlighted menu,
   data-step = active step (0-5) in the apply stepper.
   ========================================================================== */

const KEY = { user:"mk_user", profile:"mk_profile", draft:"mk_draft", apps:"mk_apps" };

function load(k, fb){ try{ const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; }catch(e){ return fb; } }
function save(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
function esc(s){ return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c])); }
function qs(n){ return new URLSearchParams(location.search).get(n); }
function thisPage(){ return location.pathname.split("/").pop() + location.search; }

/* sample answers so every form already looks filled in, like the Figma screens */
const SAMPLE_PROFILE = {
  idcard:"1 2599 00123 45 6", title:"นาย", dob:"05/05/2551", fname:"สมชาย", lname:"ใจดี",
  fname_en:"Somchai", lname_en:"Jaidee", gender:"ชาย", special:"ไม่มี",
  email:"somchai@example.com", phone:"081-234-5678", address:"99 หมู่ 1 ถนนสุวรรณศร", province:"ปราจีนบุรี", zip:"25000",
  g_rel:"มารดา", g_name:"นางสมศรี ใจดี", g_phone:"089-876-5432", g_same:true, f_name:"", f_phone:"", m_name:"", m_phone:"",
  e_state:"กำลังศึกษาอยู่", e_level:"มัธยมศึกษาปีที่ 6 (สายวิทย์-คณิต)", e_plan:"วิทย์-คณิต", e_school:"โรงเรียนปราจีนกัลยาณี",
  gpax:"3.45", grad:"2569", l_type:"ไม่มี", l_score:"", talent:""
};

const Store = {
  get user(){ return load(KEY.user, null); },
  signIn(email){
    const p = this.profile;
    save(KEY.user, { email, name: p.done ? fullName(p) : email.split("@")[0] });
  },
  signOut(){ localStorage.removeItem(KEY.user); location.href = "index.html"; },

  get profile(){ return Object.assign({}, SAMPLE_PROFILE, load(KEY.profile, {})); },
  saveProfile(part){
    const p = Object.assign(load(KEY.profile, {}), part);
    save(KEY.profile, p);
    const u = this.user;
    if(u && p.fname) save(KEY.user, Object.assign(u, { name: fullName(this.profile) }));
  },

  get draft(){ return load(KEY.draft, { code:"INE", round:"รอบ 1 Portfolio" }); },
  saveDraft(part){ save(KEY.draft, Object.assign(this.draft, part)); },

  get apps(){ return load(KEY.apps, []); },
  saveApps(a){ save(KEY.apps, a); },
  app(id){ return this.apps.find(a => a.id === id); },
  setStatus(id, status){ const a = this.apps; const x = a.find(v => v.id === id); if(x){ x.status = status; this.saveApps(a); } },
  submit(){
    const d = this.draft;
    const a = this.apps.filter(x => x.code !== d.code);   /* one application per program */
    const now = new Date();
    const app = {
      id: "2570-TM-" + String(Math.floor(10000 + Math.random() * 89999)),
      code: d.code, round: d.round, status: "unpaid",
      submittedAt: now.toLocaleDateString("th-TH", { day:"numeric", month:"short", year:"numeric" })
    };
    a.unshift(app);
    this.saveApps(a);
    return app;
  },

  reset(){ Object.values(KEY).forEach(k => localStorage.removeItem(k)); localStorage.removeItem("mock_code"); location.href = "index.html"; }
};

function fullName(p){ return (p.title || "") + (p.fname || "") + " " + (p.lname || ""); }
function programByCode(c){ return PROGRAMS.find(p => p.code === String(c || "").toUpperCase()); }
function chosenProgram(){ return programByCode(Store.draft.code) || programByCode("INE"); }

/* where "สมัครหลักสูตรนี้" should lead: sign in first, fill the profile once, then round & documents */
function applyUrl(code){
  if(!Store.user) return "login.html?next=apply&code=" + code;
  return (Store.profile.done ? "apply.html" : "profile-1.html") + "?code=" + code;
}

/* ---------- program cards ---------- */
const DEGREE_TAG = { bachelor:"ปริญญาตรี 4-5 ปี", continuing2:"ต่อเนื่อง 2 ปี", transfer25:"เทียบโอน 2 ปีครึ่ง", transfer3:"เทียบโอน 3 ปี" };
const CARD_ORDER = ["INE","IT","CA","IEM","MM","AFE","ITI","IMT","MMT","CDM","AFET","INET"];
const CARD_NAME = {
  INE:"วิศวกรรมสารสนเทศและเครือข่าย\n(ส่งเสริมภาษาอังกฤษ)", IEM:"วิศวกรรมอุตสาหการและการจัดการ\n(ส่งเสริมภาษาอังกฤษ)",
  CA:"คอมพิวเตอร์ช่วยออกแบบ\nและบริหารงานก่อสร้าง", CDM:"คอมพิวเตอร์ช่วยออกแบบ\nและบริหารงานก่อสร้าง",
  MM:"เทคโนโลยีเครื่องกล\nและกระบวนการผลิต", MMT:"เทคโนโลยีเครื่องกล\nและกระบวนการผลิต"
};
function orderedPrograms(){ return CARD_ORDER.map(programByCode).filter(Boolean); }
function cardName(p){ return CARD_NAME[p.code] || p.nameTh.replace("สาขาวิชา", "").replace(/ \((ต่อเนื่อง|เทียบโอน)\)$/, ""); }
function programCard(p){
  return `
    <a class="pcard" href="major.html?code=${p.code}">
      <span class="cover"><span class="tag">${DEGREE_TAG[p.degreeGroup]}</span><span class="code">${p.code}</span></span>
      <span class="plate"><span class="name">${esc(cardName(p))}</span><span class="fee">${esc(p.tuition)} บาท/ภาค</span></span>
    </a>`;
}

/* ---------- header / footer ---------- */
const MENU_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z"/></svg>';
function renderHeader(){
  const mount = document.getElementById("header");
  if(!mount) return;
  const u = Store.user;
  const current = document.body.dataset.nav || "";
  const links = [["index.html","หน้าแรก"],["programs.html","หลักสูตร"],["status.html","ใบสมัครของฉัน"],["contact.html","ติดต่อเรา"]]
    .map(([h, l]) => `<a href="${h}" ${h === current ? 'aria-current="page"' : ""}>${l}</a>`).join("");
  const right = u
    ? `<a class="user-chip" href="status.html"><img src="assets/icons/avatar.jpg" alt=""><span class="nm">${esc(u.name)}</span></a>
       <button class="btn-logout" type="button" data-logout>ออกจากระบบ</button>`
    : `<a class="btn-login" href="login.html">เข้าสู่ระบบ</a>`;
  mount.innerHTML = `
    <a class="skip" href="#main">ข้ามไปยังเนื้อหา</a>
    <header class="topbar"><div class="topbar-inner">
      <a class="brand" href="index.html" aria-label="หน้าแรก"><span class="brand-flag"></span>
        <span><span class="brand-mark">KMUT<span class="nb">NB</span></span>
        <span class="brand-sub">รับสมัครนักศึกษา · คณะเทคโนโลยีและการจัดการอุตสาหกรรม</span></span></a>
      <nav class="nav" aria-label="เมนูหลัก">${links}</nav>
      <div class="top-right">${right}
        <button class="hamburger" type="button" id="hamburger" aria-label="เปิดเมนู" aria-expanded="false">${MENU_ICON}</button></div>
    </div></header>
    <nav class="mobile-nav" id="mobileNav" aria-label="เมนูมือถือ">${links}
      ${u ? `<a href="#" data-logout>ออกจากระบบ (${esc(u.name)})</a>` : `<a href="login.html">เข้าสู่ระบบ</a>`}</nav>`;
  const ham = document.getElementById("hamburger");
  ham.addEventListener("click", () => ham.setAttribute("aria-expanded", document.getElementById("mobileNav").classList.toggle("open")));
  mount.querySelectorAll("[data-logout]").forEach(b => b.addEventListener("click", e => { e.preventDefault(); Store.signOut(); }));
}

function renderFooter(){
  const mount = document.getElementById("footer");
  if(!mount) return;
  mount.innerHTML = `
    <footer class="footer">
      <div class="footer-inner">
        <div><h4>รับสมัครนักศึกษา</h4>คณะเทคโนโลยีและการจัดการอุตสาหกรรม<br>มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ วิทยาเขตปราจีนบุรี</div>
        <div><h4>ผู้สมัคร</h4><a href="programs.html">หลักสูตรที่เปิดรับ</a><a href="status.html">ติดตามสถานะการสมัคร</a><a href="contact.html">ติดต่อสอบถาม</a></div>
        <div><h4>ติดต่อ</h4>โทร. 037-217-300<br>contact-prachinburi@op.kmutnb.ac.th</div>
      </div>
      <div class="footer-bottom">ม็อกอัพ UX/UI สำหรับนำเสนอ · ข้อมูลทั้งหมดเป็นตัวอย่าง ·
        <button type="button" class="linklike" data-reset>รีเซ็ตข้อมูลจำลอง</button></div>
    </footer>`;
  mount.querySelector("[data-reset]").addEventListener("click", () => { if(confirm("ล้างข้อมูลจำลองทั้งหมดแล้วเริ่มใหม่?")) Store.reset(); });
}

/* ---------- apply screens ---------- */
const APPLY_STEPS = ["ข้อมูลส่วนตัว","ช่องทางติดต่อ","การศึกษา","รอบและเอกสาร","ตรวจสอบ","ชำระค่าสมัคร"];
function renderStepper(active){
  const el = document.getElementById("stepper");
  if(!el) return;
  el.innerHTML = APPLY_STEPS.map((n, i) => {
    const cls = i < active ? "done" : i === active ? "active" : "";
    return `<li class="${cls}" ${i === active ? 'aria-current="step"' : ""}><span class="dot">${i < active ? "✓" : i + 1}</span><span class="lbl">${n}</span></li>`;
  }).join("");
}
function renderApplyFor(){
  const el = document.getElementById("applyFor");
  if(el){ const p = chosenProgram(); el.innerHTML = `<span class="badge b-navy">${p.code}</span><span>${esc(p.nameTh)}</span>`; }
}

/* forms: every field with data-k is filled from / saved to Store.profile */
function fillForm(root){
  const p = Store.profile;
  root.querySelectorAll("[data-k]").forEach(el => {
    const v = p[el.dataset.k];
    if(el.type === "radio") el.checked = el.value === v;
    else if(el.type === "checkbox") el.checked = !!v;
    else if(v != null) el.value = v;
  });
}
function readForm(root){
  const out = {};
  root.querySelectorAll("[data-k]").forEach(el => {
    if(el.type === "radio"){ if(el.checked) out[el.dataset.k] = el.value; }
    else if(el.type === "checkbox") out[el.dataset.k] = el.checked;
    else out[el.dataset.k] = el.value.trim();
  });
  return out;
}
/* small "required" check so the demo behaves like a real form */
function checkRequired(root){
  let first = null;
  root.querySelectorAll("[required]").forEach(el => {
    const bad = el.type === "checkbox" ? !el.checked : !String(el.value).trim();
    el.closest(".field, .check, label")?.classList.toggle("invalid", bad);
    if(bad && !first) first = el;
  });
  if(first){ first.focus(); toast("กรุณากรอกช่องที่มี * ให้ครบ"); return false; }
  return true;
}

function toast(msg){
  let t = document.querySelector(".toast");
  if(!t){ t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
  t.textContent = msg; t.classList.add("show");
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove("show"), 2400);
}

/* runs as soon as mock.js loads (scripts sit at the end of <body>, so the body exists) */
/* pages that need sign-in send guests to login and bring them back */
if(document.body.dataset.auth === "1" && !Store.user) location.replace("login.html?next=" + encodeURIComponent(thisPage()));
/* ?code= on apply screens selects the program being applied to */
if(document.body.dataset.step !== undefined && qs("code") && programByCode(qs("code"))) Store.saveDraft({ code: qs("code").toUpperCase() });
{
  document.addEventListener("DOMContentLoaded", () => {
    renderHeader(); renderFooter(); renderApplyFor();
    if(document.body.dataset.step !== undefined) renderStepper(Number(document.body.dataset.step));
    document.querySelectorAll(".upload input[type=file]").forEach(inp => inp.addEventListener("change", () => {
      const f = inp.files[0]; if(!f) return;
      const box = inp.closest(".upload");
      box.classList.add("has"); box.querySelector(".fi").textContent = "✓";
      box.querySelector(".t").textContent = f.name;
      box.querySelector(".s").textContent = "แนบแล้ว (" + (f.size / 1048576).toFixed(2) + " MB) · คลิกเพื่อเปลี่ยนไฟล์";
      document.dispatchEvent(new Event("docs-changed"));
    }));
    document.addEventListener("input", e => e.target.closest(".invalid")?.classList.remove("invalid"));
    document.addEventListener("change", e => e.target.closest(".invalid")?.classList.remove("invalid"));
  });
}
