const loggedIn = (req, res, next) => {
  if (req.session.keks) {
    next();
  } else {
    res.status(400).json('You are not logged in. Please sign in');
  }
};

module.exports = loggedIn;
