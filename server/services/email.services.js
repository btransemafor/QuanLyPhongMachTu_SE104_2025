const nodemailer = require('nodemailer'); 

const os = require("os");

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (let name in interfaces) {
    for (let iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
}

console.log(getLocalIP());

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "flyfishchill@gmail.com",
    pass: "yoodoxsubohkvhco",
  },
});

// Function to send token via email
async function sendTokensViaEmail(recipients, token) {

  const ip = getLocalIP(); 
  console.log("List of recipients:", recipients);

  // Example reset link
  const resetLink = `http://${ip}:3000/reset-password?token=${token}`;

  const mailOptions = {
    from: 'flyfishchill@gmail.com',
    to: recipients, // can be a string or array of emails
    subject: '🔐 Yêu cầu đặt lại mật khẩu',
    html: `
      <h2>Xin chào,</h2>
      <p>Bạn vừa yêu cầu đặt lại mật khẩu cho tài khoản của mình.</p>
      <p>Vui lòng nhấn vào liên kết bên dưới để đặt lại mật khẩu:</p>
      <p><a href="${resetLink}" target="_blank">${resetLink}</a></p>
      <p><b>Lưu ý:</b> Liên kết này sẽ hết hạn sau 1 phút.</p>
      <br/>
      <p>Trân trọng,<br/>Đội ngũ OMGNICE</p>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.response);
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

// Example usage:
/* const token = "abc123xyz";
sendTokensViaEmail("user@example.com", token); */


module.exports = {
    sendTokensViaEmail
}