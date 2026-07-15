# Product Requirements Document (PRD)

## Al-Moshir Mohamed Hussein Tantawi School - Official Website

---

## 1. Executive Summary

### 1.1 Project Overview

| Attribute | Value |
|-----------|-------|
| **Project Name** | Al-Moshir Mohamed Hussein Tantawi School - Student & Exam Management System |
| **Version** | v14 |
| **Release Date** | 2026/05/12 |
| **Platform** | Web Application (PWA - Progressive Web App) |

### 1.2 Project Description

A comprehensive website aimed at facilitating communication between the school and students, providing all information related to exams, subject schedules, and contact details for teachers and administration. The website functions as a PWA and can be installed on mobile devices to work as a standalone application.

### 1.3 Target Audience

- First-year secondary school students (General and Services systems)
- Parents and guardians
- Teachers and administration staff

---

## 2. Business Objectives

| Objective | KPI |
|-----------|-----|
| Facilitate access to exam schedules | 100% student coverage |
| Provide teacher contact information | Reduce information search time |
| Protect student data | Zero security breaches |
| Increase student-school interaction | 80% of students log in |

---

## 3. Functional Requirements

### 3.1 Authentication System

#### FR-01: Login

| Element | Details |
|---------|---------|
| **Requirement** | User must log in to access content |
| **Fields** | Full name (at least 3 names), WhatsApp number (01xxxxxxxxx) |
| **Academic System** | General / Services |
| **Password** | User-defined during initial registration |
| **Verification** | Data review before final confirmation |

#### FR-02: Session Management

| Element | Details |
|---------|---------|
| **Storage** | Save user data in localStorage |
| **Duration** | Unlimited session until logout (data deletion) |

---

### 3.2 Security System

#### FR-03: Security Measures

| Action | Description |
|--------|-------------|
| **Password Encryption** | SHA-256 |
| **IP Logging** | Store user IP on each login |
| **Device Fingerprint** | FingerprintJS to collect unique device identifier |
| **Auto-Ban System** | Automatic ban after 3 failed password attempts |
| **Geolocation** | Record city, region, and device type |

#### FR-04: Forbidden Words

List of words automatically filtered:
- Arabic offensive words
- English offensive words (fuck, shit, bitch, bastard, etc.)

---

### 3.3 Exam Schedules Display

#### FR-05: Exam Schedules - Non-Core Subjects

| Subject | Date | Time | Duration |
|---------|------|------|----------|
| Second Foreign Language | 11/5/2026 | 9:00 - 10:30 | 1.5 hours |
| Religious Education | 12/5/2026 | 9:00 - 10:30 | 1.5 hours |
| Programming & AI | 13/5/2026 | 9:00 - 10:00 | 1 hour |

#### FR-06: Exam Schedules - Core Subjects (Grade-Included)

| Subject | Date | Time | Duration |
|---------|------|------|----------|
| First Foreign Language | 16/5/2026 | 9:00 - 11:30 | 2.5 hours |
| History | 16/5/2026 | 12:00 - 1:30 | 1.5 hours |
| Arabic Language | 18/5/2026 | 9:00 - 12:00 | 3 hours |
| Mathematics | 20/5/2026 | 9:00 - 12:00 | 3 hours |
| Integrated Sciences | 23/5/2026 | 9:00 - 11:00 | 2 hours |
| Philosophy & Logic | 23/5/2026 | 11:30 - 1:00 | 1.5 hours |

#### FR-07: April Monthly Exams

| Date | Subjects |
|------|----------|
| 3/5/2026 | Arabic Language – Religious Education |
| 4/5/2026 | Integrated Sciences – History – Programming |
| 5/5/2026 | First Foreign Language – Philosophy & Logic |
| 6/5/2026 | Mathematics – Second Foreign Language |

#### FR-08: QUREO Practical Programming Exam

