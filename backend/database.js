const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { supabase, isSupabaseConfigured } = require('./supabaseClient');

const DB_PATH = path.join(__dirname, process.env.DB_FILE || 'database.json');

// --- Local File Storage Handlers (Fallback Engine) ---
function initLocalDb() {
  if (!fs.existsSync(DB_PATH)) {
    const defaultData = {
      users: [],
      assignments: [],
      studentAssignments: [],
      passwordResetTokens: []
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(defaultData, null, 2), 'utf8');
  }
}

function readLocalDb() {
  initLocalDb();
  const data = fs.readFileSync(DB_PATH, 'utf8');
  return JSON.parse(data);
}

function writeLocalDb(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * UNIFIED DATABASE LAYER: SUPABASE POSTGRESQL & LOCAL STORE
 */
const db = {
  // --- User Operations ---
  async getUserByEmail(email) {
    return this.getUserByEmailOrMatric(email);
  },

  async getUserByEmailOrMatric(identifier) {
    if (!identifier) return null;
    const clean = identifier.trim().toLowerCase();

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`email.ilike.${clean},matric_number.ilike.${clean}`)
        .maybeSingle();

      if (error) throw new Error(`Supabase error: ${error.message}`);
      if (!data) return null;

      return {
        id: data.id,
        email: data.email,
        password: data.password,
        name: data.name,
        role: data.role,
        department: data.department,
        admissionYear: data.admission_year,
        matricNumber: data.matric_number,
        createdAt: data.created_at
      };
    }

    const data = readLocalDb();
    return data.users.find(u => 
      u.email.toLowerCase() === clean || 
      (u.matricNumber && u.matricNumber.toLowerCase() === clean)
    );
  },

  async getUserById(id) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw new Error(`Supabase error: ${error.message}`);
      if (!data) return null;

      return {
        id: data.id,
        email: data.email,
        password: data.password,
        name: data.name,
        role: data.role,
        department: data.department,
        admissionYear: data.admission_year,
        matricNumber: data.matric_number,
        createdAt: data.created_at
      };
    }

    const data = readLocalDb();
    return data.users.find(u => u.id === id);
  },

  async createUser(user) {
    const cleanMatric = user.matricNumber ? user.matricNumber.trim().toUpperCase() : null;

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('profiles')
        .insert([{
          email: user.email.toLowerCase(),
          password: user.password,
          name: user.name,
          role: user.role,
          department: user.department,
          admission_year: user.role === 'student' ? user.admissionYear : null,
          matric_number: user.role === 'student' ? cleanMatric : null
        }])
        .select()
        .single();

      if (error) throw new Error(`Supabase createUser error: ${error.message}`);

      return {
        id: data.id,
        email: data.email,
        password: data.password,
        name: data.name,
        role: data.role,
        department: data.department,
        admissionYear: data.admission_year,
        matricNumber: data.matric_number,
        createdAt: data.created_at
      };
    }

    const data = readLocalDb();
    const newUser = {
      id: uuidv4(),
      email: user.email.toLowerCase(),
      password: user.password,
      role: user.role,
      name: user.name,
      department: user.department,
      admissionYear: user.role === 'student' ? user.admissionYear : null,
      matricNumber: user.role === 'student' ? cleanMatric : null,
      createdAt: new Date().toISOString()
    };
    data.users.push(newUser);
    writeLocalDb(data);
    return newUser;
  },

  async getStudentsByCohort(department, admissionYear) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student')
        .ilike('department', department)
        .eq('admission_year', admissionYear);

      if (error) throw new Error(`Supabase getStudentsByCohort error: ${error.message}`);
      return (data || []).map(u => ({
        ...u,
        admissionYear: u.admission_year,
        matricNumber: u.matric_number
      }));
    }

    const data = readLocalDb();
    return data.users.filter(u => 
      u.role === 'student' && 
      u.department.toLowerCase() === department.toLowerCase() && 
      u.admissionYear === admissionYear
    );
  },

  // --- Assignment Operations ---
  async createAssignment(assignment) {
    if (isSupabaseConfigured()) {
      // 1. Insert Assignment
      const { data: newAsg, error: asgErr } = await supabase
        .from('assignments')
        .insert([{
          lecturer_id: assignment.lecturerId,
          lecturer_name: assignment.lecturerName,
          title: assignment.title,
          description: assignment.description,
          department: assignment.department,
          academic_year: assignment.academicYear,
          due_date: assignment.dueDate,
          attachment_url: assignment.attachmentUrl || null,
          attachment_name: assignment.attachmentName || null,
          attachment_size: assignment.attachmentSize || null,
          is_grades_finalized: false
        }])
        .select()
        .single();

      if (asgErr) throw new Error(`Supabase assignment insert error: ${asgErr.message}`);

      // 2. Fetch all matching students in cohort
      const { data: matchingStudents, error: stErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student')
        .ilike('department', assignment.department)
        .eq('admission_year', assignment.academicYear);

      if (stErr) console.warn('Could not query matching students for assignment:', stErr.message);

      // 3. Populate student_assignments mappings
      if (matchingStudents && matchingStudents.length > 0) {
        const mappings = matchingStudents.map(st => ({
          student_id: st.id,
          assignment_id: newAsg.id,
          status: 'pending',
          is_graded: false
        }));
        await supabase.from('student_assignments').insert(mappings);
      }

      return {
        assignment: {
          id: newAsg.id,
          lecturerId: newAsg.lecturer_id,
          lecturerName: newAsg.lecturer_name,
          title: newAsg.title,
          description: newAsg.description,
          department: newAsg.department,
          academicYear: newAsg.academic_year,
          dueDate: newAsg.due_date,
          attachmentUrl: newAsg.attachment_url,
          attachmentName: newAsg.attachment_name,
          attachmentSize: newAsg.attachment_size,
          isGradesFinalized: false,
          createdAt: newAsg.created_at
        },
        recipients: (matchingStudents || []).map(u => ({ ...u, matricNumber: u.matric_number }))
      };
    }

    const data = readLocalDb();
    const newAssignment = {
      id: uuidv4(),
      lecturerId: assignment.lecturerId,
      lecturerName: assignment.lecturerName,
      title: assignment.title,
      description: assignment.description,
      department: assignment.department,
      academicYear: assignment.academicYear,
      dueDate: assignment.dueDate,
      attachmentUrl: assignment.attachmentUrl || null,
      attachmentName: assignment.attachmentName || null,
      attachmentSize: assignment.attachmentSize || null,
      isGradesFinalized: false,
      createdAt: new Date().toISOString()
    };
    data.assignments.push(newAssignment);

    // Automatically create assignment-to-student mappings for all students in this cohort
    const matchingStudents = data.users.filter(u => 
      u.role === 'student' && 
      u.department.toLowerCase() === assignment.department.toLowerCase() && 
      u.admissionYear === assignment.academicYear
    );

    matchingStudents.forEach(student => {
      data.studentAssignments.push({
        id: uuidv4(),
        studentId: student.id,
        assignmentId: newAssignment.id,
        status: 'pending',
        submissionContent: '',
        attachmentUrl: null,
        attachmentName: null,
        attachmentSize: null,
        telemetry: null,
        grade: null,
        feedback: null,
        isGraded: false,
        submittedAt: null,
        updatedAt: new Date().toISOString()
      });
    });

    writeLocalDb(data);
    return { assignment: newAssignment, recipients: matchingStudents };
  },

  async getAssignmentsByLecturer(lecturerId) {
    if (isSupabaseConfigured()) {
      const { data: asgs, error } = await supabase
        .from('assignments')
        .select('*, student_assignments(status, is_graded, grade)')
        .eq('lecturer_id', lecturerId)
        .order('created_at', { ascending: false });

      if (error) throw new Error(`Supabase getAssignmentsByLecturer error: ${error.message}`);

      return (asgs || []).map(a => {
        const mappings = a.student_assignments || [];
        const total = mappings.length;
        const completed = mappings.filter(m => m.status === 'completed').length;
        const graded = mappings.filter(m => m.is_graded).length;
        return {
          id: a.id,
          lecturerId: a.lecturer_id,
          lecturerName: a.lecturer_name,
          title: a.title,
          description: a.description,
          department: a.department,
          academicYear: a.academic_year,
          dueDate: a.due_date,
          attachmentUrl: a.attachment_url || null,
          attachmentName: a.attachment_name || null,
          attachmentSize: a.attachment_size || null,
          isGradesFinalized: a.is_grades_finalized || false,
          createdAt: a.created_at,
          stats: { total, completed, graded }
        };
      });
    }

    const data = readLocalDb();
    const lecturerAssignments = data.assignments.filter(a => a.lecturerId === lecturerId);
    
    return lecturerAssignments.map(a => {
      const mappings = data.studentAssignments.filter(sa => sa.assignmentId === a.id);
      const total = mappings.length;
      const completed = mappings.filter(sa => sa.status === 'completed').length;
      const graded = mappings.filter(sa => sa.isGraded).length;
      return {
        ...a,
        isGradesFinalized: a.isGradesFinalized || false,
        stats: { total, completed, graded }
      };
    });
  },

  async getStudentAssignments(studentId) {
    if (isSupabaseConfigured()) {
      // 1. Fetch student info
      const { data: student, error: stErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', studentId)
        .single();

      if (stErr || !student) return [];

      // 2. Fetch all cohort assignments
      const { data: cohortAsgs } = await supabase
        .from('assignments')
        .select('*')
        .ilike('department', student.department)
        .eq('academic_year', student.admission_year);

      // 3. Ensure student_assignments records exist
      const { data: existingMappings } = await supabase
        .from('student_assignments')
        .select('assignment_id')
        .eq('student_id', studentId);

      const existingIds = new Set((existingMappings || []).map(m => m.assignment_id));
      const missing = (cohortAsgs || []).filter(a => !existingIds.has(a.id));

      if (missing.length > 0) {
        await supabase.from('student_assignments').insert(
          missing.map(a => ({
            student_id: studentId,
            assignment_id: a.id,
            status: 'pending',
            is_graded: false
          }))
        );
      }

      // 4. Fetch joined mappings
      const { data: records, error } = await supabase
        .from('student_assignments')
        .select('id, status, submission_content, attachment_url, attachment_name, attachment_size, telemetry, grade, feedback, is_graded, submitted_at, updated_at, assignments(*)')
        .eq('student_id', studentId);

      if (error) throw new Error(`Supabase getStudentAssignments error: ${error.message}`);

      return (records || [])
        .filter(r => r.assignments)
        .map(r => ({
          id: r.assignments.id,
          lecturerId: r.assignments.lecturer_id,
          lecturerName: r.assignments.lecturer_name,
          title: r.assignments.title,
          description: r.assignments.description,
          department: r.assignments.department,
          academicYear: r.assignments.academic_year,
          dueDate: r.assignments.due_date,
          attachmentUrl: r.assignments.attachment_url || null,
          attachmentName: r.assignments.attachment_name || null,
          attachmentSize: r.assignments.attachment_size || null,
          isGradesFinalized: r.assignments.is_grades_finalized || false,
          createdAt: r.assignments.created_at,
          submissionId: r.id,
          status: r.status,
          submissionContent: r.submission_content || '',
          submissionAttachmentUrl: r.attachment_url || null,
          submissionAttachmentName: r.attachment_name || null,
          submissionAttachmentSize: r.attachment_size || null,
          telemetry: r.telemetry || null,
          grade: r.grade || null,
          feedback: r.feedback || null,
          isGraded: r.is_graded || false,
          submittedAt: r.submitted_at,
          updatedAt: r.updated_at
        }))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    const data = readLocalDb();
    const student = data.users.find(u => u.id === studentId);
    if (!student) return [];

    const matchingAssignments = data.assignments.filter(a =>
      a.department.toLowerCase() === student.department.toLowerCase() &&
      a.academicYear === student.admissionYear
    );

    let dataChanged = false;
    matchingAssignments.forEach(a => {
      const existingMapping = data.studentAssignments.find(
        sa => sa.studentId === student.id && sa.assignmentId === a.id
      );
      if (!existingMapping) {
        data.studentAssignments.push({
          id: uuidv4(),
          studentId: student.id,
          assignmentId: a.id,
          status: 'pending',
          submissionContent: '',
          attachmentUrl: null,
          attachmentName: null,
          attachmentSize: null,
          telemetry: null,
          grade: null,
          feedback: null,
          isGraded: false,
          submittedAt: null,
          updatedAt: new Date().toISOString()
        });
        dataChanged = true;
      }
    });

    if (dataChanged) {
      writeLocalDb(data);
    }

    const studentMappings = data.studentAssignments.filter(sa => sa.studentId === studentId);
    
    return studentMappings.map(mapping => {
      const assignment = data.assignments.find(a => a.id === mapping.assignmentId);
      return {
        ...assignment,
        submissionId: mapping.id,
        status: mapping.status,
        submissionContent: mapping.submissionContent || '',
        submissionAttachmentUrl: mapping.attachmentUrl || null,
        submissionAttachmentName: mapping.attachmentName || null,
        submissionAttachmentSize: mapping.attachmentSize || null,
        telemetry: mapping.telemetry || null,
        grade: mapping.grade || null,
        feedback: mapping.feedback || null,
        isGraded: mapping.isGraded || false,
        submittedAt: mapping.submittedAt || null,
        isGradesFinalized: assignment ? (assignment.isGradesFinalized || false) : false,
        updatedAt: mapping.updatedAt
      };
    }).filter(a => a !== undefined && a.id !== undefined)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async updateStudentAssignmentStatus(studentId, assignmentId, status) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('student_assignments')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('student_id', studentId)
        .eq('assignment_id', assignmentId)
        .select('id, status, submission_content, attachment_url, attachment_name, attachment_size, telemetry, grade, feedback, is_graded, updated_at, assignments(*)')
        .single();

      if (error) throw new Error(`Supabase updateStatus error: ${error.message}`);

      return {
        id: data.assignments.id,
        lecturerId: data.assignments.lecturer_id,
        lecturerName: data.assignments.lecturer_name,
        title: data.assignments.title,
        description: data.assignments.description,
        department: data.assignments.department,
        academicYear: data.assignments.academic_year,
        dueDate: data.assignments.due_date,
        attachmentUrl: data.assignments.attachment_url || null,
        attachmentName: data.assignments.attachment_name || null,
        attachmentSize: data.assignments.attachment_size || null,
        createdAt: data.assignments.created_at,
        submissionId: data.id,
        status: data.status,
        submissionContent: data.submission_content,
        submissionAttachmentUrl: data.attachment_url || null,
        submissionAttachmentName: data.attachment_name || null,
        submissionAttachmentSize: data.attachment_size || null,
        telemetry: data.telemetry,
        grade: data.grade,
        feedback: data.feedback,
        isGraded: data.is_graded,
        updatedAt: data.updated_at
      };
    }

    const data = readLocalDb();
    const mapping = data.studentAssignments.find(sa => sa.studentId === studentId && sa.assignmentId === assignmentId);
    if (!mapping) {
      throw new Error('Assignment mapping not found for this student');
    }
    mapping.status = status;
    mapping.updatedAt = new Date().toISOString();
    writeLocalDb(data);
    
    const assignment = data.assignments.find(a => a.id === assignmentId);
    return {
      ...assignment,
      submissionId: mapping.id,
      status: mapping.status,
      submissionContent: mapping.submissionContent,
      submissionAttachmentUrl: mapping.attachmentUrl || null,
      submissionAttachmentName: mapping.attachmentName || null,
      submissionAttachmentSize: mapping.attachmentSize || null,
      telemetry: mapping.telemetry,
      grade: mapping.grade,
      feedback: mapping.feedback,
      isGraded: mapping.isGraded,
      updatedAt: mapping.updatedAt
    };
  },

  // --- Student Document Writing & Telemetry Submission ---
  async submitAssignmentWork(studentId, assignmentId, content, telemetry, attachment = {}) {
    const now = new Date().toISOString();

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('student_assignments')
        .update({
          submission_content: content || '',
          attachment_url: attachment.url || null,
          attachment_name: attachment.name || null,
          attachment_size: attachment.size || null,
          telemetry: telemetry || null,
          status: 'completed',
          submitted_at: now,
          updated_at: now
        })
        .eq('student_id', studentId)
        .eq('assignment_id', assignmentId)
        .select('*, assignments(*)')
        .single();

      if (error) throw new Error(`Supabase submitAssignmentWork error: ${error.message}`);
      return data;
    }

    const data = readLocalDb();
    let mapping = data.studentAssignments.find(sa => sa.studentId === studentId && sa.assignmentId === assignmentId);
    if (!mapping) {
      mapping = {
        id: uuidv4(),
        studentId,
        assignmentId,
        status: 'completed',
        submissionContent: content || '',
        attachmentUrl: attachment.url || null,
        attachmentName: attachment.name || null,
        attachmentSize: attachment.size || null,
        telemetry: telemetry || null,
        grade: null,
        feedback: null,
        isGraded: false,
        submittedAt: now,
        updatedAt: now
      };
      data.studentAssignments.push(mapping);
    } else {
      mapping.submissionContent = content || '';
      if (attachment.url) {
        mapping.attachmentUrl = attachment.url;
        mapping.attachmentName = attachment.name;
        mapping.attachmentSize = attachment.size;
      }
      mapping.telemetry = telemetry || mapping.telemetry;
      mapping.status = 'completed';
      mapping.submittedAt = now;
      mapping.updatedAt = now;
    }

    writeLocalDb(data);
    return mapping;
  },

  // --- Lecturer Blind Grading & Unmasking ---
  async getSubmissionsForAssignment(assignmentId) {
    if (isSupabaseConfigured()) {
      const { data: asg, error: asgErr } = await supabase
        .from('assignments')
        .select('*')
        .eq('id', assignmentId)
        .single();

      if (asgErr || !asg) throw new Error('Assignment not found');

      const { data: mappings, error: mapErr } = await supabase
        .from('student_assignments')
        .select('*, profiles(*)')
        .eq('assignment_id', assignmentId);

      if (mapErr) throw new Error(`Supabase error: ${mapErr.message}`);

      return {
        assignment: {
          id: asg.id,
          title: asg.title,
          department: asg.department,
          academicYear: asg.academic_year,
          dueDate: asg.due_date,
          attachmentUrl: asg.attachment_url || null,
          attachmentName: asg.attachment_name || null,
          attachmentSize: asg.attachment_size || null,
          isGradesFinalized: asg.is_grades_finalized || false
        },
        submissions: (mappings || []).map((m) => {
          const candidateToken = `Candidate #${m.student_id.substring(0, 4).toUpperCase()}`;
          return {
            submissionId: m.id,
            studentId: m.student_id,
            candidateToken,
            studentName: asg.is_grades_finalized ? (m.profiles?.name || 'Unknown') : null,
            studentEmail: asg.is_grades_finalized ? (m.profiles?.email || null) : null,
            matricNumber: asg.is_grades_finalized ? (m.profiles?.matric_number || null) : null,
            status: m.status,
            submissionContent: m.submission_content || '',
            attachmentUrl: m.attachment_url || null,
            attachmentName: m.attachment_name || null,
            attachmentSize: m.attachment_size || null,
            telemetry: m.telemetry || null,
            grade: m.grade || '',
            feedback: m.feedback || '',
            isGraded: m.is_graded || false,
            submittedAt: m.submitted_at,
            updatedAt: m.updated_at
          };
        })
      };
    }

    const data = readLocalDb();
    const asg = data.assignments.find(a => a.id === assignmentId);
    if (!asg) throw new Error('Assignment not found');

    const mappings = data.studentAssignments.filter(sa => sa.assignmentId === assignmentId);
    const submissions = mappings.map((m) => {
      const student = data.users.find(u => u.id === m.studentId);
      const candidateToken = `Candidate #${m.studentId.substring(0, 4).toUpperCase()}`;
      return {
        submissionId: m.id,
        studentId: m.studentId,
        candidateToken,
        studentName: asg.isGradesFinalized ? (student?.name || 'Unknown') : null,
        studentEmail: asg.isGradesFinalized ? (student?.email || null) : null,
        matricNumber: asg.isGradesFinalized ? (student?.matricNumber || null) : null,
        status: m.status,
        submissionContent: m.submissionContent || '',
        attachmentUrl: m.attachmentUrl || null,
        attachmentName: m.attachmentName || null,
        attachmentSize: m.attachmentSize || null,
        telemetry: m.telemetry || null,
        grade: m.grade || '',
        feedback: m.feedback || '',
        isGraded: m.isGraded || false,
        submittedAt: m.submittedAt,
        updatedAt: m.updatedAt
      };
    });

    return {
      assignment: {
        id: asg.id,
        title: asg.title,
        department: asg.department,
        academicYear: asg.academicYear,
        dueDate: asg.dueDate,
        attachmentUrl: asg.attachmentUrl || null,
        attachmentName: asg.attachmentName || null,
        attachmentSize: asg.attachmentSize || null,
        isGradesFinalized: asg.isGradesFinalized || false
      },
      submissions
    };
  },

  async gradeSubmission(assignmentId, studentId, grade, feedback) {
    const now = new Date().toISOString();

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('student_assignments')
        .update({
          grade,
          feedback,
          is_graded: true,
          updated_at: now
        })
        .eq('assignment_id', assignmentId)
        .eq('student_id', studentId)
        .select()
        .single();

      if (error) throw new Error(`Supabase gradeSubmission error: ${error.message}`);
      return data;
    }

    const data = readLocalDb();
    const mapping = data.studentAssignments.find(sa => sa.assignmentId === assignmentId && sa.studentId === studentId);
    if (!mapping) throw new Error('Submission record not found');

    mapping.grade = grade;
    mapping.feedback = feedback;
    mapping.isGraded = true;
    mapping.updatedAt = now;
    writeLocalDb(data);
    return mapping;
  },

  async finalizeGrades(assignmentId) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('assignments')
        .update({ is_grades_finalized: true })
        .eq('id', assignmentId)
        .select()
        .single();

      if (error) throw new Error(`Supabase finalizeGrades error: ${error.message}`);
      return data;
    }

    const data = readLocalDb();
    const asg = data.assignments.find(a => a.id === assignmentId);
    if (!asg) throw new Error('Assignment not found');

    asg.isGradesFinalized = true;
    writeLocalDb(data);
    return asg;
  },

  async updateUserPassword(userId, hashedPassword) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('profiles')
        .update({ password: hashedPassword })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw new Error(`Supabase updateUserPassword error: ${error.message}`);
      return data;
    }

    const data = readLocalDb();
    const user = data.users.find(u => u.id === userId);
    if (!user) throw new Error('User not found');

    user.password = hashedPassword;
    writeLocalDb(data);
    return user;
  },

  async savePasswordResetToken(token, userId, expiresAt) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('password_reset_tokens')
        .insert([{
          token,
          user_id: userId,
          expires_at: expiresAt
        }])
        .select()
        .single();

      if (error) throw new Error(`Supabase savePasswordResetToken error: ${error.message}`);
      return data;
    }

    const data = readLocalDb();
    if (!data.passwordResetTokens) data.passwordResetTokens = [];
    const record = {
      id: uuidv4(),
      token,
      userId,
      expiresAt,
      used: false,
      createdAt: new Date().toISOString()
    };
    data.passwordResetTokens.push(record);
    writeLocalDb(data);
    return record;
  },

  async findPasswordResetToken(token) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('password_reset_tokens')
        .select('*')
        .eq('token', token)
        .eq('used', false)
        .maybeSingle();

      if (error) throw new Error(`Supabase findPasswordResetToken error: ${error.message}`);
      if (!data) return null;

      return {
        id: data.id,
        token: data.token,
        userId: data.user_id,
        expiresAt: data.expires_at,
        used: data.used,
        createdAt: data.created_at
      };
    }

    const data = readLocalDb();
    if (!data.passwordResetTokens) return null;
    return data.passwordResetTokens.find(t => t.token === token && !t.used);
  },

  async markPasswordResetTokenUsed(tokenId) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('password_reset_tokens')
        .update({ used: true })
        .eq('id', tokenId)
        .select()
        .single();

      if (error) throw new Error(`Supabase markPasswordResetTokenUsed error: ${error.message}`);
      return data;
    }

    const data = readLocalDb();
    if (!data.passwordResetTokens) return null;
    const record = data.passwordResetTokens.find(t => t.id === tokenId);
    if (record) {
      record.used = true;
      writeLocalDb(data);
    }
    return record;
  },

  async invalidateAllPasswordResetTokensForUser(userId) {
    if (isSupabaseConfigured()) {
      const { error } = await supabase
        .from('password_reset_tokens')
        .update({ used: true })
        .eq('user_id', userId);

      if (error) throw new Error(`Supabase invalidateAllPasswordResetTokensForUser error: ${error.message}`);
      return;
    }

    const data = readLocalDb();
    if (!data.passwordResetTokens) return;
    data.passwordResetTokens.forEach(t => {
      if (t.userId === userId) t.used = true;
    });
    writeLocalDb(data);
  }
};

module.exports = db;
