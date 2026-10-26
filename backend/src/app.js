require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");

const { notFoundHandler, errorHandler } = require("./middleware/errorMiddleware");

const clubRoutes = require("./routes/clubRoutes");
const playerRoutes = require("./routes/playerRoutes");
const positionRoutes = require("./routes/positionRoutes");
const coachRoutes = require("./routes/coachRoutes");
const roleRoutes = require("./routes/roleRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/images", express.static(path.join(__dirname, "..", "public", "images")));

app.get("/api", (req, res) => {
  res.status(200).json({
    success: true,
    message: "FC Barcelona Squad Information System API",
    endpoints: {
      clubs: "/api/clubs",
      players: "/api/players",
      positions: "/api/positions",
      coaches: "/api/coaches",
      roles: "/api/roles"
    }
  });
});

app.use("/api/clubs", clubRoutes);
app.use("/api/players", playerRoutes);
app.use("/api/positions", positionRoutes);
app.use("/api/coaches", coachRoutes);
app.use("/api/roles", roleRoutes);

app.use(notFoundHandler);

app.use(errorHandler);

module.exports = app;
