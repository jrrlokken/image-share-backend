const { validationResult } = require("express-validator");

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

  const newUser = new User({
    name,
    email,
    password,
    image: "https://randomuser.me/api/portraits/women/53.jpg",
    places: [],
  });

  try {
    await newUser.save();
  } catch (err) {
    const error = new HttpError("Database operation failed", 500);
    return next(error);
  }

  res.status(201).json({ user: newUser.toObject({ getters: true }) });
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

  if (!existingUser || existingUser.password !== password) {
    return next(new HttpError("Authentication failed", 401));
  }

  res.json({ message: "Logged In" });
};
