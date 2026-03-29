require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { connectDB } = require("./src/config/db");
const errorHandler = require("./src/middleware/errorHandler");

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Routes
app.use("/api/auth", require("./src/routes/auth.routes"));
app.use("/api/profile", require("./src/routes/profile.routes"));
app.use("/api/dashboard", require("./src/routes/dashboard.routes"));
app.use("/api/recovery", require("./src/routes/recovery.routes"));
app.use("/api/challenges", require("./src/routes/challenge.routes"));
app.use("/api/community", require("./src/routes/community.routes"));
app.use("/api/diet", require("./src/routes/diet.routes"));
app.use("/api/coping", require("./src/routes/coping.routes"));
app.use("/api/acquaintance", require("./src/routes/acquaintance.routes"));

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const { startDietCron } = require("./src/jobs/dietCron");
const { startChallengeCron } = require("./src/jobs/challengeCron");
const { startRecoveryCron } = require("./src/jobs/recoveryCron");
const { seedChallenges } = require("./src/jobs/challengeSeeder");
const { seedGroups } = require("./src/jobs/groupSeeder");

connectDB().then(async () => {
  await seedChallenges();
  await seedGroups();
  startDietCron();
  startChallengeCron();
  startRecoveryCron();
  app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
  });
});
