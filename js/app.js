document.addEventListener('DOMContentLoaded', async () => {
  try {
    const container = document.getElementById('teachersContainer');
    if (!container) return;

    let data;
    try {
      const response = await fetch('./data/teachers.json');
      if (!response.ok) throw new Error('Network response was not ok');
      data = await response.json();
    } catch (error) {
      console.warn('Using fallback teacher data', error);
      data = {
        subjects: [
          {
            title: 'الإدارة',
            badgeClass: 'admin-badge',
            teachers: [
              { name: 'أ/ محمد عبد الرحمن - مدير المدرسة', phone: '1001234567' },
              { name: 'أ/ سارة علي - وكيل المدرسة', phone: '1012345678' }
            ]
          }
        ]
      };
    }

    container.innerHTML = (data.subjects || []).map(subject => `
      <div class="card teacher-card">
        <span class="subject-badge ${subject.badgeClass || ''}">${subject.title || 'قسم'}</span>
        ${(subject.teachers || []).map(teacher => `
          <div class="teacher-contact">
            <p>${teacher.name || 'غير متوفر'}</p>
            <div class="phone-row">
              <a href="https://wa.me/20${teacher.phone || ''}" class="whatsapp-link" target="_blank" rel="noopener">${teacher.phone || '—'}</a>
              <button class="copy-btn" onclick="window.copyPhone('${teacher.phone || ''}')" title="نسخ الرقم">📋</button>
            </div>
          </div>
        `).join('')}
      </div>
    `).join('');
  } catch (error) {
    console.error('Failed to load teachers data', error);
  }
});
