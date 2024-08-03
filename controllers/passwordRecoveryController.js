const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const User = require("../models/User");
const crypto = require("crypto");

const generatePasswordResetToken = () => {
  return crypto.randomBytes(20).toString("hex");
};

// Create a Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail", // Use your email service provider
  auth: {
    user: "binishkayastha46@gmail.com", // Replace with your email address
    pass: "yvyj nevc zhjy cqdd", // Replace with your email password
  },
});

const requestPasswordReset = async (req, res, next) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Generate and save a password reset token
    const resetToken = generatePasswordResetToken();
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // Token expires in 1 hour
    await user.save();

    // Send an email with the reset token
    const mailOptions = {
      from: "binishkayastha46@gmail.com",
      to: email,
      subject: "Password Reset",
      text: `Your password reset token is: ${resetToken}. Use this token to reset your password.`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        return res.status(500).json({ error: "Failed to send reset email" });
      }
      res.status(200).json({ message: "Reset email sent successfully" });
    });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
    const { token } = req.params;
    const { password } = req.body;
  
    try {
      // Check for empty password
      if (!password) {
        return res.status(400).json({ error: "Please enter a new password" });
      }
  
      // Check for password complexity
      const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+={}[\]:;<>,.?~\\-])/;
      if (!passwordRegex.test(password)) {
        return res.status(400).json({
          error:
            "Password must include a combination of Uppercase letters, Lowercase letters, Numbers, Special characters (e.g.,!, @, #, $)",
        });
      }
  
      // Check for password length
      const minLength = 8;
      if (password.length < minLength) {
        return res.status(400).json({
          error: `Password length should be at least ${minLength} characters.`,
        });
      }
  
      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() },
      });
  
      if (!user) {
        return res.status(400).json({ error: "Invalid or expired token" });
      }
  
      // Reset password and clear reset token fields
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
  
      res.status(200).json({ message: "Password reset successfully" });
    } catch (error) {
      next(error);
    }
  };
  

module.exports = { requestPasswordReset, resetPassword };