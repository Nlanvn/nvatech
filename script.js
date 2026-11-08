(() => {
    const H = document.documentElement;
    try { if (localStorage.getItem('theme') === 'light') H.dataset.theme = 'light' } catch (e) { }
    if (!matchMedia('(prefers-reduced-motion:reduce)').matches) {
        H.classList.add('loading');
        setTimeout(() => H.classList.remove('loading', 'flying'), 5000);
    }
})();

(() => {
    const ua = navigator.userAgent || "";
    const q = (new URLSearchParams(location.search).get("iab") || "").toLowerCase();
    const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const android = /Android/i.test(ua);
    const standalone = navigator.standalone || matchMedia("(display-mode: standalone)").matches;
    const ss = {
        get: k => { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
        set: k => { try { sessionStorage.setItem(k, "1"); } catch (e) { } }
    };
    const APPS = [
        ["Messenger", /MESSENGER|Orca-Android|MessengerForiOS/i, "fa-brands fa-facebook-messenger", "top"],
        ["Facebook", /FBAN|FBAV|FB_IAB|FBIOS/i, "fa-brands fa-facebook", ios ? "bot" : "top"],
        ["Instagram", /Instagram/i, "fa-brands fa-instagram", "top"],
        ["Zalo", /Zalo/i, "fa-solid fa-comments", "top"],
        ["TikTok", /musical_ly|BytedanceWebview|TikTok|trill/i, "fa-brands fa-tiktok", "top"],
        ["Telegram", /Telegram/i, "fa-brands fa-telegram", "top"],
        ["Line", /\bLine\//i, "fa-brands fa-line", "top"],
        ["Viber", /Viber/i, "fa-brands fa-viber", "top"],
        ["X (Twitter)", /Twitter/i, "fa-brands fa-x-twitter", "top"],
        ["Snapchat", /Snapchat/i, "fa-brands fa-snapchat", "top"],
        ["LinkedIn", /LinkedInApp/i, "fa-brands fa-linkedin-in", "top"],
        ["Pinterest", /Pinterest/i, "fa-brands fa-pinterest", "top"],
        ["Discord", /Discord/i, "fa-brands fa-discord", "top"]
    ];
    let app = null;
    for (const a of APPS) if (a[1].test(ua)) { app = { name: a[0], icon: a[2], pos: a[3] }; break; }
    if (!app && (window.TelegramWebview || window.TelegramWebviewProxy)) app = { name: "Telegram", icon: "fa-brands fa-telegram", pos: "top" };
    const generic = { name: null, icon: "fa-solid fa-mobile-screen-button", pos: "top" };
    if (!app) {
        const wvA = android && /; wv\)/.test(ua);
        const wvI = ios && !standalone && /AppleWebKit/.test(ua) && !/Safari|CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
        if (wvA || wvI) app = generic;
    }
    if (q) {
        const f = APPS.find(a => a[0].toLowerCase().startsWith(q));
        app = f ? { name: f[0], icon: f[2], pos: f[3] } : generic;
    }
    if (!app) return;
    if (!q && !(ios || android)) return;
    if (!q && ss.get("iab-off") === "1") return;

    document.documentElement.classList.add("iab-open");

    /* ---------- Link mở trình duyệt ngoài ---------- */
    const cur = () => location.href.split("#")[0];
    const scheme = location.protocol.replace(":", "") || "https";
    const bare = () => cur().replace(/^https?:\/\//, "");
    // Android: ép mở thẳng Chrome (nếu không có Chrome → quay về chính trang này)
    const chromeIntent = () => "intent://" + bare() + "#Intent;scheme=" + scheme + ";package=com.android.chrome;S.browser_fallback_url=" + encodeURIComponent(cur()) + ";end";
    // Android: mở bằng trình duyệt mặc định / hộp chọn trình duyệt
    const anyIntent = () => "intent://" + bare() + "#Intent;scheme=" + scheme + ";action=android.intent.action.VIEW;end";
    // iOS: Chrome (chỉ chạy khi đã cài Chrome)
    const iosChrome = () => (scheme === "https" ? "googlechromes://" : "googlechrome://") + bare();
    const go = u => { try { location.href = u; } catch (e) { } };

    /* Android: tự bật Chrome ngay, chỉ thử 1 lần mỗi phiên (tránh vòng lặp) */
    if (android && !q && ss.get("iab-try") !== "1") {
        ss.set("iab-try");
        setTimeout(() => go(chromeIntent()), 250);
    }

    const S = {
        vi: {
            chip: n => n ? `Bạn đang mở trong ${n}` : "Bạn đang mở trong ứng dụng",
            title: 'Bấm <span class="hl">ba chấm</span> để mở bằng trình duyệt',
            desc: "Để có trải nghiệm tốt nhất (nhạc, video, hiệu ứng mượt), hãy mở trang bằng trình duyệt. Làm 2 bước sau:",
            s1: p => `Bấm vào dấu <b>ba chấm</b> ${p}`,
            s2: o => `Chọn <b>“${o}”</b>`,
            top: "ở góc trên bên phải", bot: "ở góc dưới bên phải",
            tip: "Bấm vào đây", share: "Chia sẻ", cp: "Sao chép liên kết",
            safari: "Mở trong Safari / Chrome", browser: "Mở bằng trình duyệt",
            copy: "Sao chép liên kết",
            chrome: "Mở bằng Chrome", other: "Trình duyệt khác",
            stay: "Tiếp tục xem tại đây", close: "Đóng"
        },
        en: {
            chip: n => n ? `You’re inside ${n}` : "You’re inside an app",
            title: 'Tap the <span class="hl">three dots</span> to open in your browser',
            desc: "For the best experience (music, video, smooth effects), open this page in a browser. Follow these 2 steps:",
            s1: p => `Tap the <b>three dots</b> ${p}`,
            s2: o => `Choose <b>“${o}”</b>`,
            top: "at the top right", bot: "at the bottom right",
            tip: "Tap here", share: "Share", cp: "Copy link",
            safari: "Open in Safari / Chrome", browser: "Open in browser",
            copy: "Copy link",
            chrome: "Open in Chrome", other: "Other browser",
            stay: "Continue here", close: "Close"
        }
    };

    let el;
    const copyLink = () => {
        const v = cur();
        if (typeof copy === "function") copy(v);
        else if (navigator.clipboard) navigator.clipboard.writeText(v).catch(() => { });
    };
    function render() {
        const L = document.documentElement.lang === "en" ? "en" : "vi", s = S[L];
        const dots = ios ? "fa-ellipsis" : "fa-ellipsis-vertical";
        const openLabel = ios ? s.safari : s.browser;
        const btns = android
            ? `<button class="iab-b p" data-a="chrome" type="button"><i class="fa-brands fa-chrome"></i>${s.chrome}</button>
               <button class="iab-b s" data-a="any" type="button"><i class="fa-solid fa-arrow-up-right-from-square"></i>${s.other}</button>`
            : `<button class="iab-b p" data-a="copy" type="button"><i class="fa-regular fa-copy"></i>${s.copy}</button>
               <button class="iab-b s" data-a="ioschrome" type="button"><i class="fa-brands fa-chrome"></i>${s.chrome}</button>`;
        el.innerHTML = `
    <div class="iab-blob b1"></div><div class="iab-blob b2"></div>
    <div class="iab-pt ${app.pos}">
        <i class="fa-solid ${app.pos === "top" ? "fa-arrow-up" : "fa-arrow-down"} iab-ar"></i>
        <span class="iab-tip"><i class="fa-solid ${dots}"></i>${s.tip}</span>
    </div>
    <div class="iab-card">
        <div class="iab-top">
            <span class="iab-chip"><i class="${app.icon}"></i>${s.chip(app.name)}</span>
            <div class="iab-r">
                <button class="iab-lg" data-a="lg" type="button" aria-label="Language">${L.toUpperCase()}</button>
                <button class="iab-cl" data-a="close" type="button" aria-label="${s.close}"><i class="fa-solid fa-xmark"></i></button>
            </div>
        </div>
        <h2 id="iabT">${s.title}</h2>
        <p class="iab-d">${s.desc}</p>
        <ol class="iab-st">
            <li class="iab-s"><span class="iab-n">1</span><span class="iab-x">${s.s1(s[app.pos])}</span><span class="iab-db"><i class="fa-solid ${dots}"></i></span></li>
            <li class="iab-s col">
                <div class="iab-row"><span class="iab-n">2</span><span class="iab-x">${s.s2(openLabel)}</span></div>
                <div class="iab-menu">
                    <span class="iab-mi"><i class="fa-solid fa-share-nodes"></i>${s.share}</span>
                    <span class="iab-mi"><i class="fa-regular fa-copy"></i>${s.cp}</span>
                    <span class="iab-mi hl"><i class="fa-solid fa-arrow-up-right-from-square"></i>${openLabel}<i class="fa-solid fa-hand-point-left iab-fg"></i></span>
                </div>
            </li>
        </ol>
        <div class="iab-a">
            ${btns}
            <button class="iab-stay" data-a="close" type="button">${s.stay}</button>
        </div>
    </div>`;
    }
    function close() {
        if (!el) return;
        ss.set("iab-off");
        el.classList.remove("on");
        const main = document.querySelector("main"); if (main) main.inert = false;
        document.documentElement.classList.remove("iab-open");
        document.removeEventListener("keydown", onKey, true);
        setTimeout(() => el && el.remove(), 380);
        dispatchEvent(new Event("iab:close"));         
    }
    function onKey(e) { if (e.key === "Escape") close(); }
    function mount() {
        el = document.createElement("div");
        el.className = "iab";
        el.setAttribute("role", "alertdialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-labelledby", "iabT");
        el.setAttribute("data-lenis-prevent", "");
        document.body.appendChild(el);
        const main = document.querySelector("main"); if (main) main.inert = true;
        el.addEventListener("click", e => {
            const b = e.target.closest("[data-a]"); if (!b) return;
            const a = b.dataset.a;
            if (a === "copy") copyLink();
            else if (a === "close") close();
            else if (a === "chrome") go(chromeIntent());
            else if (a === "any") go(anyIntent());
            else if (a === "ioschrome") go(iosChrome());
            else if (a === "lg") { const t = document.getElementById("bLang"); t && t.click(); render(); }
        });
        document.addEventListener("keydown", onKey, true);
        render();
        requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("on")));
    }
    document.readyState === "loading" ? addEventListener("DOMContentLoaded", mount) : mount();
})();