| Date | Governorates |
|------|--------------|
| 11/5/2026 | Alexandria, Gharbia, Sohag, Qena, Fayoum, North Sinai, Minya, Kafr El-Sheikh, Damietta |
| 12/5/2026 | Giza, Sharqia, Dakahlia, Assiut, South Sinai, Beni Suef, Luxor, Matrouh, Port Said |
| 13/5/2026 | Cairo, Qalyubia, Beheira, Menoufia, Ismailia, Aswan, Red Sea, New Valley, Suez |

---

### 3.4 Teacher Contact Information

#### FR-09: Display Teacher Information

| Subject | Teachers |
|---------|----------|
| Arabic Language | Ms. Reem (01024676283), Mr. Hassan Ibrahim (01030135410), Mr. Mahmoud Mohamed (01093969256) |
| English Language | Mr. Alaa El-Shabrawi (01060245077) |
| French Language | Mr. Ahmed (01003397216) |
| Sciences | Ms. Mouna El-Ashry (01055972683), Mr. Ahmed Magdy (01121237654), Mr. Tamer Salah (01223808342) |
| History | Mr. Salah (01278704646), Mr. Mohamed Ghanem (01063697156) |
| Philosophy & Logic | Ms. Merwat (01064206096) |
| Mathematics | Mr. Mohamed El-Gamal (01284504849), Ms. Norhan (01070985751) |
| Programming | Ms. Heba (01111302462) |
| Administration | Ms. Heba, Ms. Marwa Salem (01003914796), Mr. Sayed - Principal (01015006622) |

#### FR-10: Phone Number Functions

| Function | Description |
|----------|-------------|
| **Copy Number** | 📋 button to copy number to clipboard |
| **Open WhatsApp** | Direct link to start WhatsApp chat with teacher |

---

### 3.5 Developer Section

#### FR-11: Developer Information

| Field | Value |
|-------|-------|
| **Name** | Moamen Magdy |
| **Role** | Front-End Developer - First Year Secondary Student (Services System) |
| **WhatsApp** | +20 1224736512 |
| **Instagram** | moomenmagdy588 |
| **Portfolio** | https://moamenprofile-tarsier-ea88a.netlify.app/ |

---

### 3.6 Certificate System

#### FR-12: Certificate Generation

| Feature | Description |
|---------|-------------|
| **Trigger** | Click "Download Certificate" button |
| **PDF Generation** | Dynamic PDF creation with student information |
| **Types** | 3 certificate designs (Developer, Special Student, Normal Student) |
| **Database Storage** | Certificate data stored in Firestore with logs |

#### FR-13: Certificate Types

| Type | Criteria | Design Features |
|------|----------|-----------------|
| **Developer Certificate** | Name contains "Moamen" + "Magdy" + "Abdelwadood" | Dark theme, gradient borders, code brackets |
| **Special Student Certificate** | Name contains "Lamis" + "Mohamed" | Sparkle animations, crown icon, pink gradient |
| **Normal Certificate** | All other students | Professional blue design, classic borders |

---

### 3.7 Student Testimonials System

#### FR-14: View Testimonials

| Feature | Description |
|---------|-------------|
| **Random Display** | Shows random approved testimonial |
| **Refresh Button** | 🔄 button to load different testimonial |
| **Animation** | Smooth fade transition on refresh |

#### FR-15: Submit Testimonial

| Field | Requirement |
|-------|-------------|
| **Text Input** | 5-200 characters |
| **Filtering** | Forbidden words automatically rejected |
| **Status** | Submitted as "pending" - requires admin approval |
| **User Requirement** | Must be logged in |

---

### 3.8 Countdown Timer

#### FR-16: Exam Countdown

| Feature | Description |
|---------|-------------|
| **Target Exam** | QUREO Exam - Wednesday 13/5/2026 - 9:00 AM |
| **Display** | Days, Hours, Minutes, Seconds |
| **Update Frequency** | Real-time (every second) |
| **Visual Indication** | Seconds turn red when ≤ 10 remaining |

---

### 3.9 Social & Communication Features

#### FR-17: Communication Groups

