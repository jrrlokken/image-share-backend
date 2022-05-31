const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const HttpError = require("../models/http-error");
const User = require("../models/user");

exports.getUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find({}, "-password");
  } catch (err) {
    const error = new HttpError("Unable to fetch resource", 500);
    return next(error);
  }
  res.json({ users: users.map((u) => u.toObject({ getters: true })) });
};

exports.signup = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(new HttpError("Invalid input", 422));
  }
  const { name, email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError("Operation failed", 500);
    return next(error);
  }

  if (existingUser) {
    const error = new HttpError("User account exists", 422);
    return next(error);
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 10);
  } catch (err) {
    const error = new HttpError("Could not create user, please try again", 500);
    return next(error);
  }

  const newUser = new User({
    name,
    email,
    password: hashedPassword,
    image: req.file.path,
    places: [],
  });

  try {
    await newUser.save();
  } catch (err) {
    const error = new HttpError("Database operation failed", 500);
    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
  } catch (err) {
    const error = new HttpError("Database operation failed", 500);
    return next(error);
  }

  res
    .status(201)
    .json({ userId: newUser.id, email: newUser.email, token: token });
};

exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError("Operation failed", 500);
    return next(error);
  }

  if (!existingUser) {
    return next(new HttpError("Authentication failed", 401));
  }

  let isValidPassword = false;

  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (err) {
    return next(new HttpError("Operation failed, please try again", 500));
  }

  if (!isValidPassword) {
    return next(new HttpError("Authentication failed", 401));
  }

  let token;
  try {
    token = jwt.sign(
      { userId: existingUser.id, email: existingUser.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
  } catch (err) {
    const error = new HttpError("Database operation failed", 500);
    return next(error);
  }

  res.json({
    userId: existingUser.id,
    email: existingUser.email,
    token: token,
  });
};
