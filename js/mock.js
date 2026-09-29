/* ==========================================================================
   Shared helpers for the click-through mockup.
   Pages hold sample data; buttons are plain links that follow the Figma
   prototype flow. Nothing is saved or validated.
   <body data-auth="1">   -> signed-in header
   <body data-nav="...">  -> which top-menu item is highlighted
   <body data-step="0-5"> -> active step in the 6-step apply stepper
   ========================================================================== */

const DEGREE_TAG = {
  bachelor: "ปริญญาตรี 4-5 ปี",
  continuing2: "ต่อเนื่อง 2 ปี",
  transfer25: "เทียบโอน 2 ปีครึ่ง",
  transfer3: "เทียบโอน 3 ปี"
};
/* Card order and titles follow the Program card instances in Figma.
   "\n" marks where the line should break so Thai words are not split mid-word. */
const CARD_ORDER = ["INE","IT","CA","IEM","MM","AFE","ITI","IMT","MMT","CDM","AFET","INET"];
const CARD_NAME = {
  INE: "วิศวกรรมสารสนเทศและเครือข่าย\n(ส่งเสริมภาษาอังกฤษ)",
  IEM: "วิศวกรรมอุตสาหการและการจัดการ\n(ส่งเสริมภาษาอังกฤษ)",
  CA: "คอมพิวเตอร์ช่วยออกแบบ\nและบริหารงานก่อสร้าง",
  CDM: "คอมพิวเตอร์ช่วยออกแบบ\nและบริหารงานก่อสร้าง",
  MM: "เทคโนโลยีเครื่องกล\nและกระบวนการผลิต",
  MMT: "เทคโนโลยีเครื่องกล\nและกระบวนการผลิต"
};
function orderedPrograms(){ return CARD_ORDER.map(c => PROGRAMS.find(p => p.code === c)).filter(Boolean); }

function esc(s){
  return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
}
function qs(name){ return new URLSearchParams(location.search).get(name); }

/* The program picked on major.html is carried through the apply screens.
   Falls back to INE, the program used throughout the Figma screens. */
function chosenProgram(){
  let code = qs("code");
  try{
    if(code) localStorage.setItem("mock_code", code.toUpperCase());
    else code = localStorage.getItem("mock_code");
  }catch(e){}
  return PROGRAMS.find(p => p.code === String(code || "").toUpperCase()) || PROGRAMS.find(p => p.code === "INE");
}
function cardName(p){ return CARD_NAME[p.code] || p.nameTh.replace("สาขาวิชา", "").replace(/ \((ต่อเนื่อง|เทียบโอน)\)$/, ""); }

function programCard(p){
  return `
    <a class="pcard" href="major.html?code=${p.code}">
      <span class="cover">
        <span class="tag">${DEGREE_TAG[p.degreeGroup]}</span>
        <span class="code">${p.code}</span>
      </span>
      <span class="plate">
        <span class="name">${esc(cardName(p))}</span>
        <span class="fee">${esc(p.tuition)} บาท/ภาค</span>
      </span>
    </a>`;
}

const MENU_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z"/></svg>';

