# تقرير: إضافة رفع الصورة الشخصية للطالب (Supabase Storage + Firestore + Dashboard)

> الموقع: مدرسة المشير محمد حسين طنطاوي — بوابة الطلاب
> نسخة المشروع: v15 — تُطبَّق مباشرة على مجلد `My Scholl-site - Copy - Copy` (المجلد الجذر للمشروع).

---

## 1) طريقة حفظ بيانات الطالب حالياً في Firestore (الحقول بالضبط)

التسجيل يتم في **مجموعة** واحدة اسمها `students` عبر الدالة `sendToFirestore(u, pass)` في `script.js:914`، باستخدام `addDoc` (أي أن `document id` يُنشأ تلقائياً من Firebase).

الحقول المرسلة في `addDoc` (من `script.js:928-940`):

| الحقل (Field) | القيمة المستخدمة (JavaScript) | النوع |
|---|---|---|
| `name` | `u.name` (من `fullNameInput.value`) | string |
| `phone` | `u.phone` (من `whatsappInput.value`) | string |
| `system` | `u.system || ''` ("عام" / "خدمات") | string |
| `stage` | `u.stage` ("ثانوي" / "إعدادي") | string |
| `year` | `u.year` | string |
| `educationSystem` | `u.educationSystem || ''` ("عام" / "بكالوريا") | string |
| `division` | `u.division || ''` (الشعبة) | string |
| `track` | `u.track || ''` (المسار) | string |
| `subject` | `u.subject || ''` (المادة) | string |
| `password` | `pass` (كلمة السر التي يكتبها الطالب) | string |
| `ip` | `window.userIP` | string |
| `fingerprint` | `fp` (بصمة الجهاز من FingerprintJS) | string |
| `visitCount` | `1` | number |
| `city` | `city` (من GeoIP) | string |
| `region` | `region` | string |
| `device` | `device` (Android / iOS / كمبيوتر) | string |
| `lastLogin` | `new Date()` | timestamp |
| `createdAt` | `new Date()` | timestamp |

الكائن `u` يُبنى من الدالة `buildUserData()` في `script.js:334`، ومفاتيحه (المتغيرات): `name`, `phone`, `stage`, `year`, `system`, `educationSystem`, `division`, `track`, `subject`.

عند كل تسجيل دخول يتم **تحديث** المستند فقط (لا إنشاء مستند جديد) عبر `updateStudentIP()` في `script.js:940`، ويكتب: `ip`, `city`, `region`, `device`, `lastLogin`, ويزيد `visitCount` بـ `firebaseIncrement(1)`.

> الحقل الجديد المضافة لإزالة إلى نفس المجموعة هو: **`photoUrl`** (string — رابط الصورة من Supabase).

---

## 2) كود صفحة التسجيل الحالية + طريقة إضافة حقل رفع الصورة

### الكود الحالي لنموذج التسجيل في `index.html:231-246` (قبل التعديل):
```html
<form id="loginForm" autocomplete="off">
  <div class="input-group">
    <label for="fullName">الاسم الكامل</label>
    <input type="text" id="fullName" placeholder="أدخل الاسم الكامل (اسم ثلاثي)" required>
  </div>
  <div class="input-group">
    <label for="whatsapp">رقم الواتساب</label>
    <input type="tel" id="whatsapp" placeholder="01xxxxxxxxx" required dir="ltr">
  </div>
  <div class="input-group" id="passwordGroup" style="display:none;">
    <label for="password">🔑 كلمة السر</label>
    <input type="password" id="password" ... dir="ltr">
    <button type="button" id="forgotPasswordBtn" ...>🤔 نسيت كلمة السر؟</button>
  </div>
  <button type="submit" class="btn-primary" id="loginSubmitBtn">الدخول</button>
</form>
```

### حقل رفع الصورة `File Input` المضاف (بعد حقل الواتساب مباشرة):
```html
<div class="input-group" id="photoUploadGroup">
  <label for="studentPhoto">📷 صورة شخصية للطالب (اختياري)</label>
  <input type="file" id="studentPhoto" accept="image/*">
  <img id="photoPreview" class="photo-preview" alt="معاينة الصورة" style="display:none;">
</div>
```

وأضيف في نافذة التأكيد `index.html` (داخل `reviewData`) سطر مراجعة الصورة:
```html
<div class="review-item"><span class="review-label">🖼️ الصورة:</span><span class="review-value" id="reviewPhoto"></span></div>
```

وأضيف التنسيق:
```css
.photo-preview {
  width: 90px; height: 90px; object-fit: cover; border-radius: 50%;
  margin-top: 0.6rem; border: 3px solid #2c6e9b; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}
.photo-preview-thumb { width: 70px; height: 70px; object-fit: cover; border-radius: 50%; border: 2px solid #2c6e9b; }
```

