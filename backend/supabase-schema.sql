-- ==============================================================================
-- AuraClass | Supabase PostgreSQL Schema & Initial Setup
-- 
-- Instructions:
-- 1. Log in to your Supabase Dashboard: https://supabase.com/dashboard
-- 2. Select your Project (or create a new one).
-- 3. Click on the "SQL Editor" tab in the left sidebar.
-- 4. Paste this entire script into a new query and click "Run".
-- ==============================================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. Profiles Table (Lecturers & Students)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT CHECK (role IN ('lecturer', 'student')) NOT NULL,
  department TEXT NOT NULL,
  admission_year TEXT,                       -- Student set (e.g., '2024/2025', '2026/2027')
  matric_number TEXT UNIQUE,                 -- Student Matric No (e.g. '2024/1/89402CE')
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 2. Assignments Table
-- ==============================================================================
CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lecturer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  lecturer_name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  department TEXT NOT NULL,
  academic_year TEXT NOT NULL,               -- Target cohort set (e.g., '2024/2025', '2026/2027')
  due_date TIMESTAMPTZ NOT NULL,
  attachment_url TEXT,                       -- URL of attached assignment document (<=10MB)
  attachment_name TEXT,                      -- Original filename of attached document
  attachment_size TEXT,                      -- Human-readable size (e.g. '2.4 MB')
  is_grades_finalized BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 3. Student Assignments Table (Submissions, Telemetry, Grading)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS student_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'completed')) DEFAULT 'pending' NOT NULL,
  submission_content TEXT,                   -- Written paper content
  attachment_url TEXT,                       -- URL of student submitted document (<=10MB)
  attachment_name TEXT,                      -- Original filename of student document
  attachment_size TEXT,                      -- Human-readable size (e.g. '1.8 MB')
  telemetry JSONB,                           -- Keystroke timeline, typing pace, paste events
  grade TEXT,                                -- Assigned grade (e.g. 'A', '95/100')
  feedback TEXT,                             -- Lecturer remarks & evaluation
  is_graded BOOLEAN DEFAULT FALSE NOT NULL,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, assignment_id)
);

-- ==============================================================================
-- 4. Password Reset Tokens Table
-- ==============================================================================
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 5. Performance Indexes
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_matric ON profiles(matric_number);
CREATE INDEX IF NOT EXISTS idx_profiles_cohort ON profiles(role, department, admission_year);

CREATE INDEX IF NOT EXISTS idx_assignments_lecturer ON assignments(lecturer_id);
CREATE INDEX IF NOT EXISTS idx_assignments_cohort ON assignments(department, academic_year);

CREATE INDEX IF NOT EXISTS idx_student_assignments_student ON student_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_student_assignments_assignment ON student_assignments(assignment_id);
CREATE INDEX IF NOT EXISTS idx_student_assignments_lookup ON student_assignments(student_id, assignment_id);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);

-- ==============================================================================
-- 6. Row Level Security (RLS) & Policies
-- ==============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- API access policies (enables full CRUD operations for application API)
CREATE POLICY "Allow API access to profiles" ON profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow API access to assignments" ON assignments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow API access to student_assignments" ON student_assignments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow API access to password_reset_tokens" ON password_reset_tokens FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- 7. Pre-Seeded Demo Accounts (Password for both: studentpass123)
-- ==============================================================================

-- 1. Lecturer Account: Dr. Jane Vance
INSERT INTO profiles (email, password, name, role, department)
VALUES (
  'jane.vance@school.edu',
  '$2a$10$wE9K2sT6h6hR6o3kK8Z.2.eO2qPzV8K3fIqT8a6bN0kE4p1zX1lOa', -- bcrypt hash for 'studentpass123'
  'Dr. Jane Vance',
  'lecturer',
  'Computer Engineering'
) ON CONFLICT (email) DO NOTHING;

-- 2. Student Account: Grace Umar (Matric No: 2024/1/89402CE)
INSERT INTO profiles (email, password, name, role, department, admission_year, matric_number)
VALUES (
  'grace.umar@school.edu',
  '$2a$10$wE9K2sT6h6hR6o3kK8Z.2.eO2qPzV8K3fIqT8a6bN0kE4p1zX1lOa', -- bcrypt hash for 'studentpass123'
  'Grace Umar',
  'student',
  'Computer Engineering',
  '2024/2025',
  '2024/1/89402CE'
) ON CONFLICT (email) DO NOTHING;
