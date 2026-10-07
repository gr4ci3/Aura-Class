const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken } = require('./auth');
const { sendAssignmentNotification } = require('../services/email');

// Helper middleware: lecturer only check
function requireLecturer(req, res, next) {
  if (req.user.role !== 'lecturer') {
    return res.status(403).json({ error: 'Access denied: Only lecturers can perform this action' });
  }
  next();
}

// Helper middleware: student only check
function requireStudent(req, res, next) {
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: 'Access denied: Only students can perform this action' });
  }
  next();
}

// POST create a new assignment (Lecturers only)
router.post('/', authenticateToken, requireLecturer, async (req, res) => {
  const { title, description, department, academicYear, dueDate, attachmentUrl, attachmentName, attachmentSize } = req.body;

  if (!title || !description || !department || !academicYear || !dueDate) {
    return res.status(400).json({ error: 'All fields (title, description, department, academicYear, dueDate) are required' });
  }

  try {
    // Create assignment and target mappings in database
    const { assignment, recipients } = await db.createAssignment({
      lecturerId: req.user.id,
      lecturerName: req.user.name,
      title,
      description,
      department,
      academicYear,
      dueDate,
      attachmentUrl,
      attachmentName,
      attachmentSize
    });

    // Trigger email notification to students in the background
    let emailPreviewUrl = null;
    if (recipients && recipients.length > 0) {
      emailPreviewUrl = await sendAssignmentNotification(recipients, assignment);
    }

    res.status(201).json({
      message: 'Assignment created and distributed successfully',
      assignment,
      recipientsCount: recipients.length,
      emailPreviewUrl
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET assignments sent by the lecturer (Lecturers only)
router.get('/lecturer', authenticateToken, requireLecturer, async (req, res) => {
  try {
    const assignments = await db.getAssignmentsByLecturer(req.user.id);
    res.json({ assignments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET assignments for a student (Students only)
router.get('/student', authenticateToken, requireStudent, async (req, res) => {
  try {
    const assignments = await db.getStudentAssignments(req.user.id);
    res.json({ assignments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update status of assignment (Students only)
router.put('/:id/status', authenticateToken, requireStudent, async (req, res) => {
  const assignmentId = req.params.id;
  const { status } = req.body; // 'pending' | 'completed'

  if (!status || (status !== 'pending' && status !== 'completed')) {
    return res.status(400).json({ error: "Status must be 'pending' or 'completed'" });
  }

  try {
    const updatedAssignment = await db.updateStudentAssignmentStatus(
      req.user.id,
      assignmentId,
      status
    );
    res.json({
      message: 'Assignment status updated successfully',
      assignment: updatedAssignment
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST submit written paper or document attachment with keystroke telemetry (Students only)
router.post('/:id/submit', authenticateToken, requireStudent, async (req, res) => {
  const assignmentId = req.params.id;
  const { content, telemetry, attachmentUrl, attachmentName, attachmentSize } = req.body;

  if (!content && !attachmentUrl) {
    return res.status(400).json({ error: 'Please write your submission or attach a document file' });
  }

  try {
    const submission = await db.submitAssignmentWork(
      req.user.id,
      assignmentId,
      content,
      telemetry,
      {
        url: attachmentUrl,
        name: attachmentName,
        size: attachmentSize
      }
    );

    res.json({
      message: 'Assignment submission recorded successfully',
      submission
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET submissions for an assignment (Lecturers only - supports Blind Grading)
router.get('/:id/submissions', authenticateToken, requireLecturer, async (req, res) => {
  const assignmentId = req.params.id;

  try {
    const data = await db.getSubmissionsForAssignment(assignmentId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST grade a student's submission (Lecturers only)
router.post('/:id/grade', authenticateToken, requireLecturer, async (req, res) => {
  const assignmentId = req.params.id;
  const { studentId, grade, feedback } = req.body;

  if (!studentId || !grade) {
    return res.status(400).json({ error: 'Student ID and Grade are required' });
  }

  try {
    const graded = await db.gradeSubmission(assignmentId, studentId, grade, feedback || '');
    res.json({
      message: 'Grade recorded successfully',
      submission: graded
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST finalize and unmask grades for an assignment (Lecturers only)
router.post('/:id/finalize-grades', authenticateToken, requireLecturer, async (req, res) => {
  const assignmentId = req.params.id;

  try {
    const assignment = await db.finalizeGrades(assignmentId);
    res.json({
      message: 'Grades finalized! Student identities are now unmasked.',
      assignment
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