**تم تطبيق هذه التعديلات فعلياً على `index.html`** (حقل الإدخال + المعاينة + سطر المراجعة + CSS + تحميل SDK).

---

## 3) كود JavaScript المطلوب لرفع الصورة إلى Supabase Storage (bucket: `student-photos`)

تم إنشاء الملف **`js/supabase.js`** ويُحمَّل قبل `script.js` في `index.html`:

```html
<!-- في آخر body داخل index.html -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="js/utils.js"></script>
<script src="js/app.js"></script>
<script src="js/supabase.js"></script>
<script src="script.js"></script>
```

محتوى `js/supabase.js` (جاهز — استبدل القيمتين من لوحة تحكم Supabase → Settings → API):

```js
window.SUPABASE_URL = 'https://YOUR-PROJECT-REF.supabase.co';
window.SUPABASE_ANON_KEY = 'YOUR-PUBLIC-ANON-KEY';

let supabaseClient = null;
function getSupabaseClient() {
    if (supabaseClient) return supabaseClient;
    if (!window.supabase) { console.error('Supabase SDK غير محمّل'); return null; }
    supabaseClient = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
    return supabaseClient;
}

window.uploadStudentPhoto = async function (file, phone) {
    try {
        if (!file) return '';
        const sb = getSupabaseClient();
        if (!sb) throw new Error('Supabase غير جاهز');

        const cleanPhone = String(phone || 'student').replace(/[^0-9]/g, '');
        const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
        const filePath = `students/${cleanPhone}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const { data, error } = await sb.storage
            .from('student-photos')
            .upload(filePath, file, { upsert: true, contentType: file.type || 'image/jpeg' });
        if (error) throw error;

        const { data: publicData } = sb.storage.from('student-photos').getPublicUrl(filePath);
        return publicData.publicUrl;   // ✅ رابط الصورة النهائي
    } catch (err) {
        console.error('خطأ في رفع الصورة لـ Supabase:', err);
        return '';
    }
};
```

### متطلبات Supabase (بعد إدخال الرابط والمفتاح):
1. اجعل الـ Bucket **`student-photos`** **Public** (Supabase → Storage → ايقونة الترس/القائمة على الباكِت → Make public).
2. أضف سياسات رفع عامة (Policies) تسمح بـ INSERT + SELECT على الـ Bucket:
```sql
create policy "public upload student photos"
on storage.objects for insert to anon, authenticated
with check (bucket_id = 'student-photos');

