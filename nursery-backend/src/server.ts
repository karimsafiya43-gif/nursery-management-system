import staffRoutes from "./routes/staff";
import expenseRoutes from "./routes/expenses";
import saleItemRoutes from "./routes/saleItems";
import salesRoutes from "./routes/sales";
import customerRoutes from "./routes/customers";
import issueRoutes from "./routes/issues";
import treatmentRoutes from "./routes/treatments";
import observationRoutes from "./routes/observations";
import wateringRoutes from "./routes/watering";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { pool } from "./config/db";
import speciesRoutes from "./routes/species";
import batchRoutes from "./routes/batches";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/species", speciesRoutes);
app.use("/api/batches", batchRoutes);
app.use("/api/watering", wateringRoutes);
app.use("/api/observations", observationRoutes);
app.use("/api/treatments", treatmentRoutes);
app.use("/api/issues", issueRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/sales", saleItemRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/staff", staffRoutes);
app.get("/", (_req, res) => {
  res.json({
    message: "Plant Nursery Management API is running",
  });
});

app.get("/api/health", async (_req, res) => {
  try {
    const result = await pool.query(
      "SELECT current_database() AS database, NOW() AS server_time"
    );

    res.json({
      status: "ok",
      message: "Backend connected to PostgreSQL successfully",
      database: result.rows[0].database,
      serverTime: result.rows[0].server_time,
    });
  } catch (error) {
    console.error("Database health check failed:", error);

    res.status(500).json({
      status: "error",
      message: "Could not connect to PostgreSQL",
    });
  }
});

const port = Number(process.env.PORT || 5000);

app.listen(port, "0.0.0.0", () => {
  console.log(`Nursery API running on port ${port}`);
});
