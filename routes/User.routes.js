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
        errorMessage: 'Something went wrong! Go to sleep!',
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
      res.status(200).json(user);
    } else {
      errors.password = 'You entered a wrong Password';
      res.status(500).json(errors);
      return;
    }
  } catch (err) {
    res.status(500).json({
      errorMessage: 'Something went wrong! Go to sleep!',
      message: err,
    });
  }
});

module.exports = router;
