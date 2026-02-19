const getBaseTemplate = (title, content) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f9; margin: 0; padding: 0; color: #333; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); overflow: hidden; border: 1px solid #e1e8ed; }
        .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 40px 20px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; }
        .content { padding: 40px; text-align: center; }
        .footer { padding: 24px; background-color: #f9fafb; text-align: center; border-top: 1px solid #e1e8ed; }
        .footer p { font-size: 13px; color: #9ca3af; margin: 0; }
        .btn { display: inline-block; background-color: #4f46e5; color: #ffffff !important; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px; transition: background-color 0.2s; }
        @media only screen and (max-width: 600px) { .container { margin: 20px; } .content { padding: 30px 20px; } }
        ${content.styles || ''}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Schedulifynow</h1>
        </div>
        <div class="content">
            ${content.body}
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Schedulifynow Team. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
  `;
};

module.exports = { getBaseTemplate };
