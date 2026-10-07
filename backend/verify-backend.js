const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Clean DB for isolated test
const dbPath = path.join(__dirname, 'database.json');
if (fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, JSON.stringify({ users: [], assignments: [], studentAssignments: [] }), 'utf8');
}

const db = require('./database');

async function runTests() {
  console.log('🧪 Starting AuraClass Advanced Backend Verification Testing...\n');

  // 1. Create Students with Matric Numbers
  console.log('1️⃣ Creating student profiles with Matriculation Numbers...');
  const studentGrace = await db.createUser({
    name: 'Grace Umar',
    email: 'grace.umar@school.edu',
    password: 'hashed_password_123',
    role: 'student',
    department: 'Computer Engineering',
    admissionYear: '2024/2025',
    matricNumber: '2024/1/89402CE'
  });
  console.log(`✅ Student Grace Umar created with Matric: ${studentGrace.matricNumber}`);

  const studentBob = await db.createUser({
    name: 'Bob Smith',
    email: 'bob.smith@school.edu',
    password: 'hashed_password_456',
    role: 'student',
    department: 'Mechatronics Engineering',
    admissionYear: '2024/2025',
    matricNumber: '2024/1/77301ME'
  });
  console.log(`✅ Student Bob Smith created with Matric: ${studentBob.matricNumber}`);

  // Test Dual Login (Email or Matric)
  const byEmail = await db.getUserByEmailOrMatric('grace.umar@school.edu');
  const byMatric = await db.getUserByEmailOrMatric('2024/1/89402CE');
  assert.strictEqual(byEmail.id, studentGrace.id, 'Should find user by email');
  assert.strictEqual(byMatric.id, studentGrace.id, 'Should find user by matric number');
  console.log('✅ PASS: Dual lookup by email and matric number verified.');

  // 2. Create Lecturer
  console.log('\n2️⃣ Creating lecturer profile...');
  const lecturerJane = await db.createUser({
    name: 'Dr. Jane Vance',
    email: 'jane.vance@school.edu',
    password: 'hashed_password_789',
    role: 'lecturer',
    department: 'Computer Engineering'
  });
  console.log(`✅ Lecturer Dr. Jane Vance created with ID: ${lecturerJane.id}`);

  // 3. Post Assignment
  console.log('\n3️⃣ Posting assignment to Computer Engineering (2024/2025)...');
  const { assignment, recipients } = await db.createAssignment({
    lecturerId: lecturerJane.id,
    lecturerName: lecturerJane.name,
    title: 'Embedded Systems & Microcontroller Lab 1',
    description: 'Design a memory mapped I/O register driver for ARM Cortex-M4.',
    department: 'Computer Engineering',
    academicYear: '2024/2025',
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString()
  });
  assert.strictEqual(recipients.length, 1, 'Only 1 Computer Engineering student should receive it');
  console.log(`✅ Assignment created and distributed to Grace (${recipients[0].matricNumber})`);

  // 4. Submit Assignment with Keystroke Telemetry & 3,000-word Paste Burst
  console.log('\n4️⃣ Student writes and submits paper with simulated typing telemetry...');
  const simulatedTelemetry = {
    totalDurationSeconds: 180,
    wpm: 38,
    pasteCount: 1,
    largestPasteWords: 2950,
    hasLargePasteWarning: true,
    timeline: [
      { timestamp: '00:00:10', wordCount: 15, deltaWords: 15, isPaste: false, snapshot: 'Introduction to embedded architectures' },
      { timestamp: '00:00:45', wordCount: 48, deltaWords: 33, isPaste: false, snapshot: 'Introduction to embedded architectures and memory maps...' },
      { timestamp: '00:01:12', wordCount: 2998, deltaWords: 2950, isPaste: true, snapshot: 'Massive 3000-word block pasted in 0.2 seconds from external source...' }
    ]
  };

  await db.submitAssignmentWork(
    studentGrace.id,
    assignment.id,
    'Full submitted paper content with microcontroller specifications...',
    simulatedTelemetry
  );
  console.log('✅ Student paper submission with telemetry saved.');

  // 5. Blind Grading & Identity Masking
  console.log('\n5️⃣ Testing Lecturer Blind Grading (Masked Mode)...');
  const blindSubmissions = await db.getSubmissionsForAssignment(assignment.id);
  assert.strictEqual(blindSubmissions.assignment.isGradesFinalized, false, 'Grades should start unfinalized');
  assert.strictEqual(blindSubmissions.submissions[0].studentName, null, 'Student name MUST BE MASKED during blind review');
  assert.strictEqual(blindSubmissions.submissions[0].matricNumber, null, 'Student matric number MUST BE MASKED during blind review');
  assert.ok(blindSubmissions.submissions[0].candidateToken.startsWith('Candidate #'), 'Candidate token should be displayed');
  assert.strictEqual(blindSubmissions.submissions[0].telemetry.hasLargePasteWarning, true, 'Telemetry should preserve large paste warning flag');
  console.log(`✅ PASS: Submission identity masked as ${blindSubmissions.submissions[0].candidateToken}`);

  // Grade the candidate
  console.log('\n6️⃣ Lecturer grades submission in blind mode...');
  await db.gradeSubmission(assignment.id, studentGrace.id, 'B+', 'Good technical analysis, but note that sudden external text paste was detected.');
  console.log('✅ Grade and feedback recorded.');

  // Finalize & Unmask Grades
  console.log('\n7️⃣ Finalising grades and unmasking student identities...');
  await db.finalizeGrades(assignment.id);

  const unmaskedSubmissions = await db.getSubmissionsForAssignment(assignment.id);
  assert.strictEqual(unmaskedSubmissions.assignment.isGradesFinalized, true, 'Grades should now be finalized');
  assert.strictEqual(unmaskedSubmissions.submissions[0].studentName, 'Grace Umar', 'Student name MUST BE UNMASKED after finalization');
  assert.strictEqual(unmaskedSubmissions.submissions[0].matricNumber, '2024/1/89402CE', 'Student matric number MUST BE UNMASKED after finalization');
  assert.strictEqual(unmaskedSubmissions.submissions[0].grade, 'B+', 'Grade matches');
  console.log(`✅ PASS: Unmasked successfully! Student: ${unmaskedSubmissions.submissions[0].studentName} (${unmaskedSubmissions.submissions[0].matricNumber}) -> Grade: ${unmaskedSubmissions.submissions[0].grade}`);

  console.log('\n🎉 ALL ADVANCED BACKEND TESTS PASSED WITH 100% SUCCESS! 🎉\n');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
