const router = require('express').Router();
const bcrypt = require('bcryptjs');

const User = require('../models/User.model');
const {
  validateRegisterInput,
  validateLoginInput,
} = require('../utilities/validators');

router.post('/signup', async (req, res) => {
  const { username, email, password, confirmPassword } = req.body;

  const { notValid, errors } = validateRegisterInput(
    username,
    email,
    password,
    confirmPassword
  );

  if (notValid) {
    res.status(500).json(errors);
    return;
  }

  const salt = bcrypt.genSaltSync(12);
  const hash = bcrypt.hashSync(password, salt);

  try {
    const user = await User.create({ username, email, password: hash });
    user.passwordHash = '***';
    res.status(200).json(user);
  } catch (err) {
    let error = {};

    if (err.code === 11000) {
      // Error Pointing
      if (Object.keys(err.keyValue)[0] === 'username') {
        error[
          Object.keys(err.keyValue)[0]
        ] = `Username ${err.keyValue.username} already exists!`;
        error.message = err;
      } else {
        error[
          Object.keys(err.keyValue)[0]
        ] = `E-Mail ${err.keyValue.email} already exists!`;
        error.message = err;
      }

      res.status(500).json(error);
    } else {
      res.status(500).json({
        errorMessage: 'oops power failure',
        message: err,
      });
    }
  }
});

router.post('/signin', async (req, res) => {
  const { userInput, password } = req.body;

  const { notValid, errors } = validateLoginInput(userInput, password);

  if (notValid) {
    res.status(500).json(errors);
    return;
  }

  try {
    const user = await User.findOne({
      $or: [{ username: userInput }, { email: userInput }],
    });

    if (!user) {
      errors.username = 'User not found';
      res.status(500).json(errors);
      return;
    }

    const checkPW = bcrypt.compareSync(password, user.password);

    if (checkPW) {
      user.password = '***';
      req.session.userInfo = user;
      res.status(200).json(user);
      return;
    } else {
      errors.password = 'You entered a wrong Password';
      res.status(500).json(errors);
      return;
    }
  } catch (err) {
    res.status(500).json({
      errorMessage: 'oops power failure',
      message: err,
    });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy();
  res.status(204).json({});
});

router.delete('/profile/:username/delete', async (req, res) => {
  // const { _id } = req.session.keks;
  const { _id, confirmPassword } = req.body;
  const errors = {};

  try {
    const user = await User.findById(_id);

    const checkPW = bcrypt.compareSync(confirmPassword, user.password);

    if (!checkPW) {
      errors.password = 'You have entered an incorrect password';
      res.status(500).json(errors);
      return;
    }
    await User.findByIdAndDelete(_id);
    req.session.destroy();
    res.status(204).json({});
  } catch (err) {
    res.status(500).json({
      errorMessage: 'oops power failure',
      message: err,
    });
  }
});

module.exports = router;