| Group | Link |
|-------|------|
| First Year Services WhatsApp Group | https://chat.whatsapp.com/Ft8T7tNR7NT05eUziLrgLi |
| School Facebook Group | https://www.facebook.com/share/g/1JjobkbtBc/ |

#### FR-18: External Links

| Resource | URL |
|----------|-----|
| Digital Library | https://ellibrary.moe.gov.eg/cha/ |
| Weekly Assessments | https://ellibrary.moe.gov.eg/cha/ |
| QUREO Platform | https://sprixportal.jp/ |
| Ministry of Education | https://moe.gov.eg |

---

### 3.10 PWA Features

#### FR-19: Progressive Web App

| Feature | Description |
|---------|-------------|
| **Installation** | 📲 Install button with beforeinstallprompt event |
| **Offline Support** | Service Worker caches essential files |
| **Home Screen Icon** | Custom icons (192px, 512px) |
| **Theme Color** | #2c6e9b |

#### FR-20: Service Worker

| Configuration | Value |
|---------------|-------|
| **Cache Name** | school-cache-v19 |
| **Cached Files** | HTML, CSS, JS, Images (simg.jpg, dev-img.jpg, icons) |
| **Strategy** | Cache-first then network |

---

### 3.11 UI/UX Features

#### FR-21: Dark Mode

| Feature | Description |
|---------|-------------|
| **Toggle Button** | 🌙 / ☀️ button in header |
| **Persistence** | Saved to localStorage |
| **CSS Variables** | Dynamic theme switching |

#### FR-22: Responsive Design

| Breakpoint | Layout Changes |
|------------|----------------|
| Desktop (>700px) | Full table display, multi-column grids |
| Mobile (≤700px) | Card-based tables, stacked layouts, reduced padding |

#### FR-23: Image Lightbox

| Feature | Description |
|---------|-------------|
| **Trigger** | Click on any exam schedule image |
| **Display** | Full-screen overlay with zoom |
| **Close** | Click outside, press ESC, or click ✕ button |
| **Caption** | Displays image description |

#### FR-24: Back to Top Button

| Feature | Description |
|---------|-------------|
| **Appearance** | Appears after scrolling 300px |
| **Design** | Liquid glass effect with floating animation |
| **Click** | Smooth scroll to top |

---

### 3.12 Analytics & Tracking

#### FR-25: Visitor Counter

| Feature | Description |
|---------|-------------|
| **Data Source** | Firestore "students" collection count |
| **Display** | Animated counter (easing function) |
| **Update** | Every 30 seconds |

#### FR-26: Button Click Tracking

| Tracked Buttons | Destination |
|----------------|-------------|
| WhatsApp | Developer WhatsApp |
| Instagram | Developer Instagram |
| Portfolio | Developer portfolio |
| Developer Section | Scroll to footer |

#### FR-27: Footer Statistics

| Statistic | Data Source |
|-----------|-------------|
| Total Students | Firestore students count |
| Exam Schedules | 3 tables |
| Teachers | 17 teachers |

---

### 3.13 Random Tips System

#### FR-28: Motivational Tips

| Feature | Description |
|---------|-------------|
| **Tip Pool** | 11 predefined study tips |
| **Refresh** | Manual 🔄 button or auto every 30 seconds |
| **Animation** | Fade transition on tip change |

---

## 4. Non-Functional Requirements

### 4.1 Performance Requirements

| Requirement | Target |
|-------------|--------|
| Page Load Time | < 3 seconds on 3G |
| Time to Interactive | < 4 seconds |
| Lighthouse Score | > 90 (Performance, Accessibility, SEO) |
| Firebase Response Time | < 500ms |

### 4.2 Security Requirements

| Requirement | Implementation |
|-------------|----------------|
| Input Sanitization | escapeHtml() function for all user-generated content |
| XSS Prevention | No innerHTML with unsanitized user data |
| SQL Injection | Not applicable (Firestore NoSQL) |
| Rate Limiting | Ban system prevents brute force |
| Data Encryption | SHA-256 for passwords |

