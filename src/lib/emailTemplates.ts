import { sendEmail } from "./email";

export const getLoginCredentialsEmailTemplate = (Email: string, password: string, loginUrl: string) => {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your NIB Training Account Credentials</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                background-color: #f4f4f4;
                color: #333;
                line-height: 1.6;
            }
            .container {
                max-width: 600px;
                margin: 20px auto;
                padding: 20px;
                background-color: #fff;
                border: 1px solid #ddd;
                border-radius: 5px;
            }
            .header {
                background-color: #fecf12;
                color: #000;
                padding: 10px;
                text-align: center;
                border-radius: 5px 5px 0 0;
            }
            .content {
                padding: 20px;
            }
            .credentials {
                background-color: #f9f9f9;
                border: 1px solid #eee;
                padding: 15px;
                border-radius: 5px;
                margin: 20px 0;
            }
            .credentials p {
                margin: 5px 0;
            }
            .credentials strong {
                display: inline-block;
                width: 120px;
            }
            .button {
                display: inline-block;
                background-color: #4a6e3a;
                color: #fff;
                padding: 10px 20px;
                text-decoration: none;
                border-radius: 5px;
                margin-top: 20px;
            }
            .footer {
                margin-top: 20px;
                text-align: center;
                font-size: 0.9em;
                color: #777;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>Welcome to NIB Audit Platform!</h2>
            </div>
            <div class="content">
                <p>Hello,</p>
                <p>An account has been created for you on the NIB Audit Platform. Please use the following credentials to log in.</p>
                
                <div class="credentials">
                    <p><strong>Login ID:</strong> ${Email}</p>
                    <p><strong>Password:</strong> ${password}</p>
                </div>

                <p>It is strongly recommended to change your password after your first login.</p>
                
                <a href="https://nibaudit.nibbank.com.et" class="button" style="color: #fff;">Click Here to Login</a>
            </div>
            <div class="footer">
                <p>This is an automated message. Please do not reply.</p>
            </div>
        </div>
    </body>
    </html>
    `;
};

export async function sendPasswordChangeNotification(email: string, fullName: string): Promise<void> {
  const changedAt = new Date().toLocaleString('en-US', {
    dateStyle: 'long',
    timeStyle: 'short',
  });

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>Password Changed — NibAudit</title>
      <style>
        body { font-family: Arial, sans-serif; background-color: #f4f4f4; color: #333; }
        .container { max-width: 600px; margin: 20px auto; background: #fff; border: 1px solid #ddd; border-radius: 5px; }
        .header { background-color: #dc2626; color: #fff; padding: 16px 20px; border-radius: 5px 5px 0 0; }
        .header h2 { margin: 0; font-size: 1.1em; }
        .content { padding: 24px; line-height: 1.6; }
        .alert-box { background: #fef2f2; border: 1px solid #fca5a5; border-radius: 4px; padding: 14px 18px; margin: 18px 0; }
        .footer { padding: 16px 20px; text-align: center; font-size: 0.85em; color: #777; border-top: 1px solid #eee; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header"><h2>Security Alert — Password Changed</h2></div>
        <div class="content">
          <p>Hello <strong>${fullName}</strong>,</p>
          <p>Your NibAudit account password was successfully changed on <strong>${changedAt}</strong>.</p>
          <div class="alert-box">
            <strong>Did not make this change?</strong><br />
            If you did not change your password, your account may be compromised. Contact your system administrator immediately and do not attempt to log in.
          </div>
          <p>If you made this change yourself, no action is required.</p>
        </div>
        <div class="footer">This is an automated security notification. Please do not reply to this email.</div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({ to: email, subject: 'Your NibAudit password has been changed', html });
}