function renderHeader(){
  const mount = document.getElementById("header");
  if(!mount) return;
  const signedIn = document.body.dataset.auth === "1";
  const current = document.body.dataset.nav || "";
  const links = [
    ["index.html", "หน้าแรก"],
    ["programs.html", "หลักสูตร"],
    ["status.html", "ใบสมัครของฉัน"],
    ["contact.html", "ติดต่อเรา"]
  ].map(([href, label]) => `<a href="${href}" ${href === current ? 'aria-current="page"' : ""}>${label}</a>`).join("");
  const right = signedIn
    ? `<a class="user-chip" href="status.html"><img src="assets/icons/avatar.jpg" alt=""><span class="nm">นายสมชาย ใจดี</span></a>`
    : `<a class="btn-login" href="login.html">เข้าสู่ระบบ</a>`;

  mount.innerHTML = `
    <a class="skip" href="#main">ข้ามไปยังเนื้อหา</a>
    <header class="topbar">
      <div class="topbar-inner">
        <a class="brand" href="index.html" aria-label="หน้าแรก">
          <span class="brand-flag"></span>
          <span>
            <span class="brand-mark">KMUT<span class="nb">NB</span></span>
            <span class="brand-sub">รับสมัครนักศึกษา · คณะเทคโนโลยีและการจัดการอุตสาหกรรม</span>
          </span>
        </a>
        <nav class="nav" aria-label="เมนูหลัก">${links}</nav>
        <div class="top-right">
          ${right}
          <button class="hamburger" type="button" id="hamburger" aria-label="เปิดเมนู" aria-expanded="false">${MENU_ICON}</button>
        </div>
      </div>
    </header>
    <nav class="mobile-nav" id="mobileNav" aria-label="เมนูมือถือ">${links}</nav>`;

  const ham = document.getElementById("hamburger");
  ham.addEventListener("click", () => {
    const open = document.getElementById("mobileNav").classList.toggle("open");
    ham.setAttribute("aria-expanded", open);
  });
}

function renderFooter(){
  const mount = document.getElementById("footer");
  if(!mount) return;
  mount.innerHTML = `
    <footer class="footer">
      <div class="footer-inner">
        <div>
          <h4>รับสมัครนักศึกษา</h4>
          คณะเทคโนโลยีและการจัดการอุตสาหกรรม<br>
          มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ วิทยาเขตปราจีนบุรี
        </div>
        <div>
          <h4>ผู้สมัคร</h4>
          <a href="programs.html">หลักสูตรที่เปิดรับ</a>
          <a href="status.html">ติดตามสถานะการสมัคร</a>
          <a href="contact.html">ติดต่อสอบถาม</a>
        </div>
        <div>
          <h4>ติดต่อ</h4>
          โทร. 037-217-300<br>contact-prachinburi@op.kmutnb.ac.th
        </div>
      </div>
      <div class="footer-bottom">ม็อกอัพ UX/UI สำหรับนำเสนอ · ข้อมูลทั้งหมดเป็นตัวอย่าง</div>
    </footer>`;
}

const APPLY_STEPS = ["ข้อมูลส่วนตัว", "ช่องทางติดต่อ", "การศึกษา", "รอบและเอกสาร", "ตรวจสอบ", "ชำระค่าสมัคร"];
function renderStepper(active){
  const el = document.getElementById("stepper");
  if(!el) return;
  el.innerHTML = APPLY_STEPS.map((n, i) => {
    const cls = i < active ? "done" : i === active ? "active" : "";
    return `<li class="${cls}" ${i === active ? 'aria-current="step"' : ""}><span class="dot">${i < active ? "✓" : i + 1}</span><span class="lbl">${n}</span></li>`;
  }).join("");
}

/* "สมัครเรียน" title + program badge at the top of every apply screen */
function renderApplyFor(){
  const el = document.getElementById("applyFor");
  if(!el) return;
  const p = chosenProgram();
  el.innerHTML = `<span class="badge b-navy">${p.code}</span><span>${esc(p.nameTh)}</span>`;
}

document.addEventListener("DOMContentLoaded", () => {
  renderHeader();
  renderFooter();
  renderApplyFor();
  if(document.body.dataset.step !== undefined) renderStepper(Number(document.body.dataset.step));
  /* fake file pickers: choosing a file just flips the box to the "attached" state */
  document.querySelectorAll(".upload input[type=file]").forEach(inp => inp.addEventListener("change", () => {
    const box = inp.closest(".upload");
    const f = inp.files[0];
    if(!f) return;
    box.classList.add("has");
    box.querySelector(".fi").textContent = "✓";
    box.querySelector(".t").textContent = f.name;
    box.querySelector(".s").textContent = "แนบแล้ว · คลิกเพื่อเปลี่ยนไฟล์";
  }));
});