### 4.3 Availability Requirements

| Requirement | Target |
|-------------|--------|
| Uptime | 99.9% (Netlify hosting) |
| Offline Mode | Core functionality via Service Worker |
| CDN | Netlify global CDN |

### 4.4 Compatibility Requirements

| Browser | Minimum Version |
|---------|-----------------|
| Chrome | 90+ |
| Firefox | 88+ |
| Safari | 14+ |
| Edge | 90+ |
| Samsung Internet | 15+ |

### 4.5 Accessibility Requirements

| Requirement | Implementation |
|-------------|----------------|
| ARIA Labels | aria-modal, aria-labelledby on modals |
| RTL Support | dir="rtl" throughout |
| Keyboard Navigation | ESC to close modals/lightbox |
| Color Contrast | Meets WCAG 2.1 AA |

---

## 5. Database Schema (Firestore)

### 5.1 Collections

#### students

| Field | Type | Description |
|-------|------|-------------|
| name | string | Student full name |
| phone | string | WhatsApp number (unique identifier) |
| system | string | "عام" or "خدمات" |
| password | string | User-defined password |
| ip | string | Last login IP address |
| fingerprint | string | Device fingerprint |
| visitCount | number | Number of logins |
| city | string | User's city from GeoIP |
| region | string | User's region |
| device | string | Device type (Android/iOS/Desktop) |
| lastLogin | timestamp | Last login timestamp |
| createdAt | timestamp | Account creation timestamp |

#### testimonials

| Field | Type | Description |
|-------|------|-------------|
| message | string | Testimonial text (5-200 chars) |
| studentName | string | Name of submitting student |
| studentPhone | string | Phone of submitting student |
| studentSystem | string | Academic system |
| status | string | "pending" or "approved" |
| createdAt | timestamp | Submission timestamp |

#### certificates

| Field | Type | Description |
|-------|------|-------------|
| studentName | string | Certificate recipient name |
| studentPhone | string | Recipient phone number |
| studentSystem | string | Academic system |
| isSpecial | boolean | Special student flag |
| isDeveloper | boolean | Developer flag |
| status | string | "active" or "downloaded" |
| createdAt | timestamp | Creation timestamp |

#### banned_ips

| Field | Type | Description |
|-------|------|-------------|
| ip | string | Banned IP address |
| fingerprint | string | Device fingerprint |
| phone | string | Associated phone number |
| reason | string | Ban reason |
| bannedAt | timestamp | Ban timestamp |

#### banned_fingerprints

| Field | Type | Description |
|-------|------|-------------|
| fingerprint | string | Banned device fingerprint |
| ip | string | Associated IP |
| phone | string | Associated phone |
| reason | string | Ban reason |
| bannedAt | timestamp | Ban timestamp |

#### button_clicks

| Field | Type | Description |
|-------|------|-------------|
| button | string | Button type clicked |
| studentName | string | Name of student who clicked |
| studentPhone | string | Phone of student who clicked |
| studentSystem | string | Academic system |
| timestamp | timestamp | Click timestamp |

#### certificate_logs

| Field | Type | Description |
|-------|------|-------------|
| studentName | string | Student name |
| studentPhone | string | Student phone |
| certificateId | string | Certificate document ID |
| action | string | "requested", "downloaded", or "opened" |
| timestamp | timestamp | Action timestamp |

---

## 6. API Integrations

### 6.1 External Services

| Service | Purpose | Endpoint |
|---------|---------|----------|
| Firebase Firestore | Database | Google Cloud |
| ipify.org | Get user IP | https://api.ipify.org?format=json |
| ipapi.co | GeoIP lookup | https://ipapi.co/${IP}/json/ |
| FingerprintJS | Device fingerprinting | CDN: cdn.jsdelivr.net |
| QRCode.js | QR code generation | CDN: cdn.jsdelivr.net/npm/qrcodejs |

### 6.2 Firebase Configuration

