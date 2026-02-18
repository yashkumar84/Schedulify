import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER || 'ambranelabs@gmail.com',
        pass: process.env.GMAIL_PASS, // Use App Password for Gmail
    },
});

export class EmailService {
    async sendEmail(to: string, subject: string, html: string) {
        try {
            const mailOptions = {
                from: `"TaskiFy CRM" <${process.env.GMAIL_USER || 'ambranelabs@gmail.com'}>`,
                to,
                subject,
                html,
            };

            const info = await transporter.sendMail(mailOptions);
            console.log('📧 Email sent:', info.messageId);
            return info;
        } catch (error) {
            console.error('❌ Email Error:', error);
            throw error;
        }
    }

    async sendTaskAssignmentEmail(userEmail: string, taskTitle: string, projectName: string) {
        const subject = `New Task Assigned: ${taskTitle}`;
        const html = `
      <h1>You have a new task!</h1>
      <p>Hello,</p>
      <p>A new task <strong>${taskTitle}</strong> has been assigned to you in project <strong>${projectName}</strong>.</p>
      <p>Log in to TaskiFy to view details.</p>
    `;
        return this.sendEmail(userEmail, subject, html);
    }

    async sendExpenseStatusEmail(userEmail: string, expenseDesc: string, status: string, comment?: string) {
        const subject = `Expense Request ${status}: ${expenseDesc}`;
        const html = `
      <h1>Expense Update</h1>
      <p>Hello,</p>
      <p>Your expense request for <strong>${expenseDesc}</strong> has been <strong>${status}</strong>.</p>
      ${comment ? `<p>Reviewer Comment: ${comment}</p>` : ''}
    `;
        return this.sendEmail(userEmail, subject, html);
    }
}
