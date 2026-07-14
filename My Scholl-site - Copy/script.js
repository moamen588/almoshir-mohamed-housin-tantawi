// ========== إزالة Service Worker القديم + نظام حظر متعدد ==========
(async function init() {
    // ✅ إزالة أي Service Worker قديم
    if ('serviceWorker' in navigator) {
        try {
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (let reg of registrations) {
                await reg.unregister();
                console.log('🗑️ Service Worker removed:', reg.scope);
            }
        } catch (e) {
            console.log('⚠️ Service Worker cleanup:', e.message);
        }
    }

    // ✅ جلب IP وبيانات الموقع الجغرافي
    try {
        const ipRes = await fetch('https://api.ipify.org?format=json');
        window.userIP = (await ipRes.json()).ip;
        
        try {
            const geoRes = await fetch(`https://ipapi.co/${window.userIP}/json/`);
            const geoData = await geoRes.json();
            window.userCity = geoData.city || 'غير معروف';
            window.userRegion = geoData.region || 'غير معروف';
            window.userCountry = geoData.country_name || 'غير معروف';
        } catch (geoError) {
            console.log('⚠️ GeoIP error:', geoError);
            window.userCity = 'غير معروف';
            window.userRegion = 'غير معروف';
            window.userCountry = 'مصر';
        }
    } catch (e) {
        window.userIP = 'unknown';
        window.userCity = 'غير معروف';
        window.userRegion = 'غير معروف';
        window.userCountry = 'مصر';
    }

    // ✅ جلب نوع الجهاز
    const ua = navigator.userAgent;
    if (/mobile/i.test(ua)) {
        window.userDevice = /iPhone|iPad|iPod/i.test(ua) ? 'iOS' : 'Android';
    } else {
        window.userDevice = 'كمبيوتر';
    }

    // ✅ جلب بصمة الجهاز
    let deviceFingerprint = localStorage.getItem('device_fingerprint');
    if (!deviceFingerprint) {
        try {
            const fpRes = await fetch('https://cdn.jsdelivr.net/npm/@fingerprintjs/fingerprintjs@3/+esm');
            const fpText = await fpRes.text();
            const blob = new Blob([fpText], { type: 'text/javascript' });
            const fpURL = URL.createObjectURL(blob);
            const FingerprintJS = await import(fpURL);
            const fp = await FingerprintJS.load();
            const result = await fp.get();
            deviceFingerprint = result.visitorId;
            localStorage.setItem('device_fingerprint', deviceFingerprint);
            URL.revokeObjectURL(fpURL);
        } catch (e) {
            deviceFingerprint = 'fp_' + Math.random().toString(36).slice(2);
            localStorage.setItem('device_fingerprint', deviceFingerprint);
        }
    }

    // ✅ فحص الحظر (IP + بصمة + هاتف)
    if (window.db && window.firebaseCollection && window.firebaseQuery && window.firebaseWhere && window.firebaseGetDocs) {
        const db = window.db;
        const user = JSON.parse(localStorage.getItem('school_user') || '{}');
        const userPhone = user.phone || '';

        try {
            const [ipSnap, fpSnap] = await Promise.all([
                window.firebaseGetDocs(window.firebaseQuery(window.firebaseCollection(db, "banned_ips"), window.firebaseWhere("ip", "==", window.userIP))),
                window.firebaseGetDocs(window.firebaseQuery(window.firebaseCollection(db, "banned_fingerprints"), window.firebaseWhere("fingerprint", "==", deviceFingerprint)))
            ]);

            let banData = null;
            
            if (!ipSnap.empty) {
                banData = ipSnap.docs[0].data();
            } else if (!fpSnap.empty) {
                banData = fpSnap.docs[0].data();
                if (banData && window.userIP !== 'unknown') {
                    try {
                        await window.firebaseAddDoc(window.firebaseCollection(window.db, "banned_ips"), {
                            ip: window.userIP,
                            fingerprint: deviceFingerprint,
                            phone: banData.phone || '',
                            reason: '⚠️ VPN detected - جهاز محظور سابقاً',
                            bannedAt: new Date()
                        });
                    } catch (e) {}
                }
            }
            
            if (!banData && userPhone && userPhone.length > 5) {
                const phoneSnap = await window.firebaseGetDocs(
                    window.firebaseQuery(window.firebaseCollection(db, "banned_ips"), window.firebaseWhere("phone", "==", userPhone))
                );
                if (!phoneSnap.empty) {
                    banData = phoneSnap.docs[0].data();
                    if (window.userIP !== 'unknown') {
                        try {
                            await window.firebaseAddDoc(window.firebaseCollection(window.db, "banned_ips"), {
                                ip: window.userIP,
                                fingerprint: deviceFingerprint,
                                phone: userPhone,
                                reason: '⚠️ هاتف محظور - VPN detected',
                                bannedAt: new Date()
                            });
                        } catch (e) {}
                    }
                }
            }

            if (banData) {
                const banDate = banData.bannedAt ? new Date(banData.bannedAt.seconds * 1000).toLocaleDateString('ar-EG') : 'غير محدد';
                const banReason = escapeHtml(banData.reason || 'مخالفة قواعد الاستخدام');
                const banExpiry = banData.expiresAt ? new Date(banData.expiresAt.seconds * 1000) : null;
                const isExpired = banExpiry && banExpiry < new Date();

                if (!isExpired) {
                    document.body.innerHTML = `
                        <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;background:linear-gradient(135deg,#0f172a,#1e293b);font-family:'Segoe UI',Tahoma,sans-serif;padding:1rem;">
                            <div style="text-align:center;background:#1e293b;padding:2.5rem 2rem;border-radius:24px;box-shadow:0 25px 50px rgba(0,0,0,0.4);border:2px solid #dc2626;max-width:520px;width:100%;">
                                <div style="font-size:5rem;margin-bottom:1rem;">🚫</div>
                                <h1 style="color:#ef4444;font-size:2rem;margin-bottom:1rem;">تم حظر جهازك</h1>
                                <p style="color:#94a3b8;font-size:1.1rem;margin-bottom:1.5rem;">عذراً، غير مسموح لك بدخول هذا الموقع</p>
                                <div style="background:#0f172a;border-radius:16px;padding:1.2rem;margin-bottom:1.5rem;border:1px solid #334155;">
                                    <div style="display:flex;justify-content:space-between;margin-bottom:0.8rem;"><span style="color:#64748b;">📅 تاريخ الحظر:</span><span style="color:#e2e8f0;font-weight:600;">${banDate}</span></div>
                                    <div style="display:flex;justify-content:space-between;margin-bottom:0.8rem;"><span style="color:#64748b;">⚠️ سبب الحظر:</span><span style="color:#f87171;font-weight:600;">${banReason}</span></div>
                                    ${banExpiry ? `<div style="display:flex;justify-content:space-between;margin-bottom:0.8rem;"><span style="color:#64748b;">⏳ ينتهي:</span><span style="color:#fbbf24;font-weight:600;">${banExpiry.toLocaleDateString('ar-EG')}</span></div>` : ''}
                                    <div style="display:flex;justify-content:space-between;"><span style="color:#64748b;">🔒 IP:</span><span style="color:#94a3b8;font-family:monospace;">${escapeHtml(window.userIP || 'غير معروف')}</span></div>
                                </div>
                                <p style="color:#fbbf24;font-size:1rem;font-weight:600;margin-bottom:1.2rem;">📞 تواصل مع المطور لمراجعة الحظر:</p>
                                <div style="display:flex;gap:0.8rem;justify-content:center;flex-wrap:wrap;">
                                    <a href="https://wa.me/201224736512" target="_blank" style="display:flex;align-items:center;gap:0.5rem;background:#25D366;color:white;padding:0.8rem 1.3rem;border-radius:50px;text-decoration:none;font-weight:700;font-size:0.95rem;box-shadow:0 4px 15px rgba(37,211,102,0.3);">📱 واتساب</a>
                                    <a href="https://www.instagram.com/moomenmagdy588" target="_blank" style="display:flex;align-items:center;gap:0.5rem;background:linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888);color:white;padding:0.8rem 1.3rem;border-radius:50px;text-decoration:none;font-weight:700;font-size:0.95rem;box-shadow:0 4px 15px rgba(220,39,67,0.3);">📷 انستجرام</a>
                                </div>
                            </div>
                        </div>`;
                    return;
                }
            }
        } catch (e) {
            console.error('⚠️ Ban check error:', e);
        }
    }

    initApp();
})();

// ========== Skeleton Loader Functions ==========
function showSkeletonLoader() {
    const loader = document.getElementById('skeletonLoader');
    if (loader) {
        loader.style.display = 'flex';
        loader.classList.remove('hidden');
    }
}

function hideSkeletonLoader() {
    const loader = document.getElementById('skeletonLoader');
    if (loader) {
        loader.classList.add('hidden');
        setTimeout(() => {
            loader.style.display = 'none';
        }, 600);
    }
}

// ========== دوال مساعدة عامة ==========
/**
 * تطهير النصوص من أكواد HTML الضارة لمنع هجمات XSS
 */
