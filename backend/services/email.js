const nodemailer = require('nodemailer');

let transporter = null;

// Initialize the Nodemailer Transporter
async function getTransporter() {
  if (transporter) return transporter;

  const hasSmtpConfig = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

  if (hasSmtpConfig) {
    console.log('📧 Using custom SMTP configuration from .env');
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  } else {
    console.log('📧 No SMTP config found. Creating an Ethereal Email test account...');
    try {
      const testAccount = await nodemailer.createTestAccount();
      console.log('✅ Test SMTP account created successfully!');
      console.log(`   User: ${testAccount.user}`);
      console.log(`   Pass: ${testAccount.pass}`);
      
      transporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });

      // Save credentials dynamically for the session so it doesn't create new ones every time
      process.env.SMTP_USER = testAccount.user;
      process.env.SMTP_PASS = testAccount.pass;
      process.env.SMTP_HOST = testAccount.smtp.host;
      process.env.SMTP_PORT = testAccount.smtp.port;

    } catch (error) {
      console.error('❌ Failed to create Ethereal Email test account. Email sending will be mocked in console only.', error.message);
      // Fallback dummy transporter that does nothing
      transporter = {
        sendMail: async (mailOptions) => {
          console.log('\n--- MOCK EMAIL SENT ---');
          console.log(`To: ${mailOptions.to}`);
          console.log(`Subject: ${mailOptions.subject}`);
          console.log(`Body: ${mailOptions.text}`);
          console.log('-----------------------\n');
          return { messageId: 'mock-id-' + Date.now(), mock: true };
        }
      };
    }
  }

  return transporter;
}

/**
 * Sends a notification email to students when a new assignment is created.
 * @param {Array} students Array of student user objects
 * @param {Object} assignment Assignment details
 */
