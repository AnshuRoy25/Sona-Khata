import express from "express";
import cors from "cors";
import registerRoutes from "./routes/register.js";
import loginRoutes from "./routes/login.js";
import orderRoutes from "./routes/orders.js";
import transactionRoutes from "./routes/transactions.js";
import voiceRoutes from "./routes/voice.js";
import agentRoutes from "./routes/agentRoutes.js";
import userRoutes from "./routes/user.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date() });
});

app.use("/api/auth/register", registerRoutes);
app.use("/api/auth/login", loginRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/voice", voiceRoutes);
app.use("/api/agent", agentRoutes);
app.use("/api/user", userRoutes);


app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

export default app;