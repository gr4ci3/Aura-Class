# AuraClass | Academic Assignment Portal & Distribution System

AuraClass is a modern, high-fidelity school assignment portal designed to bridge lecturers and students. Lecturers can create and target assignments to specific departments and cohort sets, and students in those cohorts automatically receive the assignments in their inboxes. Students are also notified instantly via email.

---

## 🌟 Key Features

1. **Dual Role Architecture**: Dedicated dashboards, views, and access controls for **Lecturers** and **Students**.
2. **Targeted Distribution**: Assignments are dynamically mapped to students based on **Department** and **Admission Cohort Set** (e.g. Computer Science, 2024/2025 Set).
3. **Email Notification Service**: Instant email notifications sent to students using `nodemailer`. Features **zero-setup out-of-the-box testing** via `ethereal.email` (automatically creates a temp SMTP mail account and logs a click-to-view email link in the server terminal!).
4. **Analytics Progress Indicators**: Lecturers can monitor real-time cohort statistics (how many students have marked the assignment as completed vs pending).
5. **Local Data Persistence**: Simple, zero-config file-based storage database (`database.json`) by default.
6. **BaaS/Supabase Integration Ready**: Includes detailed schemas and documentation to easily connect the portal to a free PostgreSQL database on Supabase.

---

## 🏗️ Architecture

```
assignment-portal/
├── backend/                  # Express REST API & Mail Service
│   ├── routes/
│   │   ├── auth.js           # Signup, Login, JWT verification
│   │   └── assignments.js    # Assignment CRUD & cohort filters
│   ├── services/
│   │   └── email.js          # Nodemailer SMTP transporter
│   ├── database.js           # Local DB manager (JSON read/write)
│   ├── server.js             # Express entry point
│   ├── verify-backend.js     # Programmatic test validation script
│   └── package.json
└── frontend/                 # React SPA (Vite + Vanilla CSS)
    ├── src/
    │   ├── context/
    │   │   └── AuthContext.jsx # Shared auth session context
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── LecturerDashboard.jsx
    │   │   ├── StudentDashboard.jsx
    │   │   ├── Auth.css
    │   │   └── Dashboard.css
    │   ├── App.jsx           # Main routing & guards
    │   ├── index.css         # AuraClass Design system styles
    │   └── main.jsx
    ├── index.html
    └── package.json
```

---

## 🚀 Quick Start (Running Locally)

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed (v16.0.0 or higher recommended).

### 1. Setup the Backend
1. Open a terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install the backend dependencies:
   ```bash
   npm install
   ```
3. Run the programmatic validation script to test that all database relationships, hashing, mapping, and filters are working:
   ```bash
   node verify-backend.js
   ```
4. Start the Express API server:
   ```bash
   npm run dev
   ```
   *The server runs on `http://localhost:5000`.*

### 2. Setup the Frontend
1. Open a **new** terminal window and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install the frontend dependencies:
   ```bash
   npm install
   ```
3. Start the Vite React development server:
   ```bash
   npm run dev
   ```
   *Open `http://localhost:5173` in your browser to view the application.*

---

## 📧 Testing Email Notifications
AuraClass is pre-configured to automatically generate a free test SMTP account via **Ethereal.email** if no custom credentials are found in the backend `.env` file.

1. Create a student account with **Department**: `Computer Science` and **Cohort**: `2024/2025 Set`.
2. Create a lecturer account with **Department**: `Computer Science`.
3. Log in as the lecturer, compose an assignment, and post it to `Computer Science` & `2024/2025 Set`.
4. In the **backend console terminal**, you will see a link like:
   `🔗 Preview Sent Email: https://ethereal.email/message/ws12...`
5. Click the link in your terminal to see the actual HTML/CSS styled email that would be received by the students!

---

## ⚡ Optional: Connect to Supabase (BaaS)

To run the application with a cloud database, follow these steps to connect the portal to a free **Supabase** instance.

### 1. Create a Supabase Project
1. Log in to the [Supabase Console](https://supabase.com/).
2. Click **New Project** and choose a name (e.g. `auraclass-portal`).
3. Note your database password and choose your region.

### 2. Run the SQL Schema
Navigate to the **SQL Editor** tab in your Supabase dashboard, paste the following SQL script, and click **Run**:

```sql
-- Create Profile Table for both Lecturers and Students
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT CHECK (role IN ('lecturer', 'student')) NOT NULL,
  department TEXT NOT NULL,
  admission_year TEXT, -- Only populated for students
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Assignments Table
CREATE TABLE assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lecturer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  lecturer_name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  department TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  due_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Student Assignment Mappings (Cohort Inbox Status tracking)
CREATE TABLE student_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'completed')) DEFAULT 'pending' NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, assignment_id)
);

-- Enable Row Level Security (RLS) policies if desired, or leave open for development
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_assignments ENABLE ROW LEVEL SECURITY;

-- Disable policy checks for simple prototype testing:
CREATE POLICY "Public profiles read access" ON profiles FOR SELECT USING (true);
CREATE POLICY "Public profiles write access" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Public assignments access" ON assignments FOR ALL USING (true);
CREATE POLICY "Public mappings access" ON student_assignments FOR ALL USING (true);
```

### 3. Connect the Backend
1. Install the Supabase Javascript Client in the backend:
   ```bash
   cd backend
   npm install @supabase/supabase-js
   ```
2. Update the backend `.env` variables:
   ```env
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_KEY=your-supabase-anon-key
   ```
3. Update `database.js` to query Supabase:
   Initialize the Supabase client:
   ```javascript
   const { createClient } = require('@supabase/supabase-js');
   const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
   ```
   Modify `db.createUser` and `db.createAssignment` to execute Supabase database operations instead of pushing items to local file arrays.
