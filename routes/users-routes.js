const express = require("express");

const router = express.Router();

const DUMMY_PLACES = [
  {
    id: "p1",
    title: "Our House",
    description: "Is a very, very, very fine house",
    location: {
      lat: 47.4574985,
      lng: -94.8468996,
    },
    address: "1624 4th ST SE, Bemidji, MN 56601",
    creator: "u1",
  },
];

module.exports = router;