function escapeHtml(unsafe) {
    if (!unsafe || typeof unsafe !== 'string') return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * قائمة الكلمات المحظورة الموحدة
 */
const FORBIDDEN_WORDS = [
    'كس', 'ابن', 'خول', 'منيوك', 'شرموط', 'عرص', 'زب', 'بظر', 'متناك',
    'fuck', 'shit', 'bitch', 'ass', 'whore', 'slut', 'dick', 'pussy', 'bastard'
];

/**
 * فحص النص للتأكد من خلوه من الكلمات المحظورة
 * @param {string} text - النص المراد فحصه
 * @returns {boolean} - true إذا كان النص يحتوي على كلمات محظورة
 */
function containsForbiddenText(text) {
    if (!text) return false;
    const lowerText = text.toLowerCase().trim();
    return FORBIDDEN_WORDS.some(word => lowerText.includes(word));
}

// ========== التطبيق الرئيسي ==========
function initApp() {
    'use strict';

    // ✅ إظهار Skeleton Loader
    showSkeletonLoader();

    // ========== DOM Elements ==========
    const refreshTestimonialBtn = document.getElementById('refreshTestimonialBtn');
    const testimonialContent = document.getElementById('testimonialContent');
    const testimonialInput = document.getElementById('testimonialInput');
    const submitTestimonialBtn = document.getElementById('submitTestimonialBtn');
    const testimonialCharCount = document.getElementById('testimonialCharCount');
    const installPwaBtn = document.getElementById('installPwaBtn');
    const loginModal = document.getElementById('loginModal');
    const confirmPopup = document.getElementById('confirmPopup');
    const loginForm = document.getElementById('loginForm');
    const fullNameInput = document.getElementById('fullName');
    const whatsappInput = document.getElementById('whatsapp');
    const passwordGroup = document.getElementById('passwordGroup');
    const passwordInput = document.getElementById('password');
    const forgotPasswordBtn = document.getElementById('forgotPasswordBtn');
    const loginSubmitBtn = document.getElementById('loginSubmitBtn');
    const appContainer = document.getElementById('app');
    const welcomeMessage = document.getElementById('welcomeMessage');
    const confirmYes = document.getElementById('confirmYes');
    const confirmNo = document.getElementById('confirmNo');
    const confirmText = document.getElementById('confirmText');
    const editDataBtn = document.getElementById('editDataBtn');
    const developerSection = document.getElementById('developerSection');
    const scrollToDevBtn = document.getElementById('scrollToDevBtn');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const systemGeneral = document.getElementById('systemGeneral');
    const systemServices = document.getElementById('systemServices');
    const reviewName = document.getElementById('reviewName');
    const reviewPhone = document.getElementById('reviewPhone');
    const reviewSystem = document.getElementById('reviewSystem');
    const downloadCertBtn = document.getElementById('downloadCertBtn');
    const certStatus = document.getElementById('certStatus');
    const certCardDesc = document.getElementById('certCardDesc');
    const shareSiteBtn = document.getElementById('shareSiteBtn');
    const copyLinkBtn = document.getElementById('copyLinkBtn');
    const qrCodeContainer = document.getElementById('qrCodeContainer');

    let pendingData = null, selectedSystem = 'عام';
    let isPasswordRequired = false, existingUserData = null;
    let passwordAttempts = 0;
    const MAX_PASSWORD_ATTEMPTS = 3;
    
    const SITE_URL = window.location.href;

    // ========== زر الرجوع لأعلى ==========
    const backToTopBtn = document.getElementById('backToTopBtn');
    if (backToTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                backToTopBtn.classList.add('show');
            } else {
                backToTopBtn.classList.remove('show');
            }
        });

        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
    
    // ========== وظائف localStorage ==========
    function saveLocal(n, p, s) { 
        localStorage.setItem('school_user', JSON.stringify({ name: n.trim(), phone: p.trim(), system: s })); 
    }
    
    function getLocalUser() { 
        try { 
            return JSON.parse(localStorage.getItem('school_user')); 
        } catch (e) { 
            return null; 
        } 
    }

    // ========== تتبع النقرات على أزرار التواصل ==========
    async function trackButtonClick(buttonType) {
        const user = getLocalUser();
        if (!user || !user.phone || !window.db) return;
        
        try {
            await window.firebaseAddDoc(
                window.firebaseCollection(window.db, "button_clicks"),
                {
                    button: buttonType,
                    studentName: user.name,
                    studentPhone: user.phone,
                    studentSystem: user.system || 'عام',
                    timestamp: new Date()
                }
            );
            
            const counterRef = window.firebaseDoc(window.db, "button_stats", buttonType);
            try {
                await window.firebaseUpdateDoc(counterRef, {
                    totalClicks: window.firebaseIncrement(1),
                    lastClickBy: user.name,
                    lastClickAt: new Date()
                });
            } catch (e) {
                if (e.code === 'not-found') {
                    await window.firebaseSetDoc(counterRef, {
                        button: buttonType,
                        totalClicks: 1,
                        lastClickBy: user.name,
                        lastClickAt: new Date()
                    });
                }
            }
        } catch (error) {
            console.error('❌ خطأ في تسجيل النقرة:', error);
        }
    }

    // ========== إنشاء QR Code ==========
    if (qrCodeContainer && typeof QRCode !== 'undefined') {
        new QRCode(qrCodeContainer, {
            text: SITE_URL,
            width: 120,
            height: 120,
            colorDark: "#2c6e9b",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
    }

    // ========== مشاركة الموقع ونسخ الرابط ==========
    if (shareSiteBtn) {
        shareSiteBtn.addEventListener('click', async () => {
            if (navigator.share) {
                try {
                    await navigator.share({
                        title: 'مدرسة المشير محمد حسين طنطاوي',
                        text: 'الموقع الرسمي للمدرسة',
                        url: SITE_URL,
                    });
                } catch (err) {}
            } else {
                try {
                    await navigator.clipboard.writeText(SITE_URL);
                    showToast('✅ تم نسخ رابط الموقع!');
                } catch (err) {
                    alert('انسخ الرابط: ' + SITE_URL);
                }
            }
        });
    }

    if (copyLinkBtn) {
        copyLinkBtn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(SITE_URL);
                showToast('✅ تم نسخ رابط الموقع!');
            } catch (err) {
                alert('انسخ الرابط: ' + SITE_URL);
            }
        });
    }

    // ========== ربط تتبع النقرات بأزرار التواصل ==========
    const devWhatsappBtn = document.getElementById('devWhatsappBtn');
    const devInstagramBtn = document.getElementById('devInstagramBtn');
    const devPortfolioBtn = document.getElementById('devPortfolioBtn');
    const devFacebookBtn = document.getElementById('devFacebookBtn');

    if (devWhatsappBtn) {
        devWhatsappBtn.addEventListener('click', () => trackButtonClick('whatsapp'));
    }

    if (devInstagramBtn) {
        devInstagramBtn.addEventListener('click', () => trackButtonClick('instagram'));
    }

    if (devPortfolioBtn) {
        devPortfolioBtn.addEventListener('click', () => trackButtonClick('portfolio'));
    }

    if (devFacebookBtn) {
        devFacebookBtn.addEventListener('click', () => trackButtonClick('facebook'));
    }

    // ========== زر الانتقال لقسم المطور ==========
    if (scrollToDevBtn) {
        scrollToDevBtn.addEventListener('click', () => {
            trackButtonClick('developer_section');
            if (developerSection) {
                developerSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                developerSection.classList.add('highlight');
                setTimeout(() => developerSection.classList.remove('highlight'), 2000);
            }
        });
    }

    // ========== بصمة الجهاز ==========
    async function getDeviceFingerprint() {
        let fp = localStorage.getItem('device_fingerprint');
        if (!fp) {
            try {
                const res = await fetch('https://cdn.jsdelivr.net/npm/@fingerprintjs/fingerprintjs@3/+esm');
                const text = await res.text();
                const blob = new Blob([text], { type: 'text/javascript' });
                const url = URL.createObjectURL(blob);
                const FP = await import(url);
                const f = await FP.load();
                const r = await f.get();
                fp = r.visitorId;
                localStorage.setItem('device_fingerprint', fp);
                URL.revokeObjectURL(url);
            } catch(e) { 
                fp = 'fp_' + Math.random().toString(36).slice(2); 
                localStorage.setItem('device_fingerprint', fp); 
            }
        }
        return fp;
    }

    // ========== نظام الحظر التلقائي ==========
    async function autoBan(phone, reason) {
        const fp = await getDeviceFingerprint();
        const ip = window.userIP || 'unknown';
        if (window.db) {
            try {
                await Promise.all([
                    window.firebaseAddDoc(window.firebaseCollection(window.db, 'banned_ips'), { 
                        ip, fingerprint: fp, phone, reason, bannedAt: new Date() 
                    }),
                    window.firebaseAddDoc(window.firebaseCollection(window.db, 'banned_fingerprints'), { 
                        fingerprint: fp, ip, phone, reason, bannedAt: new Date() 
                    })
                ]);
            } catch(e) {}
        }
        localStorage.removeItem('school_user');
        document.body.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;min-height:100vh;background:#0f172a;font-family:sans-serif;padding:1rem;"><div style="text-align:center;background:#1e293b;padding:2.5rem 2rem;border-radius:24px;border:2px solid #dc2626;max-width:520px;width:100%;"><div style="font-size:5rem;">🚫</div><h1 style="color:#ef4444;font-size:2rem;">تم حظر جهازك</h1><p style="color:#94a3b8;">${escapeHtml(reason)}</p></div></div>`;
        throw new Error('AUTO_BANNED');
    }

    // ========== معالجة كلمة السر الخاطئة ==========
    async function handleWrongPassword(phone) {
        passwordAttempts++;
        if (passwordAttempts >= MAX_PASSWORD_ATTEMPTS) {
            await autoBan(phone, '3 محاولات خاطئة - حظر تلقائي');
        } else {
            alert(`❌ كلمة السر غلط! (${passwordAttempts}/${MAX_PASSWORD_ATTEMPTS})`);
        }
    }

    // ========== فحص هوية المطور ==========
    function isDeveloper(name) {
        if (!name) return false;
        let n = name.toLowerCase().trim().replace(/[^a-z\u0621-\u064A\s]/g, ' ').replace(/\s+/g, ' ').trim();
        const mp = ['moamen', 'momen', 'moomen', 'mo2men', 'مؤمن', 'مومن'];
        const gp = ['magdy', 'magdi', 'majdy', 'majdi', 'مجدي'];
        const ap = ['abdelwadood', 'abdelwadud', 'abdelwadod', 'abdulwadood', 'عبدالودود', 'عبد الودود'];
        let hm = false, hg = false, ha = false;
        for (const w of n.split(' ')) { if (mp.includes(w)) hm = true; if (gp.includes(w)) hg = true; if (ap.includes(w)) ha = true; }
        if (!hm) hm = mp.some(p => n.includes(p));
        if (!hg) hg = gp.some(p => n.includes(p));
        if (!ha) ha = ap.some(p => n.includes(p));
        return hm && hg && ha;
    }

    // ========== فحص الطالب المميز ==========
    function isSpecialStudent(name) {
        if (!name) return false;
        let n = name.toLowerCase().trim().replace(/[^a-z\u0621-\u064A\s]/g, ' ').replace(/\s+/g, ' ').trim();
        const lp = ['lamis', 'lames', 'lamess', 'lamees', 'lameess', 'lemes', 'lemis', 'lemiss', 'lemees', 'lamys', 'lamyss', 'lameys', 'lamise', 'lameese', 'لميس', 'لميص', 'ليميس', 'ليميص', 'لميسة'];
        const mp = ['mohamed', 'mohammed', 'mohamad', 'mohammad', 'muhammed', 'muhamad', 'mhmd', 'mohamd', 'mohmed', 'mouhamed', 'mohameed', 'mohammd', 'محمد', 'محمّد', 'مهمد'];
        let hl = false, hm = false;
        for (const w of n.split(' ')) { if (lp.includes(w)) hl = true; if (mp.includes(w)) hm = true; }
        if (!hl) hl = lp.some(p => n.includes(p));
        if (!hm) hm = mp.some(p => n.includes(p));
        return hl && hm;
    }

    // ========== نصائح عشوائية ==========
    const tips = [
        "لو المذاكرة تقيلة… قسمها لخطوات صغيرة",
        "ابدأ بس حتى لو مش عندك مزاج",
        "راجع الدرس بعد ما تفهمه بوقت بسيط",
        "اسأل لو مش فاهم… السؤال مش ضعف",
        "المذاكرة مش سباق، كل واحد وليه سرعته",
        "خليك دايمًا عامل حساب إن الامتحان بييجي من الفهم مش الحفظ",
        "راحة قصيرة أثناء المذاكرة ممكن تزود تركيزك",
        "حاول تربط المعلومات بحاجات بسيطة عشان تفتكرها",
        "نصيحة: ذاكر أول بأول عشان متتزنقش",
        "المعلومة اللي بتتفهم بسرعة غالبًا بتثبت أسرع",
        "مش لازم تذاكر ساعات طويلة… المهم تذاكر بتركيز"
    ];
    
    window.getNewTip = function() { 
        const t = document.getElementById('tipText'); 
        if (t) {
            t.style.opacity = '0';
            t.style.transform = 'translateY(-10px)';
            t.style.transition = 'all 0.3s ease';
            setTimeout(() => {
                t.textContent = tips[Math.floor(Math.random() * tips.length)];
                t.style.opacity = '1';
                t.style.transform = 'translateY(0)';
            }, 300);
        }
    };

    function setRandomTip() { 
        const t = document.getElementById('tipText'); 
        if (t) t.textContent = tips[Math.floor(Math.random() * tips.length)]; 
    }

    // ========== تحديث إحصائيات التذييل ==========
    async function updateFooterStats() { 
        const el = document.getElementById('footerStudentCount'); 
        if (!el || !window.db) return; 
        try { 
            const s = await window.firebaseGetDocs(window.firebaseCollection(window.db, "students")); 
            el.textContent = s.size.toLocaleString('ar-EG'); 
        } catch (e) { 
            el.textContent = '...'; 
        } 
    }

    // ========== نسخ رقم الهاتف ==========
    window.copyPhone = function(p) { 
        if (navigator.clipboard) { 
            navigator.clipboard.writeText(p).then(() => showToast('✅ تم نسخ الرقم: ' + p)); 
        } else {
            const t = document.createElement('input');
            t.value = p;
            document.body.appendChild(t);
            t.select();
            document.execCommand('copy');
            document.body.removeChild(t);
            showToast('✅ تم نسخ الرقم: ' + p);
        }
    };
    
    // ========== إظهار إشعار ==========
    function showToast(m) { 
        const ex = document.querySelector('.copy-toast'); 
        if (ex) ex.remove(); 
        const t = document.createElement('div'); 
        t.className = 'copy-toast'; 
        t.textContent = m; 
        t.style.cssText = 'position:fixed;bottom:30px;left:50%;transform:translateX(-50%);background:#25D366;color:white;padding:0.8rem 1.5rem;border-radius:50px;font-weight:700;z-index:3000;box-shadow:0 8px 25px rgba(37,211,102,0.3);'; 
        document.body.appendChild(t); 
        setTimeout(() => t.remove(), 2200); 
    }

    // ========== تحديث عداد الزوار ==========
    async function updateVisitorCount() { 
        const el = document.getElementById('visitorCount'); 
        if (!el || !window.db) return; 
        try { 
            const s = await window.firebaseGetCountFromServer(window.firebaseCollection(window.db, "students")); 
            animateCounter(el, parseInt(el.textContent) || 0, s.data().count, 1000);
        } catch (e) { 
            try { 
                const s = await window.firebaseGetDocs(window.firebaseCollection(window.db, "students")); 
                animateCounter(el, parseInt(el.textContent) || 0, s.size, 1000);
            } catch (e2) {} 
        } 
    }

    // ========== حركة العداد ==========
    function animateCounter(el, start, end, duration) {
        if (!el || start === end) { if (el) el.textContent = end.toLocaleString('ar-EG'); return; }
        const startTime = performance.now();
        function update(currentTime) {
            const progress = Math.min((currentTime - startTime) / duration, 1);
            const value = Math.floor((1 - Math.pow(1 - progress, 3)) * (end - start) + start);
            el.textContent = value.toLocaleString('ar-EG');
            if (progress < 1) requestAnimationFrame(update);
            else el.textContent = end.toLocaleString('ar-EG');
        }
        requestAnimationFrame(update);
    }

    // ========== اختيار النظام ==========
    function setSystem(s) { 
        selectedSystem = s; 
        if (systemGeneral) systemGeneral.classList.toggle('active', s === 'عام');
        if (systemServices) systemServices.classList.toggle('active', s === 'خدمات');
    }
    if (systemGeneral) systemGeneral.addEventListener('click', () => setSystem('عام'));
    if (systemServices) systemServices.addEventListener('click', () => setSystem('خدمات'));

    // ========== الوضع الليلي ==========
    function applyDarkMode(d) { 
        document.body.classList.toggle('dark-mode', d); 
        if (darkModeToggle) darkModeToggle.textContent = d ? '☀️' : '🌙'; 
    }
    function loadDarkMode() { applyDarkMode(localStorage.getItem('dark_mode') === 'true'); }
    function toggleDarkMode() { 
        const d = !document.body.classList.contains('dark-mode'); 
        applyDarkMode(d); 
        localStorage.setItem('dark_mode', d ? 'true' : 'false'); 
    }
    if (darkModeToggle) darkModeToggle.addEventListener('click', toggleDarkMode);

    // ========== العد التنازلي للامتحانات ==========
    const examDates = [
        new Date(2026, 4, 11, 9, 0, 0),
        new Date(2026, 4, 12, 9, 0, 0),
        new Date(2026, 4, 13, 9, 0, 0)
    ];
    
    function updateCountdown(i) { 
        const now = new Date().getTime();
        const distance = examDates[i].getTime() - now; 
        const daysEl = document.getElementById('days' + (i + 1));
        const hoursEl = document.getElementById('hours' + (i + 1));
        const minsEl = document.getElementById('minutes' + (i + 1));
        const secsEl = document.getElementById('seconds' + (i + 1));
        
        if (!daysEl) return; 
        
        if (distance < 0) { 
            daysEl.textContent = hoursEl.textContent = minsEl.textContent = secsEl.textContent = '00'; 
            return; 
        } 
        
        daysEl.textContent = String(Math.floor(distance / 86400000)).padStart(2, '0'); 
        hoursEl.textContent = String(Math.floor((distance % 86400000) / 3600000)).padStart(2, '0'); 
        minsEl.textContent = String(Math.floor((distance % 3600000) / 60000)).padStart(2, '0'); 
        secsEl.textContent = String(Math.floor((distance % 60000) / 1000)).padStart(2, '0'); 
        
        if (parseInt(secsEl.textContent) <= 10) secsEl.style.color = '#dc2626'; 
        else secsEl.style.color = ''; 
    }
    
    function startCountdowns() { 
        updateCountdown(0); updateCountdown(1); updateCountdown(2); 
        setInterval(() => { updateCountdown(0); updateCountdown(1); updateCountdown(2); }, 1000); 
    }

    // ========== Lightbox ==========
    window.openLightbox = function(src, caption) { 
        if (lightbox && lightboxImg) { 
            lightboxImg.src = src;
            const captionEl = document.getElementById('lightboxCaption');
            if (captionEl && caption) {
                captionEl.textContent = caption;
                captionEl.style.display = 'block';
            } else if (captionEl) {
                captionEl.style.display = 'none';
            }
            lightbox.classList.add('active'); 
            document.body.style.overflow = 'hidden';
        } 
    };
    
    window.closeLightbox = function() { 
        if (lightbox) {
            lightbox.classList.remove('active'); 
            document.body.style.overflow = '';
        }
    };
    
    document.addEventListener('keydown', e => { 
        if (e.key === 'Escape' && lightbox && lightbox.classList.contains('active')) {
            closeLightbox();
        }
    });

    // ========== التحقق من صحة البيانات ==========
    function isValidPhone(p) { return /^01[0-9]{9}$/.test(p.replace(/\s+/g, '').trim()); }
    function isValidName(n) { const t = n.trim(); return /^[\u0621-\u064Aa-zA-Z\s\-'.]+$/.test(t) && t.split(/\s+/).filter(p => p.length > 0).length >= 3; }

    // ========== إرسال البيانات إلى Firestore ==========
    async function sendToFirestore(n, p, s, pass) {
        if (!window.db) return false;
        if (!window.userIP) { 
            try { window.userIP = (await (await fetch('https://api.ipify.org?format=json')).json()).ip; } 
            catch (e) { window.userIP = 'unknown'; } 
        }
        const fp = await getDeviceFingerprint();
        
        const city = window.userCity || 'غير معروف';
        const region = window.userRegion || 'غير معروف';
        const device = window.userDevice || 'غير معروف';
        
        await window.firebaseAddDoc(window.firebaseCollection(window.db, "students"), { 
            name: n.trim(), phone: p.trim(), system: s, password: pass, 
            ip: window.userIP, fingerprint: fp, visitCount: 1, 
            city: city, region: region, device: device,
            lastLogin: new Date(), createdAt: new Date() 
        });
        return true;
    }

    // ========== تحديث IP الطالب ==========
    async function updateStudentIP() {
        const user = getLocalUser();
        if (!user || !user.phone || !window.db) return;
        let currentIP = window.userIP;
        if (!currentIP) {
            try { currentIP = (await (await fetch('https://api.ipify.org?format=json')).json()).ip; window.userIP = currentIP; } 
            catch (e) { return; }
        }
        try {
            const q = window.firebaseQuery(window.firebaseCollection(window.db, "students"), window.firebaseWhere("phone", "==", user.phone));
            const snapshot = await window.firebaseGetDocs(q);
            if (!snapshot.empty) {
                const docId = snapshot.docs[0].id;
                await window.firebaseUpdateDoc(window.firebaseDoc(window.db, "students", docId), { 
                    ip: currentIP, 
                    city: window.userCity,
                    region: window.userRegion,
                    device: window.userDevice,
                    lastLogin: new Date(), 
                    visitCount: window.firebaseIncrement(1) 
                });
            }
        } catch (e) {}
    }

    // ========== تحديث واجهة الشهادة ==========
    async function updateCertUI() {
        const user = getLocalUser();
        if (!user || !user.phone || !window.db) {
            if (certCardDesc) certCardDesc.textContent = 'سجل دخول الأول!';
            return;
        }
        
        try {
            const certQuery = window.firebaseQuery(
                window.firebaseCollection(window.db, "certificates"),
                window.firebaseWhere("studentPhone", "==", user.phone)
            );
            const certSnap = await window.firebaseGetDocs(certQuery);
            
            if (!certSnap.empty) {
                if (certCardDesc) certCardDesc.textContent = '🎓 شهادتك جاهزة للتحميل!';
                if (downloadCertBtn) {
                    downloadCertBtn.textContent = '📥 تحميل الشهادة';
                    downloadCertBtn.style.background = '#059669';
                }
                if (certStatus) {
                    certStatus.innerHTML = `✅ شهادة جاهزة | 🏷️ #${escapeHtml(certSnap.docs[0].id.slice(-6).toUpperCase())}`;
                    certStatus.style.color = '#059669';
                }
            } else {
                if (certCardDesc) certCardDesc.textContent = 'حمل شهادتك الخاصة من الموقع!';
                if (downloadCertBtn) {
                    downloadCertBtn.textContent = '📜 طلب الشهادة';
                    downloadCertBtn.style.background = '#2c6e9b';
                }
                if (certStatus) {
                    certStatus.textContent = 'لم تطلب شهادة بعد';
                    certStatus.style.color = '#f59e0b';
                }
            }
        } catch (e) {
            console.error('Cert check error:', e);
        }
    }

    // ========== تحميل الشهادة ==========
    window.downloadCertificate = async function() {
        const user = getLocalUser();
        if (!user) {
            showToast('❌ لازم تسجل دخول الأول!');
            return;
        }
        
        if (downloadCertBtn) {
            downloadCertBtn.textContent = '⏳ جاري التحميل...';
            downloadCertBtn.disabled = true;
        }
        
        try {
            if (!window.db) throw new Error('قاعدة البيانات غير متصلة');
            
            const certQuery = window.firebaseQuery(
                window.firebaseCollection(window.db, "certificates"),
                window.firebaseWhere("studentPhone", "==", user.phone)
            );
            const certSnap = await window.firebaseGetDocs(certQuery);
            
            let certData, certId;
            
            if (certSnap.empty) {
                const isSpecial = isSpecialStudent(user.name);
                const isDev = isDeveloper(user.name);
                
                const certRef = await window.firebaseAddDoc(window.firebaseCollection(window.db, "certificates"), {
                    studentName: user.name,
                    studentPhone: user.phone,
                    studentSystem: user.system,
                    isSpecial: isSpecial,
                    isDeveloper: isDev,
                    status: 'active',
                    createdAt: new Date()
                });
                
                certId = certRef.id;
                certData = {
                    studentName: user.name,
                    studentPhone: user.phone,
                    studentSystem: user.system,
                    isSpecial: isSpecial,
                    isDeveloper: isDev
                };
                
                await window.firebaseAddDoc(window.firebaseCollection(window.db, "certificate_logs"), {
                    studentPhone: user.phone,
                    studentName: user.name,
                    certificateId: certId,
                    action: 'requested',
                    timestamp: new Date()
                });
                
                showToast('✅ تم إنشاء شهادتك!');
            } else {
                certData = certSnap.docs[0].data();
                certId = certSnap.docs[0].id;
            }
            
            await generatePDF(certData, certId);
            
            if (!certSnap.empty) {
                await window.firebaseUpdateDoc(window.firebaseDoc(window.db, "certificates", certId), { status: 'downloaded' });
                
                await window.firebaseAddDoc(window.firebaseCollection(window.db, "certificate_logs"), {
                    studentPhone: user.phone,
                    studentName: user.name,
                    certificateId: certId,
                    action: 'downloaded',
                    timestamp: new Date()
                });
            }
            
            await updateCertUI();
            showToast('📥 تم تحميل الشهادة بنجاح!');
            
        } catch (e) {
            console.error('❌ Certificate error:', e);
            showToast('❌ حصل خطأ: ' + (e.message || 'جرب تاني'));
        } finally {
            if (downloadCertBtn) {
                downloadCertBtn.disabled = false;
                await updateCertUI();
            }
        }
    };

    // ========== إنشاء PDF ==========
    async function generatePDF(certData, certId) {
        const userName = certData?.studentName || getLocalUser()?.name || 'طالب';
        const userSystem = certData?.studentSystem || getLocalUser()?.system || 'عام';
        const userPhone = certData?.studentPhone || getLocalUser()?.phone || '';
        
        const developer = isDeveloper(userName);
        const special = isSpecialStudent(userName);
        const today = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
        const certNumber = certId ? certId.slice(-6).toUpperCase() : Math.random().toString(36).slice(-6).toUpperCase();
        
        if (window.db && userPhone) {
            try {
                await window.firebaseAddDoc(window.firebaseCollection(window.db, 'certificate_logs'), {
                    studentName: userName,
                    studentPhone: userPhone,
                    studentSystem: userSystem,
                    action: 'opened',
                    timestamp: new Date()
                });
            } catch (e) {}
        }
        
        // ========== تصميم شهادة المطور ==========
        const devCertDesign = `
            <div class="cert-wrapper dev-wrapper">
                <div class="dev-bg-animation"></div>
                <div class="dev-grid-pattern"></div>
                
                <div class="dev-top-accent"></div>
                
                <div class="dev-content">
                    <div class="dev-badge-main">
                        <span class="dev-badge-icon">⚡</span>
                    </div>
                    
                    <h2 class="dev-school-name">مدرسة المشير محمد حسين طنطاوي</h2>
                    
                    <div class="dev-divider">
                        <span class="dev-divider-diamond">◆</span>
                    </div>
                    
                    <h1 class="dev-main-title">شهادة المطور</h1>
                    <p class="dev-subtitle-text">DEVELOPER CERTIFICATE</p>
                    
                    <div class="dev-name-container">
                        <span class="dev-name-bracket">{</span>
                        <h1 class="dev-student-name">${escapeHtml(userName)}</h1>
                        <span class="dev-name-bracket">}</span>
                    </div>
                    
                    <div class="dev-tags">
                        <span class="dev-tag">Front-End Developer</span>
                        <span class="dev-tag">الصف الأول الثانوي</span>
                        <span class="dev-tag">نظام ${escapeHtml(userSystem)}</span>
                    </div>
                    
                    <div class="dev-achievement-box">
                        <div class="dev-achievement-item">
                            <span class="dev-achievement-icon">🛠️</span>
                            <p>صانع هذا الموقع بالكامل</p>
                        </div>
                        <div class="dev-achievement-item">
                            <span class="dev-achievement-icon">🎯</span>
                            <p>لتسهيل وصول زملائه للخدمات التعليمية</p>
                        </div>
                        <div class="dev-achievement-item">
                            <span class="dev-achievement-icon">🚀</span>
                            <p>فخور بيك يا بطل! استمر في الإبداع</p>
                        </div>
                    </div>
                    
                    <div class="dev-signature-section">
                        <div class="dev-signature-line"></div>
                        <p class="dev-signature-text">𝓜𝓸𝓪𝓶𝓮𝓷 𝓜𝓪𝓰𝓭𝔂</p>
                        <p class="dev-signature-role">مطور الموقع | الصف الأول الثانوي</p>
                    </div>
                </div>
                
                <div class="dev-footer-bar">
                    <span>📅 ${today}</span>
                    <span>🏷️ #${certNumber}</span>
                    <span>⭐ نجم الموقع ⭐</span>
                </div>
                
                <div class="dev-bottom-accent"></div>
            </div>
        `;
        
        // ========== تصميم شهادة الطالب المميز ==========
        const specialCertDesign = `
            <div class="cert-wrapper special-wrapper">
                <div class="special-sparkle special-sparkle-1">✦</div>
                <div class="special-sparkle special-sparkle-2">✧</div>
                <div class="special-sparkle special-sparkle-3">✦</div>
                <div class="special-sparkle special-sparkle-4">✧</div>
                <div class="special-sparkle special-sparkle-5">✦</div>
                <div class="special-sparkle special-sparkle-6">✧</div>
                
                <div class="special-top-ribbon"></div>
                
                <div class="special-content">
                    <div class="special-crown-container">
                        <div class="special-crown-glow"></div>
                        <span class="special-crown-icon">👑</span>
                    </div>
                    
                    <h2 class="special-school-name">مدرسة المشير محمد حسين طنطاوي</h2>
                    
                    <div class="special-ornament-divider">
                        <span class="special-ornament">❁</span>
                    </div>
                    
                    <h1 class="special-main-title">شهادة تقدير خاصة</h1>
                    <p class="special-subtitle-text">SPECIAL RECOGNITION</p>
                    
                    <div class="special-name-frame">
                        <span class="special-star-left">⭐</span>
                        <h1 class="special-student-name">${escapeHtml(userName)}</h1>
                        <span class="special-star-right">⭐</span>
                    </div>
                    
                    <p class="special-info">الصف الأول الثانوي | نظام: ${escapeHtml(userSystem)}</p>
                    
                    <div class="special-message-card">
                        <div class="special-message-icon">💝</div>
                        <p>تقديراً لدخولها الموقع وتفاعلها مع المحتوى التعليمي</p>
                        <p>وحرصها على متابعة دراستها والتزامها بالنظام</p>
                    </div>
                    
                    <div class="special-dev-note">
                        <p class="special-from-dev">🌸 من المطور مؤمن للطالبة ${escapeHtml(userName)}</p>
                        <p class="special-welcome-text">نورتينا يا بطلة 💖</p>
                    </div>
                    
                    <div class="special-signature-section">
                        <p class="special-signature-name">𝓜𝓸𝓪𝓶𝓮𝓷 𝓜𝓪𝓰𝓭𝔂</p>
                        <p class="special-signature-role">مطور الموقع | الصف الأول الثانوي</p>
                        <p class="special-signature-note">مع تحيات المطور 😉💕</p>
                    </div>
                </div>
                
                <div class="special-footer-ribbon">
                    <span>📅 ${today}</span>
                    <span>🏷️ #${certNumber}</span>
                </div>
                
                <div class="special-bottom-ribbon"></div>
            </div>
        `;
        
        // ========== تصميم شهادة الطالب العادي ==========
        const normalCertDesign = `
            <div class="cert-wrapper normal-wrapper">
                <div class="normal-corner normal-corner-tl"></div>
                <div class="normal-corner normal-corner-tr"></div>
                <div class="normal-corner normal-corner-bl"></div>
                <div class="normal-corner normal-corner-br"></div>
                
                <div class="normal-content">
                    <div class="normal-header-section">
                        <div class="normal-logo-circle">
                            <span>🎓</span>
                        </div>
                        <h2 class="normal-school-name">مدرسة المشير محمد حسين طنطاوي</h2>
                        <p class="normal-school-subtitle">الصف الأول الثانوي</p>
                    </div>
                    
                    <div class="normal-separator">
                        <span class="normal-separator-icon">⬥</span>
                    </div>
                    
                    <h1 class="normal-main-title">شهادة تقدير</h1>
                    <p class="normal-main-subtitle">CERTIFICATE OF APPRECIATION</p>
                    
                    <p class="normal-presented-to">تتشرف المدرسة بتقديم هذه الشهادة إلى الطالب</p>
                    
                    <div class="normal-name-box">
                        <div class="normal-name-line"></div>
                        <h1 class="normal-student-name">${escapeHtml(userName)}</h1>
                        <div class="normal-name-line"></div>
                    </div>
                    
                    <div class="normal-info-badges">
                        <span class="normal-badge">📚 الصف الأول الثانوي</span>
                        <span class="normal-badge">🏫 نظام: ${escapeHtml(userSystem)}</span>
                    </div>
                    
                    <div class="normal-message-section">
                        <div class="normal-message-star">🌟</div>
                        <p>تقديراً لدخوله الموقع وتفاعله مع المحتوى التعليمي</p>
                        <p>وحرصه على متابعة دراسته والتزامه بالنظام</p>
                        <p class="normal-best-wishes">مع أطيب التمنيات بدوام التوفيق والنجاح</p>
                    </div>
                    
                    <div class="normal-signature-area">
                        <div class="normal-signature-box">
                            <p class="normal-from-text">من المطور</p>
                            <p class="normal-dev-signature">𝓜𝓸𝓪𝓶𝓮𝓷 𝓜𝓪𝓰𝓭𝔂</p>
                            <p class="normal-dev-info">مطور الموقع | الصف الأول الثانوي</p>
                        </div>
                    </div>
                </div>
                
                <div class="normal-footer">
                    <div class="normal-footer-left">
                        <span>📅 ${today}</span>
                    </div>
                    <div class="normal-footer-center">
                        <div class="normal-footer-stamp">✅</div>
                    </div>
                    <div class="normal-footer-right">
                        <span>🏷️ #${certNumber}</span>
                    </div>
                </div>
            </div>
        `;
        
        const certDesign = developer ? devCertDesign : (special ? specialCertDesign : normalCertDesign);
        
        const win = window.open('', '_blank', 'width=1100,height=750');
        win.document.write(`
<!DOCTYPE html>
<html dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>شهادة تقدير - ${escapeHtml(userName)}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: #e8ecf1;
            font-family: 'Segoe UI', 'Tahoma', 'Arial', sans-serif;
            padding: 20px;
        }
        
        .cert-wrapper {
            width: 297mm;
            height: 210mm;
            position: relative;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0,0,0,0.15);
            display: flex;
            flex-direction: column;
        }
        
        /* ========== تصميم المطور ========== */
        .dev-wrapper {
            background: #0a0e17;
            border: 6px solid #6366f1;
            border-radius: 0;
        }
        
        .dev-bg-animation {
            position: absolute;
            inset: 0;
            background: 
                radial-gradient(ellipse at 20% 50%, rgba(99,102,241,0.15) 0%, transparent 50%),
                radial-gradient(ellipse at 80% 20%, rgba(139,92,246,0.1) 0%, transparent 50%),
                radial-gradient(ellipse at 50% 80%, rgba(59,130,246,0.1) 0%, transparent 50%);
            animation: devPulse 4s ease-in-out infinite;
        }
        
        @keyframes devPulse {
            0%, 100% { opacity: 0.7; }
            50% { opacity: 1; }
        }
        
        .dev-grid-pattern {
            position: absolute;
            inset: 0;
            background-image: 
                linear-gradient(rgba(99,102,241,0.05) 1px, transparent 1px),
                linear-gradient(90deg, rgba(99,102,241,0.05) 1px, transparent 1px);
            background-size: 30px 30px;
        }
        
        .dev-top-accent {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 6px;
            background: linear-gradient(90deg, #4f46e5, #6366f1, #8b5cf6, #6366f1, #4f46e5);
            z-index: 10;
        }
        
        .dev-bottom-accent {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 6px;
            background: linear-gradient(90deg, #4f46e5, #6366f1, #8b5cf6, #6366f1, #4f46e5);
            z-index: 10;
        }
        
        .dev-content {
            position: relative;
            z-index: 5;
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 20px 50px;
            text-align: center;
            gap: 6px;
        }
        
        .dev-badge-main {
            width: 70px;
            height: 70px;
            background: linear-gradient(135deg, #4f46e5, #7c3aed);
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 4px;
            box-shadow: 0 0 40px rgba(99,102,241,0.5);
        }
        
        .dev-badge-icon {
            font-size: 32px;
        }
        
        .dev-school-name {
            color: #a5b4fc;
            font-size: 18px;
            font-weight: 700;
            letter-spacing: 1px;
        }
        
        .dev-divider {
            display: flex;
            align-items: center;
            gap: 15px;
            margin: 4px 0;
        }
        
        .dev-divider::before,
        .dev-divider::after {
            content: '';
            width: 50px;
            height: 1px;
            background: rgba(99,102,241,0.5);
        }
        
        .dev-divider-diamond {
            color: #6366f1;
            font-size: 10px;
        }
        
        .dev-main-title {
            color: #818cf8;
            font-size: 34px;
            font-weight: 900;
            text-shadow: 0 0 30px rgba(99,102,241,0.5);
            margin: 0;
        }
        
        .dev-subtitle-text {
            color: rgba(165,180,252,0.6);
            font-size: 11px;
            letter-spacing: 5px;
            margin: 0;
        }
        
        .dev-name-container {
            display: flex;
            align-items: center;
            gap: 15px;
            background: rgba(99,102,241,0.1);
            border: 2px solid rgba(99,102,241,0.4);
            padding: 12px 30px;
            border-radius: 10px;
            margin: 6px 0;
        }
        
        .dev-name-bracket {
            color: #6366f1;
            font-size: 28px;
            font-weight: 300;
        }
        
        .dev-student-name {
            color: #e2e8f0;
            font-size: 30px;
            font-weight: 800;
            margin: 0;
        }
        
        .dev-tags {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            justify-content: center;
            margin: 4px 0;
        }
        
        .dev-tag {
            background: rgba(99,102,241,0.15);
            color: #a5b4fc;
            padding: 4px 14px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 600;
            border: 1px solid rgba(99,102,241,0.3);
        }
        
        .dev-achievement-box {
            display: flex;
            flex-direction: column;
            gap: 6px;
            background: rgba(30,41,59,0.6);
            border: 1px solid rgba(99,102,241,0.3);
            border-radius: 12px;
            padding: 14px 20px;
            margin: 6px 0;
            max-width: 500px;
        }
        
        .dev-achievement-item {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .dev-achievement-icon {
            font-size: 16px;
            flex-shrink: 0;
        }
        
        .dev-achievement-item p {
            color: #cbd5e1;
            font-size: 12px;
            margin: 0;
            text-align: right;
        }
        
        .dev-signature-section {
            text-align: center;
            margin-top: 6px;
        }
        
        .dev-signature-line {
            width: 120px;
            height: 1px;
            background: rgba(99,102,241,0.5);
            margin: 0 auto 6px;
        }
        
        .dev-signature-text {
            color: #818cf8;
            font-family: 'Georgia', serif;
            font-size: 18px;
            margin: 0;
            letter-spacing: 2px;
        }
        
        .dev-signature-role {
            color: #64748b;
            font-size: 10px;
            margin: 2px 0;
        }
        
        .dev-footer-bar {
            position: relative;
            z-index: 5;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 30px;
            background: rgba(99,102,241,0.1);
            border-top: 1px solid rgba(99,102,241,0.2);
            color: #94a3b8;
            font-size: 10px;
            font-weight: 600;
        }
        
        /* ========== تصميم الطالب المميز ========== */
        .special-wrapper {
            background: linear-gradient(150deg, #fdf2f8 0%, #fce7f3 25%, #fdf4ff 50%, #fef3c7 75%, #fef9c3 100%);
            border: 6px solid #d4a017;
            box-shadow: 0 0 60px rgba(212,160,23,0.2);
        }
        
        .special-sparkle {
            position: absolute;
            font-size: 16px;
            color: #d4a017;
            animation: sparkleFloat 3s ease-in-out infinite;
            z-index: 3;
            opacity: 0.7;
        }
        
        .special-sparkle-1 { top: 8%; left: 8%; animation-delay: 0s; }
        .special-sparkle-2 { top: 12%; right: 10%; animation-delay: 0.5s; }
        .special-sparkle-3 { top: 50%; left: 4%; animation-delay: 1s; font-size: 12px; }
        .special-sparkle-4 { top: 55%; right: 5%; animation-delay: 1.5s; font-size: 12px; }
        .special-sparkle-5 { bottom: 15%; left: 12%; animation-delay: 0.8s; }
        .special-sparkle-6 { bottom: 18%; right: 8%; animation-delay: 1.8s; }
        
        @keyframes sparkleFloat {
            0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.5; }
            50% { transform: translateY(-12px) rotate(20deg); opacity: 1; }
        }
        
        .special-top-ribbon,
        .special-bottom-ribbon {
            position: absolute;
            left: 0;
            right: 0;
            height: 10px;
            background: linear-gradient(90deg, #d4a017, #fbbf24, #d4a017);
            z-index: 10;
        }
        
        .special-top-ribbon { top: 0; }
        .special-bottom-ribbon { bottom: 0; }
        
        .special-content {
            position: relative;
            z-index: 5;
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 20px 50px;
            text-align: center;
            gap: 5px;
        }
        
        .special-crown-container {
            position: relative;
            margin-bottom: 4px;
        }
        
        .special-crown-glow {
            position: absolute;
            inset: -12px;
            background: radial-gradient(circle, rgba(212,160,23,0.3) 0%, transparent 70%);
            border-radius: 50%;
            animation: crownGlow 2s ease-in-out infinite;
        }
        
        @keyframes crownGlow {
            0%, 100% { transform: scale(0.9); opacity: 0.5; }
            50% { transform: scale(1.2); opacity: 1; }
        }
        
        .special-crown-icon {
            font-size: 48px;
            position: relative;
            z-index: 2;
            animation: crownBounce 2s ease-in-out infinite;
        }
        
        @keyframes crownBounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-8px); }
        }
        
        .special-school-name {
            color: #b8860b;
            font-size: 18px;
            font-weight: 800;
            letter-spacing: 1px;
        }
        
        .special-ornament-divider {
            display: flex;
            align-items: center;
            gap: 15px;
            margin: 3px 0;
        }
        
        .special-ornament-divider::before,
        .special-ornament-divider::after {
            content: '';
            width: 40px;
            height: 2px;
            background: linear-gradient(90deg, transparent, #d4a017, transparent);
        }
        
        .special-ornament {
            color: #d4a017;
            font-size: 14px;
        }
        
        .special-main-title {
            color: #d4a017;
            font-size: 36px;
            font-weight: 900;
            text-shadow: 0 2px 10px rgba(212,160,23,0.3);
            margin: 0;
        }
        
        .special-subtitle-text {
            color: #b8860b;
            font-size: 10px;
            letter-spacing: 4px;
            margin: 0;
        }
        
        .special-name-frame {
            display: flex;
            align-items: center;
            gap: 12px;
            background: linear-gradient(135deg, rgba(255,255,255,0.8), rgba(254,243,199,0.5));
            border: 2px solid rgba(212,160,23,0.5);
            padding: 12px 28px;
            border-radius: 50px;
            margin: 6px 0;
            box-shadow: 0 4px 20px rgba(212,160,23,0.15);
        }
        
        .special-star-left,
        .special-star-right {
            font-size: 22px;
            animation: starTwinkle 1.5s ease-in-out infinite;
        }
        
        .special-star-right {
            animation-delay: 0.75s;
        }
        
        @keyframes starTwinkle {
            0%, 100% { opacity: 0.4; transform: scale(0.8); }
            50% { opacity: 1; transform: scale(1.2); }
        }
        
        .special-student-name {
            color: #8b6914;
            font-size: 30px;
            font-weight: 900;
            margin: 0;
        }
        
        .special-info {
            color: #b8860b;
            font-size: 12px;
            font-weight: 600;
            margin: 2px 0;
        }
        
        .special-message-card {
            background: rgba(255,255,255,0.7);
            border: 1px dashed rgba(212,160,23,0.4);
            border-radius: 14px;
            padding: 12px 20px;
            margin: 5px 0;
            max-width: 450px;
        }
        
        .special-message-icon {
            font-size: 20px;
            margin-bottom: 4px;
        }
        
        .special-message-card p {
            color: #7a6116;
            font-size: 12px;
            margin: 2px 0;
        }
        
        .special-dev-note {
            margin: 6px 0;
        }
        
        .special-from-dev {
            color: #c06090;
            font-size: 13px;
            font-weight: 700;
            margin: 0;
        }
        
        .special-welcome-text {
            color: #d4a017;
            font-size: 18px;
            font-weight: 900;
            margin: 3px 0;
            text-shadow: 0 2px 8px rgba(212,160,23,0.2);
        }
        
        .special-signature-section {
            text-align: center;
            margin-top: 5px;
        }
        
        .special-signature-name {
            color: #c090a0;
            font-family: 'Georgia', serif;
            font-size: 16px;
            margin: 0;
            letter-spacing: 2px;
        }
        
        .special-signature-role {
            color: #b8a090;
            font-size: 9px;
            margin: 2px 0;
        }
        
        .special-signature-note {
            color: #d0a0b0;
            font-size: 8px;
            margin: 2px 0;
            font-style: italic;
        }
        
        .special-footer-ribbon {
            position: relative;
            z-index: 5;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 30px;
            background: rgba(212,160,23,0.15);
            border-top: 1px solid rgba(212,160,23,0.3);
            color: #8b6914;
            font-size: 10px;
            font-weight: 600;
        }
        
        /* ========== تصميم الطالب العادي ========== */
        .normal-wrapper {
            background: linear-gradient(160deg, #fefefe 0%, #f8fafc 40%, #f1f5f9 100%);
            border: 4px solid #cbd5e1;
            border-radius: 8px;
        }
        
        .normal-corner {
            position: absolute;
            width: 40px;
            height: 40px;
            border-color: #2c6e9b;
            border-style: solid;
            z-index: 10;
        }
        
        .normal-corner-tl { top: 15px; left: 15px; border-width: 3px 0 0 3px; border-radius: 8px 0 0 0; }
        .normal-corner-tr { top: 15px; right: 15px; border-width: 3px 3px 0 0; border-radius: 0 8px 0 0; }
        .normal-corner-bl { bottom: 15px; left: 15px; border-width: 0 0 3px 3px; border-radius: 0 0 0 8px; }
        .normal-corner-br { bottom: 15px; right: 15px; border-width: 0 3px 3px 0; border-radius: 0 0 8px 0; }
        
        .normal-content {
            position: relative;
            z-index: 5;
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 20px 50px;
            text-align: center;
            gap: 5px;
        }
        
        .normal-header-section {
            text-align: center;
        }
        
        .normal-logo-circle {
            width: 55px;
            height: 55px;
            background: linear-gradient(135deg, #e8f0f8, #d0e4f5);
            border: 3px solid #2c6e9b;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 8px;
            font-size: 24px;
        }
        
        .normal-school-name {
            color: #1e293b;
            font-size: 18px;
            font-weight: 800;
            margin: 0;
        }
        
        .normal-school-subtitle {
            color: #64748b;
            font-size: 11px;
            margin: 2px 0;
        }
        
        .normal-separator {
            display: flex;
            align-items: center;
            gap: 20px;
            margin: 4px 0;
        }
        
        .normal-separator::before,
        .normal-separator::after {
            content: '';
            width: 60px;
            height: 1px;
            background: #cbd5e1;
        }
        
        .normal-separator-icon {
            color: #2c6e9b;
            font-size: 8px;
        }
        
        .normal-main-title {
            color: #2c6e9b;
            font-size: 34px;
            font-weight: 900;
            letter-spacing: 2px;
            margin: 0;
        }
        
        .normal-main-subtitle {
            color: #94a3b8;
            font-size: 10px;
            letter-spacing: 4px;
            margin: 0;
        }
        
        .normal-presented-to {
            color: #64748b;
            font-size: 14px;
            margin: 6px 0;
        }
        
        .normal-name-box {
            display: flex;
            align-items: center;
            gap: 15px;
            margin: 5px 0;
        }
        
        .normal-name-line {
            width: 40px;
            height: 3px;
            background: linear-gradient(90deg, transparent, #2c6e9b, transparent);
            border-radius: 2px;
        }
        
        .normal-student-name {
            color: #1e293b;
            font-size: 30px;
            font-weight: 900;
            margin: 0;
            border-bottom: 3px solid #fbbf24;
            padding-bottom: 4px;
        }
        
        .normal-info-badges {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            justify-content: center;
            margin: 5px 0;
        }
        
        .normal-badge {
            background: #e8f0f8;
            color: #2c6e9b;
            padding: 5px 14px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 700;
        }
        
        .normal-message-section {
            background: #f8fafc;
            border: 1px dashed #cbd5e1;
            border-radius: 12px;
            padding: 12px 25px;
            margin: 6px 0;
            max-width: 450px;
        }
        
        .normal-message-star {
            font-size: 20px;
            margin-bottom: 3px;
        }
        
        .normal-message-section p {
            color: #475569;
            font-size: 12px;
            margin: 2px 0;
        }
        
        .normal-best-wishes {
            color: #2c6e9b !important;
            font-weight: 700;
            margin-top: 6px !important;
        }
        
        .normal-signature-area {
            margin-top: 8px;
        }
        
        .normal-signature-box {
            text-align: center;
            padding: 10px 20px;
            border-top: 1px solid #e2e8f0;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .normal-from-text {
            color: #94a3b8;
            font-size: 10px;
            margin: 0;
        }
        
        .normal-dev-signature {
            color: #4f46e5;
            font-family: 'Georgia', serif;
            font-size: 16px;
            margin: 4px 0;
            letter-spacing: 2px;
        }
        
        .normal-dev-info {
            color: #94a3b8;
            font-size: 9px;
            margin: 0;
        }
        
        .normal-footer {
            position: relative;
            z-index: 5;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 30px;
            border-top: 1px solid #e2e8f0;
            color: #94a3b8;
            font-size: 10px;
            font-weight: 600;
        }
        
        .normal-footer-stamp {
            width: 30px;
            height: 30px;
            border: 2px solid #10b981;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #10b981;
            font-size: 14px;
            transform: rotate(-15deg);
        }
        
        /* ========== طباعة ========== */
        @media print {
            body { background: white; padding: 0; }
            .cert-wrapper { box-shadow: none; margin: 0; }
        }
    </style>
</head>
<body>
    ${certDesign}
    <script>
        setTimeout(function() {
            if (confirm('هل تريد طباعة الشهادة؟')) {
                window.print();
            }
        }, 500);
    </script>
</body>
</html>
        `);
        win.document.close();
    }

    // ========== عرض المراجعة ==========
    function showReview(n, p, s) {
        if (reviewName) reviewName.textContent = n;
        if (reviewPhone) reviewPhone.textContent = p;
        if (reviewSystem) reviewSystem.textContent = s;
    }

    // ========== عرض الصفحة الرئيسية ==========
    async function showHomePage(userName) {
        // ✅ إخفاء الـ Skeleton Loader
        hideSkeletonLoader();
        
        await loadRandomTestimonial();
        toggleModal(loginModal, false); 
        toggleModal(confirmPopup, false);
        appContainer.style.display = 'block';
        
        const user = getLocalUser();
        const sys = user && user.system ? ` <span style="color:#f59e0b">(${escapeHtml(user.system)})</span>` : '';
        welcomeMessage.innerHTML = `أهلاً بيك يا <span style="color:red">${escapeHtml(userName)}</span>${sys}`;
        
        if (passwordGroup) passwordGroup.style.display = 'none';
        isPasswordRequired = false; 
        existingUserData = null; 
        passwordAttempts = 0;
        if (loginSubmitBtn) loginSubmitBtn.textContent = 'الدخول';
        
        startCountdowns(); 
        updateVisitorCount(); 
        updateFooterStats();
        await updateStudentIP();
        await updateCertUI();
        setRandomTip();
        
        document.querySelectorAll('#app .card').forEach((c, index) => { 
            c.style.opacity = '0'; 
            c.style.transform = 'translateY(20px)'; 
            c.style.transition = `all 0.4s ease ${index * 0.05}s`;
            setTimeout(() => { c.style.opacity = '1'; c.style.transform = 'translateY(0)'; }, 100);
        });
    }

    // ========== فتح/إغلاق النوافذ المنبثقة ==========
    function toggleModal(m, s) { 
        if (!m) return;
        if (s) m.classList.add('active'); 
        else m.classList.remove('active'); 
    }

    // ========== تأكيد التسجيل ==========
    async function onConfirmYes() {
        if (!pendingData) return;
        const { name, phone, system } = pendingData;
        if (containsForbiddenText(name)) { await autoBan(phone, `كلمات مسيئة: "${escapeHtml(name)}"`); return; }
        
        const pw = prompt('🔑 اختار كلمة سر للدخول:');
        if (!pw || !pw.trim()) { alert('لازم تحط كلمة سر!'); return; }
        
        saveLocal(name, phone, system);
        await sendToFirestore(name, phone, system, pw.trim());
        showHomePage(name);
        pendingData = null;
    }

    // ========== تسجيل الدخول ==========
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const n = fullNameInput.value.trim(), p = whatsappInput.value.trim();
            
            if (!n || !p) { alert('برجاء ملء جميع الحقول'); return; }
            if (containsForbiddenText(n)) { await autoBan(p, `كلمات مسيئة: "${escapeHtml(n)}"`); return; }
            if (!isValidName(n)) { alert('الاسم ثلاثي على الأقل'); return; }
            if (!isValidPhone(p)) { alert('رقم غير صالح'); return; }
            
            if (isPasswordRequired) {
                const pw = passwordInput.value.trim();
                if (!pw) { alert('اكتب كلمة السر!'); return; }
                if (pw === existingUserData.password) {
                    saveLocal(existingUserData.name, p, existingUserData.system);
                    passwordAttempts = 0;
                    showHomePage(existingUserData.name);
                    return;
                } else {
                    await handleWrongPassword(p);
                    passwordInput.value = '';
                    passwordInput.focus();
                    return;
                }
            }
            
            if (window.db) {
                const q = window.firebaseQuery(
                    window.firebaseCollection(window.db, "students"), 
                    window.firebaseWhere("phone", "==", p.trim())
                );
                const snap = await window.firebaseGetDocs(q);
                if (!snap.empty) {
                    existingUserData = snap.docs[0].data();
                    isPasswordRequired = true;
                    if (passwordGroup) passwordGroup.style.display = 'block';
                    if (loginSubmitBtn) loginSubmitBtn.textContent = '🔓 ادخل يا معلم';
                    alert('👋 انت مسجل عندنا!\nاكتب كلمة السر.');
                    passwordInput.focus();
                    return;
                }
            }
            
            pendingData = { name: n, phone: p, system: selectedSystem };
            if (confirmText) confirmText.textContent = '🔄 راجع بياناتك:';
            showReview(n, p, selectedSystem);
            toggleModal(confirmPopup, true);
        });
    }

    if (confirmYes) confirmYes.addEventListener('click', onConfirmYes);
    if (confirmNo) confirmNo.addEventListener('click', () => { 
        toggleModal(confirmPopup, false); 
        pendingData = null; 
        toggleModal(loginModal, true);
    });
    
    if (editDataBtn) editDataBtn.addEventListener('click', () => { 
        if (developerSection) {
            developerSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
            developerSection.classList.add('highlight');
            setTimeout(() => developerSection.classList.remove('highlight'), 2000);
        }
    });
    
    if (forgotPasswordBtn) {
        forgotPasswordBtn.addEventListener('click', () => {
            const n = fullNameInput.value.trim() || 'طالب';
            const p = whatsappInput.value.trim() || '';
            window.open('https://wa.me/201224736512?text=' + encodeURIComponent(`😂 نسيت كلمة السر! ${n} - ${p}`), '_blank');
        });
    }

    if (downloadCertBtn) {
        downloadCertBtn.addEventListener('click', window.downloadCertificate);
    }

    // ========== PWA INSTALL ==========
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
    });
    
    if (installPwaBtn) {
        installPwaBtn.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                    installPwaBtn.textContent = '✅ تم التثبيت';
                    installPwaBtn.classList.add('installed');
                    setTimeout(() => { installPwaBtn.style.display = 'none'; }, 5000);
                }
                deferredPrompt = null;
            } else {
                alert('📱 للتثبيت:\n• أندرويد: ⁝ ← تثبيت\n• آيفون: 📤 ← إضافة للشاشة');
            }
        });
    }
    
    window.addEventListener('appinstalled', () => {
        if (installPwaBtn) {
            installPwaBtn.textContent = '✅ تم التثبيت';
            installPwaBtn.classList.add('installed');
            setTimeout(() => { installPwaBtn.style.display = 'none'; }, 5000);
        }
    });

    // ========== نظام آراء الطلاب ==========
    /**
     * تحميل رأي عشوائي معتمد من قاعدة البيانات
     */
    async function loadRandomTestimonial() {
        if (!testimonialContent || !window.db) return;
        
        try {
            const q = window.firebaseQuery(
                window.firebaseCollection(window.db, "testimonials"),
                window.firebaseWhere("status", "==", "approved")
            );
            const snap = await window.firebaseGetDocs(q);
            
            const testimonials = [];
            snap.forEach(d => {
                testimonials.push(d.data());
            });
            
            if (testimonials.length === 0) {
                testimonialContent.innerHTML = `
                    <div class="testimonial-empty">
                        <span class="testimonial-empty-icon">💭</span>
                        <p>مفيش آراء لسه! كون أول واحد يكتب رأيه 👇</p>
                    </div>
                `;
                return;
            }
            
            const random = testimonials[Math.floor(Math.random() * testimonials.length)];
            
            const emojis = ['⭐', '🌟', '💫', '✨', '🔥', '💪', '❤️', '🙏', '👏', '🎉'];
            const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
            
            testimonialContent.innerHTML = `
                <div class="testimonial-card">
                    <div class="testimonial-quote">❝</div>
                    <p class="testimonial-text">${escapeHtml(random.message)}</p>
                    <div class="testimonial-author">
                        <span class="testimonial-avatar">${randomEmoji}</span>
                        <div>
                            <span class="testimonial-name">${escapeHtml(random.studentName)}</span>
                            <span class="testimonial-badge">${escapeHtml(random.studentSystem || 'طالب')}</span>
                        </div>
                    </div>
                    <div class="testimonial-time">${random.createdAt ? new Date(random.createdAt.seconds * 1000).toLocaleDateString('ar-EG') : ''}</div>
                </div>
            `;
            
        } catch (e) {
            console.error('Error loading testimonial:', e);
            testimonialContent.innerHTML = `
                <div class="testimonial-empty">
                    <span class="testimonial-empty-icon">⚠️</span>
                    <p>حصل خطأ. جرب تضغط تحديث 🔄</p>
                </div>
            `;
        }
    }

    /**
     * إرسال رأي جديد
     */
    async function submitTestimonial() {
        if (!testimonialInput || !window.db) return;
        
        const message = testimonialInput.value.trim();
        const user = getLocalUser();
        
        if (!user || !user.phone) {
            showToast('❌ لازم تسجل دخول الأول!');
            return;
        }
        
        if (!message) {
            showToast('❌ اكتب رأيك الأول!');
            return;
        }
        
        if (message.length < 5) {
            showToast('❌ الرأي لازم يكون 5 حروف على الأقل');
            return;
        }
        
        if (message.length > 200) {
            showToast('❌ الرأي أقصاه 200 حرف');
            return;
        }
        
        if (containsForbiddenText(message)) {
            showToast('❌ في كلمات مش مسموح بيها!');
            return;
        }
        
        try {
            submitTestimonialBtn.disabled = true;
            submitTestimonialBtn.textContent = '⏳ جاري الإرسال...';
            
            await window.firebaseAddDoc(
                window.firebaseCollection(window.db, "testimonials"),
                {
                    message: message,
                    studentName: user.name,
                    studentPhone: user.phone,
                    studentSystem: user.system || 'عام',
                    status: 'pending',
                    createdAt: new Date()
                }
            );
            
            testimonialInput.value = '';
            testimonialCharCount.textContent = '0 / 200';
            testimonialCharCount.style.color = '#64748b';
            showToast('✅ تم إرسال رأيك! هيظهر بعد المراجعة ❤️');
            
            await loadRandomTestimonial();
            
        } catch (e) {
            console.error('Submit error:', e);
            showToast('❌ حصل خطأ. جرب تاني!');
        } finally {
            submitTestimonialBtn.disabled = false;
            submitTestimonialBtn.textContent = '📨 إرسال';
        }
    }

    // ========== أحداث أزرار الآراء ==========
    if (refreshTestimonialBtn) {
        refreshTestimonialBtn.addEventListener('click', () => {
            testimonialContent.style.opacity = '0';
            testimonialContent.style.transform = 'translateY(10px)';
            setTimeout(() => {
                loadRandomTestimonial();
                testimonialContent.style.opacity = '1';
                testimonialContent.style.transform = 'translateY(0)';
            }, 300);
        });
    }

    if (testimonialInput) {
        testimonialInput.addEventListener('input', () => {
            const count = testimonialInput.value.length;
            testimonialCharCount.textContent = `${count} / 200`;
            
            testimonialCharCount.style.color = '#64748b';
            
            if (count > 180) {
                testimonialCharCount.style.color = '#ef4444';
            } else if (count > 150) {
                testimonialCharCount.style.color = '#f59e0b';
            }
        });
    }

    if (submitTestimonialBtn) {
        submitTestimonialBtn.addEventListener('click', submitTestimonial);
    }

    // ========== بدء التشغيل ==========
    loadDarkMode();
    updateVisitorCount();
    setRandomTip();
    setInterval(updateVisitorCount, 30000);
    setInterval(setRandomTip, 30000);
    
    const user = getLocalUser();
    if (user && user.name) {
        const checkUser = async () => {
            if (!user || !user.phone || !window.db) return true;
            try {
                const q = window.firebaseQuery(window.firebaseCollection(window.db, "students"), window.firebaseWhere("phone", "==", user.phone));
                const snapshot = await window.firebaseGetDocs(q);
                return !snapshot.empty;
            } catch (e) { return true; }
        };
        checkUser().then(exists => {
            if (exists) {
                toggleModal(loginModal, false);
                showHomePage(user.name);
            } else {
                localStorage.removeItem('school_user');
                toggleModal(loginModal, true);
                if (appContainer) appContainer.style.display = 'none';
                // ✅ إخفاء Skeleton إذا لم يكن المستخدم مسجلاً
                hideSkeletonLoader();
            }
        });
    } else {
        toggleModal(loginModal, true);
        // ✅ إخفاء Skeleton إذا لم يكن هناك مستخدم
        hideSkeletonLoader();
    }
    if (confirmPopup) confirmPopup.classList.remove('active');
}