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

router.get("/", (req, res, next) => {
  console.log("GET request in places");
  res.json({ message: "It Works." });
});

router.get("/:placeId", (req, res, next) => {
  const placeId = req.params.placeId;
  const place = DUMMY_PLACES.find((p) => p.id === placeId);
  if (!place) {
    return res.status(404).json({ message: "Not found" });
  }
  res.json({ place });
});

router.get("/user/:userId", (req, res, next) => {
  const userId = req.params.userId;
  const places = DUMMY_PLACES.find((p) => p.creator === userId);

  if (!places) {
    return res.status(404).json({ message: "Not found" });
  }
  res.json(places);
});

module.exports = router;
