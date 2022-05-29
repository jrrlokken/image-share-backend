const { v4: uuidv4 } = require("uuid");
const { validationResult } = require("express-validator");

const HttpError = require("../models/http-error");

const DUMMY_USERS = [
  {
    id: "u1",
    name: "Jim Gray",
    email: "jgray@example.com",
    password: "password",
  },
  {
    id: "u2",
    name: "Earl Gray",
    email: "egray@example.com",
    password: "password",
  },
];

exports.getUsers = (req, res, next) => {
  res.json({ users: DUMMY_USERS });
};

exports.signup = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new HttpError("Invalid input", 422);
  }
  const { name, email, password } = req.body;
  const newUser = {
    id: uuidv4(),
    name,
    email,
    password,
  };

  const hasUser = DUMMY_USERS.find((u) => u.email === email);

  if (hasUser) {
    throw new HttpError("User account exists already", 422);
  }

  DUMMY_USERS.push(newUser);
  res.status(201).json({ user: newUser });
};

exports.login = (req, res, next) => {
  const { email, password } = req.body;
  const user = DUMMY_USERS.find((u) => u.email === email);
  if (!user || user.password !== password) {
    throw new HttpError("Authentication failed", 401);
  }
  res.json({ message: "Logged In" });
};
