const router = require('express').Router();
const bcrypt = require('bcryptjs');

const User = require('../models/User.model');
const List = require('../models/List.model');
const loggedIn = require('../middleware/loggedIn');
const {
  validateRegisterInput,
  validateLoginInput,
  validateEditInput,
} = require('../utilities/validators');

// FE ✅
router.post('/signup', async (req, res) => {
  const { username, email, password, confirmPassword } = req.body;

  const { notValid, errors } = validateRegisterInput(
    username,
    email,
    password,
    confirmPassword
  );

  if (notValid) {
    res.status(400).json(errors);
    return;
  }

  const salt = bcrypt.genSaltSync(12);
  const hash = bcrypt.hashSync(password, salt);

  try {
    let user = await User.create({
      username,
      email,
      password: hash,
    });

    let list = await List.create({ title: 'owned', user: user._id });

    user = await User.findByIdAndUpdate(
      user._id,
      { $push: { lists: list._id } },
      { new: true }
    ).populate('lastAdded');

    user.password = '***';
    req.session.keks = user;
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

      res.status(400).json(error);
    } else {
      res.status(400).json({
        errorMessage: 'oops power failure',
        message: err,
      });
    }
  }
});

// FE ✅
router.post('/signin', async (req, res) => {
  const { userInput, password } = req.body;

  const { notValid, errors } = validateLoginInput(userInput, password);

  if (notValid) {
    res.status(400).json(errors);
    return;
  }

  try {
    const user = await User.findOne({
      $or: [{ username: userInput }, { email: userInput }],
    }).populate('lastAdded');

    if (!user) {
      errors.username = 'User not found';
      res.status(400).json(errors);
      return;
    }

    const checkPW = bcrypt.compareSync(password, user.password);

    if (checkPW) {
      user.password = '***';
      req.session.keks = user;
      res.status(200).json(user);
      return;
    } else {
      errors.password = 'You entered a wrong Password';
      res.status(400).json(errors);
      return;
    }
  } catch (err) {
    res.status(400).json({
      errorMessage: 'oops power failure',
      message: err,
    });
  }
});

// FE ✅
router.post('/logout', loggedIn, (req, res) => {
  req.session.destroy();
  res.status(204).json({});
});

// FE ✅
router.get('/user/', loggedIn, (req, res) => {
  res.status(200).json(req.session.keks);
});

router.delete('/user/delete', loggedIn, async (req, res) => {
  const { _id } = req.session.keks;
  const { confirmPassword } = req.body;
  const errors = {};

  try {
    const user = await User.findById(_id);

    const checkPW = bcrypt.compareSync(confirmPassword, user.password);

    if (!checkPW) {
      errors.password = 'You have entered an incorrect password';
      res.status(400).json(errors);
      return;
    }

    await User.findByIdAndDelete(_id);
    req.session.destroy();
    res.status(204).json({});
  } catch (err) {
    res.status(400).json({
      errorMessage: 'oops power failure',
      message: err,
    });
  }
});

// FE ✅
router.patch('/user/edit', loggedIn, async (req, res) => {
  const { _id } = req.session.keks;
  let { username, email, password, confirmPassword, currentPassword } =
    req.body;

  try {
    const user = await User.findById(_id);
    const checkPW = bcrypt.compareSync(currentPassword, user.password);
    if (!checkPW) {
      const errors = {};
      errors.currentPassword = 'You have entered an incorrect password';
      res.status(400).json(errors);
      return;
    }

    if (!username) {
      username = user.username;
    }

    if (!email) {
      email = user.email;
    }
    if (password !== confirmPassword) {
      const errors = {};
      errors.newPassword = 'Your passwords does not match';
      res.status(400).json(errors);
      return;
    }
    if (!password) {
      password = currentPassword;
      confirmPassword = currentPassword;
    }

    const { notValid, errors } = validateEditInput(
      username,
      email,
      password,
      confirmPassword
    );

    if (notValid) {
      res.status(400).json(errors);
      return;
    }

    const salt = bcrypt.genSaltSync(12);
    const hash = bcrypt.hashSync(password, salt);

    const updatedUser = await User.findByIdAndUpdate(
      _id,
      {
        username,
        email,
        password: hash,
      },
      { runValidators: true, new: true }
    ).populate('lastAdded');
    updatedUser.password = '***';
    req.session.keks = updatedUser;
    res.status(200).json(updatedUser);
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

module.exports = router;
