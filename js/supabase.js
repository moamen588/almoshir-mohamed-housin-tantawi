// ======================================================
// Supabase Storage - رفع الصورة الشخصية للطالب
// Bucket: student-photos (تم تجهيزه بالفعل)
// ======================================================
// ⚠️ استبدل القيمتين التاليتين من مشروع Supabase:
// Project URL + Anon Public Key → إعدادات Supabase (Settings > API)

window.SUPABASE_URL = 'https://vhkwwdogpnqgldphkyii.supabase.co/rest/v1/';
window.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoa3d3ZG9ncG5xZ2xkcGhreWlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxMDAyMzUsImV4cCI6MjEwNTY3NjIzNX0.BHdW71GOOs58qXNHBmuO3NOj6DzJPssFXAf2Q4xmFJA';

let supabaseClient = null;

function getSupabaseClient() {
    if (supabaseClient) return supabaseClient;
    if (!window.supabase) {
        console.error('❌ Supabase SDK غير محمّل');
        return null;
    }
    supabaseClient = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
    return supabaseClient;
}

/**
 * رفع صورة الطالب إلى Supabase Storage واستخراج الرابط العام
 * @param {File} file - ملف الصورة المختار من input[type=file]
 * @param {string} phone - رقم واتساب الطالب (يستخدم لتسمية المسار)
 * @returns {Promise<string>} - رابط الصورة العام أو '' عند الفشل
 */
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
            .upload(filePath, file, {
                upsert: true,
                contentType: file.type || 'image/jpeg'
            });

        if (error) throw error;

        const { data: publicData } = sb.storage
            .from('student-photos')
            .getPublicUrl(filePath);

        return publicData.publicUrl;
    } catch (err) {
        console.error('❌ خطأ في رفع الصورة لـ Supabase:', err);
        return '';
    }
};