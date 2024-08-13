const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");

const registerUser = (req, res, next) => {
  const { username, password, email, confirmPassword } = req.body;
  // Check if all required fields are filled
  if (!username || !password || !email || !confirmPassword) {
    return res.status(400).json({ error: "All fields are required" });
  }
  // Email Validation: Check if the email is in a valid format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }
  // Password Complexity: Require passwords to include a combination of Uppercase letters, Lowercase letters, Numbers, Special characters
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      error:
        "Password must include combination of: Uppercase letters, Lowercase letters, Numbers, Special characters (e.g.,!, @, #, $)",
    });
  }
  const minPasswordLength = 8;
  if (password.length < minPasswordLength) {
    return res.status(400).json({
      error: `Password length must be at least ${minPasswordLength} characters`,
    });
  }

  User.findOne({ $or: [{ username }, { email }] })
    .then((user) => {
      if (user) {
        return res.status(400).json({ error: "Duplicate username or email" });
      }
      bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        const newUser = new User({
          username,
          password: hash,
          email,
          confirmPassword: hash,
        });

        // Update password history for the newly registered user
        newUser.passwordHistory.push(hash);
        // Trim the password history to a specific depth (e.g., last 5 passwords)
        const passwordHistoryDepth = 5;
        newUser.passwordHistory = newUser.passwordHistory.slice(
          -passwordHistoryDepth
        );

        newUser
          .save()
          .then((user) => {
            res.status(201).json(user);
          })
          .catch(next);
      });
    })
    .catch(next);
};

const loginUser = async (req, res, next) => {
  const { username, password } = req.body;

  // Check if username or password is missing
  if (!username || !password) {
    return res.status(400).json({ error: "Please fill in all fields" });
  }

  try {
    const user = await User.findOne({ username });

    // Check if user is not found
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    if (user.accountLocked) {
      // Check if it's time to unlock the account
      const lockoutDurationMillis = Date.now() - user.lastFailedLoginAttempt;
      const lockoutDurationSeconds = lockoutDurationMillis / 1000; // convert to seconds

      if (lockoutDurationSeconds >= 120) {
        // 2 minutes in seconds
        // Unlock the account
        user.accountLocked = false;
        user.failedLoginAttempts = 0;
        await user.save();
      } else {
        // Calculate the time remaining for the account lockout period
        const timeRemainingSeconds = 120 - lockoutDurationSeconds;
        const minutes = Math.floor(timeRemainingSeconds / 60);
        const seconds = Math.floor(timeRemainingSeconds % 60);

        return res.status(400).json({
          error: `Account is locked. Please try again later after ${minutes} minutes and ${seconds} seconds.`,
        });
      }
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      // Increment failed login attempts and update last failed login timestamp
      user.failedLoginAttempts += 1;
      user.lastFailedLoginAttempt = Date.now();

      // Check if the maximum allowed failed attempts is reached
      if (user.failedLoginAttempts >= 4) {
        // Lock the account
        user.accountLocked = true;
        await user.save();
        return res
          .status(400)
          .json({ error: "Account is locked. Please try again later." });
      }
      // Save the updated user data
      await user.save();

      return res.status(400).json({ error: "Invalid password" });
    }

    // Reset failed login attempts and last failed login timestamp on successful login
    user.failedLoginAttempts = 0;
    user.lastFailedLoginAttempt = null;
    await user.save();

    // Check if the account is still locked after successful login
    if (user.accountLocked) {
      return res
        .status(400)
        .json({ error: "Account is locked. Please try again later." });
    }

    // If everything is fine, generate and send the JWT token
    // const payload = {
    //   id: user._id,
    //   username: user.username,
    //   email: user.email,
    // };

    // jwt.sign(payload, process.env.SECRET, { expiresIn: "1d" }, (err, token) => {
    //   if (err) {
    //     return res.status(500).json({ error: err.message });
    //   }
    //   res.json({ status: "success", token: token });
    // });
    // If everything is fine, generate and send the JWT token
    const payload = {
      id: user._id,
      username: user.username,
      email: user.email,
    };

    jwt.sign(
      payload,
      process.env.SECRET,
      { expiresIn: "60d" },
      (err, token) => {
        if (err) {
          /* istanbul ignore next */
          return res.status(500).json({ error: err.message });
        }
        res.json({ status: "success", token: token, user: user });
      }
    );
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred. Please try again later." });
  }
};