async function sendAssignmentNotification(students, assignment) {
  if (!students || students.length === 0) {
    console.log(`ℹ️ No students registered for cohort: ${assignment.department} - ${assignment.academicYear}. Skipping emails.`);
    return;
  }

  const client = await getTransporter();
  const recipientEmails = students.map(s => s.email).join(', ');

  const mailOptions = {
    from: `"AuraClass Portal" <${process.env.SMTP_USER || 'no-reply@auraclass.edu'}>`,
    to: recipientEmails,
    subject: `🚨 New Assignment: ${assignment.title} - ${assignment.department}`,
    text: `Hello Students,\n\nA new assignment has been posted for your cohort (${assignment.department}, ${assignment.academicYear} Set).\n\nAssignment Details:\n- Title: ${assignment.title}\n- Description: ${assignment.description}\n- Due Date: ${new Date(assignment.dueDate).toLocaleDateString()}\n- Posted by: ${assignment.lecturerName}\n\nPlease login to the AuraClass portal to view and submit your work.\n\nBest regards,\nAuraClass Academic Team`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
        <h2 style="color: #6366f1; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px; margin-top: 0;">AuraClass Portal</h2>
        <p style="font-size: 16px; color: #334155;">Hello Students,</p>
        <p style="font-size: 16px; color: #334155;">A new assignment has been posted for your cohort (<strong>${assignment.department}</strong>, <strong>${assignment.academicYear}</strong> set).</p>
        
        <div style="background-color: #f8fafc; border-left: 4px solid #6366f1; padding: 15px; margin: 20px 0; border-radius: 0 4px 4px 0;">
          <h3 style="margin-top: 0; color: #1e293b; font-size: 18px;">${assignment.title}</h3>
          <p style="color: #475569; font-size: 15px; line-height: 1.5; margin-bottom: 10px;">${assignment.description}</p>
          <hr style="border: 0; border-top: 1px dashed #cbd5e1; margin: 12px 0;">
          <table style="width: 100%; font-size: 14px; color: #64748b;">
            <tr>
              <td style="width: 90px; font-weight: 600;">Posted By:</td>
              <td>${assignment.lecturerName}</td>
            </tr>
            <tr>
              <td style="font-weight: 600;">Due Date:</td>
              <td style="color: #ef4444; font-weight: 600;">${new Date(assignment.dueDate).toLocaleDateString()} ${new Date(assignment.dueDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
            </tr>
          </table>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="http://localhost:5173" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Open Dashboard</a>
        </div>
        
        <p style="font-size: 13px; color: #94a3b8; text-align: center; margin-top: 40px; border-top: 1px solid #f1f5f9; padding-top: 15px;">
          This is an automated notification. Please do not reply directly to this email.
        </p>
      </div>
    `
  };

  try {
    const info = await client.sendMail(mailOptions);
    console.log(`📩 Notification email sent successfully to ${students.length} students!`);
    console.log(`   Message ID: ${info.messageId}`);
    
    // If using Ethereal, display the preview link to easily verify layout/content!
    if (nodemailer.getTestMessageUrl(info)) {
      console.log(`🔗 Preview Sent Email: ${nodemailer.getTestMessageUrl(info)}`);
      return nodemailer.getTestMessageUrl(info);
    }
  } catch (error) {
    console.error('❌ Error sending notification email:', error.message);
  }
  return null;
}

async function sendPasswordResetEmail(user, resetToken) {
  const client = await getTransporter();

  const resetLink = `http://localhost:5173/#/reset-password?token=${resetToken}`;
  const expiryHours = 1;

  const mailOptions = {
    from: `"AuraClass Portal" <${process.env.SMTP_USER || 'no-reply@auraclass.edu'}>`,
    to: user.email,
    subject: `🔐 Password Reset Request - AuraClass Portal`,
    text: `Hello ${user.name},\n\nWe received a request to reset your AuraClass Portal password.\n\nTo create a new password, click the link below:\n${resetLink}\n\nThis link will expire in ${expiryHours} hour for your security.\n\nIf you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.\n\nBest regards,\nAuraClass Academic Team`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
        <h2 style="color: #2e1065; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px; margin-top: 0;">AuraClass Portal</h2>
        <p style="font-size: 16px; color: #334155;">Hello ${user.name},</p>
        <p style="font-size: 16px; color: #334155;">We received a request to reset your <strong>AuraClass Portal</strong> password.</p>
        
        <div style="background-color: #f8fafc; border-left: 4px solid #7c3aed; padding: 15px; margin: 20px 0; border-radius: 0 4px 4px 0;">
          <h3 style="margin-top: 0; color: #2e1065; font-size: 18px;">Reset Your Password</h3>
          <p style="color: #475569; font-size: 15px; line-height: 1.5; margin-bottom: 16px;">Click the button below to create a new password for your account.</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${resetLink}" style="background: linear-gradient(135deg, #2e1065 0%, #4c1d95 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 10px; font-weight: 700; display: inline-block; font-family: 'Space Grotesk', sans-serif; box-shadow: 0 8px 20px -4px rgba(46, 16, 101, 0.35);">
              Create New Password
            </a>
          </div>
          <p style="font-size: 13px; color: #64748b; margin-top: 12px;">If the button doesn't work, copy and paste this link into your browser:</p>
          <div style="background: #ffffff; padding: 10px; border: 1px dashed #cbd5e1; border-radius: 6px; word-break: break-all; font-size: 12px; color: #4c1d95; font-family: monospace;">
            ${resetLink}
          </div>
        </div>

        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 0 4px 4px 0; margin: 16px 0;">
          <p style="margin: 0; font-size: 14px; color: #92400e; font-weight: 600;">
            ⏰ This link will expire in <strong>${expiryHours} hour</strong> for your security.
          </p>
        </div>

        <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 12px 16px; border-radius: 0 4px 4px 0; margin: 16px 0;">
          <p style="margin: 0; font-size: 14px; color: #991b1b;">
            <strong>Didn't request this?</strong> If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.
          </p>
        </div>
        
        <p style="font-size: 13px; color: #94a3b8; text-align: center; margin-top: 40px; border-top: 1px solid #f1f5f9; padding-top: 15px;">
          This is an automated notification. Please do not reply directly to this email.
        </p>
      </div>
    `
  };

  try {
    const info = await client.sendMail(mailOptions);
    console.log(`📩 Password reset email sent successfully to ${user.email}!`);
    console.log(`   Message ID: ${info.messageId}`);
    
    if (nodemailer.getTestMessageUrl(info)) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log(`🔗 Preview Reset Email: ${previewUrl}`);
      return previewUrl;
    }
  } catch (error) {
    console.error('❌ Error sending password reset email:', error.message);
  }
  return null;
}

module.exports = {
  sendAssignmentNotification,
  sendPasswordResetEmail
};
