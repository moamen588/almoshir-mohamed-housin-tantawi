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

  try {
    const attendanceContainer = document.getElementById('attendanceContainer');
    if (!attendanceContainer) return;

    let data;
    try {
      const response = await fetch('./data/attendance-dates.json');
      if (!response.ok) throw new Error('Network response was not ok');
      data = await response.json();
    } catch (error) {
      console.warn('Using fallback attendance data', error);
      data = {
        stages: [
          { name: 'المرحلة الابتدائية', grade: 'من أولى إلى سادسة ابتدائي', date: '2026-09-13', day: 'الإثنين', time: '8:00 صباحاً', note: 'حضر بزي مدرسي كامل' },
          { name: 'المرحلة الإعدادية', grade: 'من أولى إلى ثالثة إعدادي', date: '2026-09-13', day: 'الإثنين', time: '9:00 صباحاً', note: 'حضر بزي مدرسي كامل' },
          { name: 'المرحلة الثانوية', grade: 'من أولى إلى ثالثة ثانوي', date: '2026-09-14', day: 'الثلاثاء', time: '9:00 صباحاً', note: 'حضر بزي مدرسي كامل' }
        ]
      };
    }

    const icons = ['🏫', '📚', '🎓'];
    const badgeClasses = ['primary-stage', 'prep-stage', 'secondary-stage'];

    attendanceContainer.innerHTML = (data.stages || []).map((stage, i) => `
      <div class="card attendance-card">
        <div class="attendance-icon">${icons[i] || '📅'}</div>
        <span class="attendance-badge ${badgeClasses[i] || ''}">${stage.name || ''}</span>
        <div class="attendance-details">
          <p><strong>الصفوف:</strong> ${stage.grade || ''}</p>
          <p><strong>التاريخ:</strong> ${stage.day || ''} ${stage.date || ''}</p>
          <p><strong>الوقت:</strong> ${stage.time || ''}</p>
          <p class="attendance-note">${stage.note || ''}</p>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Failed to load attendance data', error);
  }

  try {
    const examContainer = document.getElementById('allExamDetails');
    if (!examContainer) return;

    let data;
    try {
      const response = await fetch('./data/exams.json');
      if (!response.ok) throw new Error('Network response was not ok');
      data = await response.json();
    } catch (error) {
      console.warn('Using fallback exam data', error);
      data = { sections: [] };
    }

    let html = '';

    (data.sections || []).forEach(section => {
      if (section.type === 'table') {
        html += `<div class="card">`;
        if (section.heading) html += `<h3>${section.heading}</h3>`;
        html += `<table class="exam-table responsive-table">`;
        html += `<thead><tr>${(section.columns || []).map(c => `<th>${c}</th>`).join('')}</tr></thead>`;
        html += `<tbody>`;
        (section.rows || []).forEach(row => {
          html += `<tr>`;
          html += `<td data-label="اليوم"><strong>${row.day || ''}</strong></td>`;
          html += `<td data-label="المادة">${row.subject || ''}</td>`;
          if (row.time) html += `<td data-label="الوقت">${row.time}</td>`;
          if (row.duration) html += `<td data-label="المدة">${row.duration}</td>`;
          const statusStyle = row.done
            ? 'background: #dcfce7; color: #15803d; font-weight: 600; border-radius: 8px;'
            : 'background: #fef9c3; color: #a16207; font-weight: 600; border-radius: 8px;';
          const statusIcon = row.done ? '✅' : '⏳';
          html += `<td data-label="الحالة" style="${statusStyle}">${statusIcon} ${row.status || ''}</td>`;
          html += `</tr>`;
        });
        html += `</tbody></table>`;
        if (section.note) {
          html += `<p style="color:#64748b;font-size:0.8rem;margin-top:0.5rem;">${section.note}</p>`;
        }
        html += `</div>`;
      } else if (section.type === 'images') {
        html += `<div class="exam-images">`;
        (section.items || []).forEach(img => {
          html += `<img src="${img.src}" alt="${img.alt || ''}" class="exam-img" onclick="openLightbox(this.src, '${(img.caption || '').replace(/'/g, "\\'")}')" title="اضغط للتكبير">`;
        });
        html += `</div>`;
      } else if (section.type === 'section-title') {
        html += `<section class="section-title">${section.text || ''}</section>`;
      }
    });

    examContainer.innerHTML = html;
  } catch (error) {
    console.error('Failed to load exams data', error);
  }
});