create policy "public read student photos"
on storage.objects for select to anon, authenticated
using (bucket_id = 'student-photos');
```

---

## 4) ربط رابط الصورة المرفوعة مع مستند الطالب في Firestore

يتم الربط بحفظ رابط الصورة (الناتج من `uploadStudentPhoto`) في الحقل **`photoUrl`** داخل مستند الطالب في مجموعة `students`.

### (أ) طالب جديد — التسجيل الأول (عند الضغط على "نعم، البيانات صحيحة")
الدالة `sendToFirestore` أصبحت تستقبل `photoUrl` (تعديل في `script.js:914-940`):
```js
async function sendToFirestore(u, pass, photoUrl) {
    ...
    await window.firebaseAddDoc(window.firebaseCollection(window.db, "students"), {
        name: u.name, phone: u.phone, system: u.system || '',
        stage: u.stage, year: u.year, educationSystem: u.educationSystem || '',
        division: u.division || '', track: u.track || '', subject: u.subject || '',
        password: pass,
        photoUrl: photoUrl || '',                    // ← الرابط من Supabase
        ip: window.userIP, fingerprint: fp, visitCount: 1,
        city: city, region: region, device: device,
        lastLogin: new Date(), createdAt: new Date()
    });
}
```

والاستدعاء داخل `onConfirmYes()` (`script.js:2170`):
```js
let photoUrl = '';
if (selectedPhotoFile) {
    photoUrl = await window.uploadStudentPhoto(selectedPhotoFile, phone);
}
saveLocal(pendingData);
await sendToFirestore(pendingData, pw.trim(), photoUrl);
```

ملاحظة: قيمة `selectedPhotoFile` هي ملف الصورة المخزَّن من حقل `<input type="file" id="studentPhoto">` عند `change`.

### (ب) طالب مسجَّل يحدّث صورته (عند تسجيل الدخول بكلمة السر)
داخل فرع نجاح كلمة السر في `loginForm` submit handler (`script.js:2215-2235`):
```js
if (selectedPhotoFile) {
    const uploadedUrl = await window.uploadStudentPhoto(selectedPhotoFile, p);
    if (uploadedUrl) {
        storedUser.photoUrl = uploadedUrl;
        const upQ = window.firebaseQuery(window.firebaseCollection(window.db, "students"),
                     window.firebaseWhere("phone", "==", p));
        const upSnap = await window.firebaseGetDocs(upQ);
        if (!upSnap.empty) {
            await window.firebaseUpdateDoc(window.firebaseDoc(window.db, "students", upSnap.docs[0].id),
                { photoUrl: uploadedUrl });
        }
    }
}
```
> هكذا يتحدّث نفس المستند (نفس الـ document id عبر البحث بـ `phone`) بدون تكرار، ويُحفظ الرابط في `photoUrl`.

---

## 5) كود عرض صورة الطالب في الـ Dashboard للإدارة

> **الـ Dashboard مشروع منفصل تماماً** — لم يتم إنشاء أي ملفات له داخل هذا المشروع. الكود التالي مكتوب فقط كمرجع جاهز لتضعه في مشروع الداشبورد المنفصل (يقرأ `photoUrl` من نفس مجموعة `students` في Firebase).

### كود جلب الطلاب وعرض الجدول (يُوضع في مشروع الداشبورد المنفصل):
```js
const snap = await getDocs(collection(db, 'students'));
allStudents = snap.docs.map(d => ({ id: d.id, ...d.data() }));
```

### كود عرض الصورة بجانب بيانات الطالب (الدالة `renderPhoto`):
```js
function renderPhoto(student) {
  const photoUrl = student.photoUrl;
  if (photoUrl) {
    return `<img class="dp" src="${escapeHtml(photoUrl)}" alt="صورة ${escapeHtml(student.name || '')}"
             onerror="this.style.display='none'; this.insertAdjacentHTML('afterend','<div class=&quot;no-photo&quot;>&#128100;</div>');">`;
  }
  return `<div class="no-photo">${escapeHtml((student.name || '؟').trim().charAt(0))}</div>`;
}
```

### صف الجدول (داخل `renderTable`):
```js
studentsBody.innerHTML = filtered.map(s => `
  <tr>
    <td data-label="الصورة">${renderPhoto(s)}</td>
    <td data-label="الاسم"><strong>${escapeHtml(s.name || '—')}</strong></td>
    <td data-label="رقم الواتساب">
      <a class="phone-link" href="https://wa.me/2${escapeHtml(String(s.phone || '').replace(/\D/g, ''))}" target="_blank" rel="noopener">${escapeHtml(s.phone || '—')}</a>
    </td>
    <td data-label="المرحلة"><span class="badge ${s.stage === 'إعدادي' ? 'prep' : ''}">${escapeHtml(s.stage || '—')}</span></td>
    <td data-label="التفاصيل">${renderDetails(s)}</td>
    <td data-label="آخر تسجيل" class="row-status">${formatDate(s.lastLogin)}</td>
  </tr>
`).join('');
```

CSS الأساسي للصورة في الـ Dashboard:
```css
.dp { width: 54px; height: 54px; border-radius: 50%; object-fit: cover;
      border: 2px solid #2c6e9b; background: #e2e8f0; }
.no-photo { width: 54px; height: 54px; border-radius: 50%; background: #e2e8f0;
            color: #94a3b8; display: flex; align-items: center; justify-content: center;
            font-weight: 800; border: 2px dashed #cbd5e1; }
```

> الترميز الآمن: تستخدم اللوحة دالة `escapeHtml()` خاصة بها كي لا تنكسر `innerHTML` (الحماية من XSS) — وبيانات Firebase التابعة للمشروع (apiKey..) مُشفّرة بذات طريقة Base64 المستخدمة في `index.html`.

---

## ملخص الملفات المضافة/المعدَّلة

| الملف | الحالة | الوصف |
|---|---|---|
| `js/supabase.js` | ✅ جديد | رفع الصورة إلى Supabase (bucket `student-photos`) واستخراج الرابط |
| `index.html` | ✅ معدَّل | إضافة حقل الملف + المعاينة + سطر مراجعة الصورة + تحميل Supabase SDK |
| `script.js` | ✅ معدَّل | تمرير `photoUrl` إلى Firestore، رفع الصورة في التسجيل وتسجيل الدخول |
| `REPORT-Student-Photo-Upload.md` | ✅ هذا التقرير | — |

## آخر خطوة قبل التشغيل
ضع قيمة `SUPABASE_URL` و`SUPABASE_ANON_KEY` في `js/supabase.js` (من Supabase → Project Settings → API)، ثم ارفع الموقع كالمعتاد على Netlify. كود عرض الصورة (القسم 5) يُضاف في مشروع الداشبورد المنفصل.