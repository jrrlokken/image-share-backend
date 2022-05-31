const mongoose = require("mongoose");
const { validationResult } = require("express-validator");
const fs = require("fs");

const HttpError = require("../models/http-error");
const getCoordsForAddress = require("../util/location");
const Place = require("../models/place");
const User = require("../models/user");

const getPlaces = async (req, res, next) => {
  let places;
  try {
    places = await Place.find();
  } catch (err) {
    const error = new HttpError("No places found", 404);
    return next(error);
  }

  res.json({ places: places.map((p) => p.toObject({ getters: true })) });
};

const getPlaceById = async (req, res, next) => {
  const placeId = req.params.placeId;
  let place;

  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError("Operation failed, please try again", 500);
    return next(error);
  }

  if (!place) {
    const error = new HttpError("Not found", 404);
    return next(error);
  }
  res.json({ place: place.toObject({ getters: true }) });
};

const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.userId;

  let userWithPlaces;
  try {
    userWithPlaces = await User.findById(userId).populate("places");
  } catch (err) {
    const error = new HttpError("Operation failed, please try again", 500);
    return next(error);
  }

  if (!userWithPlaces || userWithPlaces.places.length === 0) {
    return next(new HttpError("Resource not found", 404));
  }
  res.json({
    places: userWithPlaces.places.map((p) => p.toObject({ getters: true })),
  });
};

const createPlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError("Invalid input", 422));
  }

  const { title, description, address } = req.body;

  let coordinates;

  try {
    coordinates = await getCoordsForAddress(address);
  } catch (err) {
    const error = new HttpError("Unable to fetch coordinates", 500);
    return next(error);
  }

  const createdPlace = new Place({
    title,
    description,
    image: req.file.path,
    address,
    location: coordinates,
    creator: req.userData.userId,
  });

  console.log(createdPlace);

  let user;
  try {
    user = await User.findById(req.userData.userId);
    console.log(user);
  } catch (err) {
    const error = new HttpError("Operation failed", 500);
    return next(error);
  }

  if (!user) {
    const error = new HttpError("User not found", 404);
    return next(error);
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdPlace.save({ session: sess });
    user.places.push(createdPlace);
    await user.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError("Creating place failed, please try again", 500);
    return next(error);
  }

  res.status(201).json({ place: createdPlace });
};

const updatePlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    return next(new HttpError("Invalid input", 422));
  }
  const { title, description } = req.body;
  const placeId = req.params.placeId;

  let updatedPlace;
  try {
    updatedPlace = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError("Error fetching place", 500);
    return next(error);
  }

  if (updatedPlace.creator.toString() !== req.userData.userId) {
    const error = new HttpError("Unauthorized. Access Denied", 401);
    return next(error);
  }

  updatedPlace.title = title;
  updatedPlace.description = description;

  try {
    await updatedPlace.save();
  } catch (err) {
    const error = new HttpError("Updating place failed, please try again", 500);
    return next(error);
  }
  res.status(200).json({ place: updatedPlace.toObject({ getters: true }) });
};

const deletePlace = async (req, res, next) => {
  const placeId = req.params.placeId;

  let place;
  try {
    place = await Place.findById(placeId).populate("creator");
  } catch (err) {
    const error = new HttpError("Error fetching place", 500);
    return next(error);
  }

  if (!place) {
    return next(new HttpError("Not found", 404));
  }

  if (place.creator.id !== req.userData.userId) {
    const error = new HttpError("Unauthorized. Access Denied", 401);
    return next(error);
  }

  const imagePath = place.image;

  try {
    const session = await mongoose.startSession();
    session.startTransaction();
    await place.remove({ session: session });
    place.creator.places.pull(place);
    await place.creator.save({ session: session });
    await session.commitTransaction();
  } catch (err) {
    const error = new HttpError("Operation failed, please try again", 500);
    return next(error);
  }

  fs.unlink(imagePath, (err) => console.log(err));

  res.status(200).json({ message: "Deleted", data: place });
};

exports.getPlaces = getPlaces;
exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
