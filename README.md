# 🌐 InternTrack — Enterprise Internship Management System

![Project Banner](file:///C:/Users/sripa/.gemini/antigravity/brain/90b40c0c-c87d-4d43-aea9-ff536143f07b/interntrack_command_center_mockup_1778074842513.png)

[![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.io/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

---

## 📖 Overview

**InternTrack** is a state-of-the-art platform designed to streamline the internship application process for students while providing administrators with a powerful "Command Center" for oversight, analytics, and security compliance. 

Built with an **Apple-inspired minimalist aesthetic**, it focuses on speed, security, and a premium user experience.

---

## ✨ Key Features

### 🎓 For Students
- **Smart Dashboard**: Real-time stats on your application pipeline and success rates.
- **Application Tracking**: Manage job details, interview rounds, and recruiter contacts.
- **Visual Calendar**: Never miss a deadline or interview with our integrated event view.
- **Document Vault**: Securely store and manage resumes, cover letters, and transcripts.
- **Glassmorphism UI**: A beautiful, fluid interface powered by Framer Motion.

### 🛡️ For Administrators (The Command Center)
- **Global Analytics**: High-level metrics on total students, active offers, and system health.
- **User Registry**: Complete student roster with deep-dive identity and activity monitoring.
- **Security & Compliance**: Real-time audit of Row-Level Security (RLS) and data encryption.
- **System Console**: Admin delegation and database maintenance tools.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite 7, TypeScript, Tailwind CSS.
- **UI Components**: Shadcn/UI, Radix UI, Lucide Icons.
- **Animations**: Framer Motion 12.
- **Data Visualization**: Recharts.
- **Backend/DB**: Supabase (PostgreSQL), Auth, Storage.
- **Emailing**: EmailJS Integration.

---

## ⚙️ Setup & Installation

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd Internship/app
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the `app` directory and add your credentials:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_EMAILJS_SERVICE_ID=your_emailjs_service_id
VITE_EMAILJS_TEMPLATE_ID=your_template_id
VITE_EMAILJS_PUBLIC_KEY=your_public_key
```

### 4. Run the Application
```bash
npm run dev
```

---

## 🔒 Security Architecture

InternTrack implements **Enterprise-Grade Security**:
- **Row-Level Security (RLS)**: Data is protected at the database level; users can only access their own records.
- **JWT Authentication**: Secure, stateless session management via Supabase Auth.
- **SQL Triggers**: Automated profile creation and data synchronization.

---

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📄 License
This project is licensed under the MIT License.

---

> Built with ❤️ by the InternTrack Team.
