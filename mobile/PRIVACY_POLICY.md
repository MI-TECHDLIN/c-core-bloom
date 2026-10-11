# Privacy Policy for C-Core-Bloom JAMB CBT Mobile App

*Last Updated: October 2026*

This Privacy Policy explains how C-Core-Bloom ("we", "our", or "the App") collects, uses, and protects candidate and administrator information when using our Android and iOS mobile applications.

---

## 1. Information We Collect

### A. Information You Provide
- **Account Credentials**: Name, email address, and authentication password used to register and sign in.
- **Examination Responses**: Selected answers, exam timestamps, score calculations, and test session history.
- **Admin Configuration**: Practice question entries, test metadata, and user role assignments.

### B. Device & Diagnostic Information
- **Hardware Profile**: Processor core count and memory tier (coarse estimation via device profile) utilized solely on-device to adjust UI rendering performance and reduce battery consumption.
- **Network Status**: Offline/online state detection used to buffer exam responses until network connectivity is restored.

---

## 2. How We Use Your Information
- To deliver real-time CBT practice exams, score computations, and historical review.
- To maintain account authentication and verify administrator access rights.
- To prevent exam session loss during network drops via local answer queuing.
- To optimize application rendering and animations for budget mobile devices.

---

## 3. Data Storage & Security
- **Encryption in Transit**: All network requests to our backend (Supabase) are encrypted using TLS 1.3/HTTPS. Cleartext traffic is disabled on the native mobile shell.
- **Role-Based Access Control**: Database tables are secured via Row Level Security (RLS) policies enforcing that candidates can only view and mutate their own test submissions.
- **Session Persistence**: Authentication tokens are stored securely in local app storage and refreshed via standard OAuth token rotation.

---

## 4. Third-Party Services
- **Supabase**: Cloud database and authentication infrastructure.
- **Google Drive API (Optional)**: If you choose to export and save your result slip to Google Drive, authentication is handled via Google OAuth and no personal credentials are stored by the App.

---

## 5. Your Rights & Account Deletion
You have the right to request deletion of your account and test history. To request deletion, candidates can contact their school/center administrator or submit an inquiry through the portal support channel.
