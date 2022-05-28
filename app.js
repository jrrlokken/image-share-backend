const express = require("express");
const bodyParser = require("body-parser");

const placesRoutes = require("./routes/places-routes");
const userRoutes = require("./routes/users-routes");

const PORT = process.env.PORT || 5000;

const app = express();

app.use("/api/places", placesRoutes);
app.use("/api/user", userRoutes);

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