```javascript
{
  apiKey: "AIzaSyD5XBu9sPpFgx2rIpx6weEcZs4BAtj1CpE",
  authDomain: "my-school-1-4455e.firebaseapp.com",
  databaseURL: "https://my-school-1-4455e-default-rtdb.firebaseio.com",
  projectId: "my-school-1-4455e",
  storageBucket: "my-school-1-4455e.firebasestorage.app",
  messagingSenderId: "515603435925",
  appId: "1:515603435925:web:36599b4670b0eead5d669c"
}
//login flow
┌─────────────────┐
│   Open Website  │
└────────┬────────┘
         ▼
┌─────────────────┐
│  Login Modal    │
│ - Enter Name    │
│ - Enter Phone   │
│ - Select System │
└────────┬────────┘
         ▼
    ┌────┴────┐
    │ Existing│
    │  User?  │
    └────┬────┘
     Yes│    │No
         ▼    ▼
┌─────────┐ ┌─────────────┐
│Password │ │Confirmation │
│ Prompt  │ │   Modal     │
└────┬────┘ └──────┬──────┘
     ▼             ▼
┌─────────┐ ┌─────────────┐
│Verify PW│ │Set Password │
└────┬────┘ └──────┬──────┘
     ▼             ▼
     └──────┬──────┘
            ▼
┌─────────────────┐
│   Main App      │
│ - Exam Tables   │
│ - Teacher Info  │
│ - Certificates  │
└─────────────────┘
7.2 Certificate Generation Flow
┌─────────────────┐
│  User Logged In │
└────────┬────────┘
         ▼
┌─────────────────┐
│ Click Download  │
│ Certificate Btn │
└────────┬────────┘
         ▼
    ┌────┴────┐
    │Exists in│
    │Firestore│
    └────┬────┘
     Yes│    │No
         ▼    ▼
┌─────────┐ ┌─────────────┐
│Retrieve │ │Create New   │
│Existing │ │Certificate  │
└────┬────┘ └──────┬──────┘
     └──────┬──────┘
            ▼
    ┌───────┴───────┐
    │Determine Type │
    └───────┬───────┘
            ▼
    ┌───────┴───────┐
    │Generate PDF   │
    │Open in New Tab│
    └───────────────┘
8. File Structure
project-root/
├── index.html              # Main application file
├── style.css               # Global styles + dark mode
├── script.js               # All JavaScript logic
├── manifest.json           # PWA configuration
├── sw.js                   # Service Worker
├── netlify.toml            # Netlify deployment config
├── simg.jpg                # School logo
├── finalGadwal.jpeg        # Core subjects exam schedule image
├── finalGadwal1.jpeg       # Non-core subjects exam schedule image
├── finalGadwal2.jpeg       # Alternative schedule
├── gadwal-april.jpeg       # April exams schedule image
├── gadwal-q.jpeg           # QUREO exam schedule image
├── QUERO_mascot.png        # QUREO mascot image
├── ta3lem.jpg              # Ministry of Education logo
├── dev-img.jpg             # Developer profile image
├── icon-192.png            # PWA icon (192px)
└── icon-512.png            # PWA icon (512px)

9. Deployment Requirements
9.1 Hosting
Attribute	Value
Platform	Netlify
Build Command	None (static site)
Publish Directory	root (.)
9.2 Netlify Headers Configuration
[[headers]]
  for = "/sw.js"
  [headers.values]
    Cache-Control = "no-cache, no-store, must-revalidate"

[[headers]]
  for = "/*"
  [headers.values]
    Cache-Control = "no-cache, no-store, must-revalidate"
9.3 Environment Variables
Variable	Value
Firebase Config	Embedded in script.js
No additional env vars required	-


10. Testing Requirements
10.1 Test Cases

Test ID	Feature	Expected Result
TC-01	Login with new user	Shows confirmation modal
TC-02	Login with existing user	Asks for password
TC-03	Wrong password 3 times	Auto-ban triggered
TC-04	Forbidden word in name	Auto-ban triggered
TC-05	Download certificate	PDF opens in new tab
TC-06	Dark mode toggle	Theme changes, persists
TC-07	Copy phone number	Shows toast notification
TC-08	Submit testimonial	Shows success message
TC-09	Click exam image	Lightbox opens
TC-10	PWA install	Install prompt appears
TC-11	Countdown timer	Updates every second
TC-12	Refresh testimonial	New testimonial appears
TC-13	System selection (General/Services)	Active state changes
TC-14	Forgot password	Opens WhatsApp to developer
TC-15	Share site button	Copies URL to clipboard

11. Assumptions & Constraints
11.1 Assumptions
Users have internet connectivity for initial load

Users have WhatsApp installed for teacher contact links

Firebase services remain available

External APIs (ipify, ipapi) remain accessible

Users understand Arabic language

11.2 Constraints
No backend admin panel (all testimonials require manual approval in Firestore)

No email notification system

No automated SMS functionality

Limited to first-year secondary students only

Certificate generation requires new browser tab

12. Future Enhancements (Roadmap)
Version	Feature	Priority
v15	Admin dashboard for testimonial approval	High
v16	Push notifications for exam reminders	Medium
v17	Student grade tracking system	Medium
v18	Online quiz system	Low
v19	Parent account linking	Low
v20	AI chatbot for student support	Low
13. Success Metrics
Metric	Target	Measurement Method
Daily Active Users	200+	Firestore login logs
Testimonials Submitted	50+	Firestore testimonials count
Certificates Downloaded	100+	Certificate logs
Button Clicks	500+	Button clicks collection
PWA Installations	50+	beforeinstallprompt tracking
Page Load Speed	< 3 sec	Lighthouse / Web Vitals
14. Approval & Sign-off
Role	Name	Date	Signature
Project Owner	Moamen Magdy	2026/05/24	✓
School Principal	Mr. Sayed	Pending	_____
QA Lead	Pending	Pending	_____
Appendix A: Color Palette
Usage	Light Mode	Dark Mode
Primary	#2c6e9b	#4a90c4
Primary Dark	#1f4f6e	#357ABD
Background	#e9e9e9 → #ffffff	#0f172a → #1a1f2e
Card Background	#ffffff	#1e293b
Text Primary	#1e293b	#e2e8f0
Text Muted	#64748b	#94a3b8
Success	#10b981	#34d399
Warning	#f59e0b	#fbbf24
Error	#dc2626	#f87171
Appendix B: Exam Dates Summary
Date	Exams
11/5/2026	Second Foreign Language, QUREO (Group 1)
12/5/2026	Religious Education, QUREO (Group 2)
13/5/2026	Programming & AI, QUREO (Group 3)
16/5/2026	First Foreign Language, History
18/5/2026	Arabic Language
20/5/2026	Mathematics
23/5/2026	Integrated Sciences, Philosophy & Logic
Appendix C: Motivational Tips
"If studying feels heavy... break it down into small steps"

"Start even if you're not in the mood"

"Review the lesson shortly after understanding it"

"Ask if you don't understand... asking isn't weakness"

"Studying isn't a race, everyone has their own pace"

"Always remember that exams test understanding, not memorization"

"A short break while studying can increase your focus"

"Try to connect information with simple things to remember them"

"Tip: Study regularly so you don't get overwhelmed"

"Information you understand quickly often sticks faster"

"You don't need to study for hours... the important thing is to study with focus"

Appendix D: Developer Credentials
Role	Name	Contact
Developer	Moamen Magdy	moamenmagdy588 (Instagram)
Support	WhatsApp	+20 1224736512
Portfolio	Link	https://moamenprofile-tarsier-ea88a.netlify.app/
Document Version: 1.0

Last Updated: 2026/05/24

Status: ✅ Active - In Production

Author: Moamen Magdy

Project URL: https://almoshir-mohamedhesin-altntawi.netlify.app/

Repository: Private