const getUserProfile = async (req, res, next) => {
  try {
    if (req.user === undefined || req.user === null) {
      return res.status(404).json({ error: "User not found" });
    } else {
      const userId = req.user.id;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      // Check if the user is logged in and get the logged-in user ID
      const loggedInUserID = req.user ? req.user.id : null;

      // Add the isUserLoggedIn field to the user object
      const userWithLoggedInField = {
        ...user.toObject(),
        isUserLoggedIn: loggedInUserID === user._id.toString(),
      };

      res.json({ user: [userWithLoggedInField] });

      // Add the return statement
      return;
    }
  } catch (error) {
    next(error);
  }
};

const updatePassword = async (req, res, next) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  const userId = req.user.id;

  try {
    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Compare the current password with the stored hashed password
    const passwordMatch = await bcrypt.compare(currentPassword, user.password);
    if (!passwordMatch) {
      return res.status(400).json({ error: "Incorrect current password" });
    }

    // Check if the new password and confirm password match
    if (newPassword !== confirmPassword) {
      return res
        .status(400)
        .json({ error: "New password and confirm password do not match" });
    }

    // Check if the new password is different from the current password
    if (currentPassword === newPassword) {
      return res.status(400).json({
        error: "New password must be different from the current password",
      });
    }

    // Check if the new password is in the password history
    const isPasswordInHistory = await Promise.all(
      user.passwordHistory.map(async (oldPassword) => {
        return await bcrypt.compare(newPassword, oldPassword);
      })
    );

    if (isPasswordInHistory.includes(true)) {
      return res.status(400).json({
        error: "New password cannot be one of the recent passwords",
      });
    }

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password and set the new password change date
    user.password = hashedNewPassword;
    user.passwordChangeDate = new Date();

    // Save the updated user
    await user.save();

    // Update the password history
    user.passwordHistory.push(hashedNewPassword);
    // Trim the password history to a specific depth (e.g., last 5 passwords)
    const passwordHistoryDepth = 5;
    user.passwordHistory = user.passwordHistory.slice(-passwordHistoryDepth);

    await user.save();

    res.status(204).json({ message: "Password updated successfully" });
  } catch (error) {
    /* istanbul ignore next */
    next(error);
  }
};

const uploadImage = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ message: "Please upload a file" });
  }

  // Update the user's profile picture in the database
  const userId = req.user.id;
  const image = req.file.filename;

  User.findByIdAndUpdate(userId, { image })
    .then(() => {
      res.status(200).json({
        success: true,
        data: image,
      });
    })
    .catch((error) => {
      console.log(error);
      res.status(500).json({
        success: false,
        message: "Failed to update the user's profile picture",
      });
    });
};

const updateUserProfile = async (req, res, next) => {
  const userId = req.user.id;
  const { username, email } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update the fields only if they are different from the existing values
    if (username && username !== "" && username !== user.username) {
      const existingUserWithUsername = await User.findOne({
        username: username,
      });
      if (existingUserWithUsername) {
        return res.status(400).json({ error: "Username is already taken" });
      }
      user.username = username;
    }
    if (email && email !== "" && email !== user.email) {
      const existingUserWithEmail = await User.findOne({ email: email });
      if (existingUserWithEmail) {
        return res.status(400).json({ error: "Email is already taken" });
      }
      user.email = email;
    }

    // Save the updated user
    const updatedUser = await user.save();

    res.json(updatedUser);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updatePassword,
  uploadImage,
  updateUserProfile,
};
