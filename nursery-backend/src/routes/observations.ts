
import { Router, Request, Response } from "express";
import { pool } from "../config/db";

const router = Router();

// GET all observations for a nursery
// Optional filter: ?batchId=1
router.get("/", async (req: Request, res: Response) => {
  try {
    const nurseryId = Number(req.query.nurseryId);
    const batchId = req.query.batchId
      ? Number(req.query.batchId)
      : undefined;

    if (!Number.isInteger(nurseryId) || nurseryId <= 0) {
      return res.status(400).json({
        message: "A valid nurseryId is required",
      });
    }

    if (
      batchId !== undefined &&
      (!Number.isInteger(batchId) || batchId <= 0)
    ) {
      return res.status(400).json({
        message: "batchId must be a positive integer",
      });
    }

    const values: number[] = [nurseryId];

    let query = `
      SELECT
        o.observation_id,
        o.nursery_id,
        o.batch_id,
        b.batch_name,
        s.name AS species_name,
        o.staff_id,
        o.observed_at,
        o.health_status,
        o.plants_lost,
        o.notes
      FROM observation o
      JOIN batch b
        ON b.nursery_id = o.nursery_id
       AND b.batch_id = o.batch_id
      JOIN species s
        ON s.nursery_id = b.nursery_id
       AND s.species_id = b.species_id
      WHERE o.nursery_id = $1
    `;

    if (batchId !== undefined) {
      values.push(batchId);
      query += ` AND o.batch_id = $2`;
    }

    query += ` ORDER BY o.observed_at DESC`;

    const result = await pool.query(query, values);

    return res.json({
      count: result.rowCount,
      observations: result.rows,
    });
  } catch (error) {
    console.error("Error fetching observations:", error);

    return res.status(500).json({
      message: "Failed to fetch observations",
    });
  }
});

// GET one observation by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const nurseryId = Number(req.query.nurseryId);
    const observationId = Number(req.params.id);

    if (
      !Number.isInteger(nurseryId) ||
      nurseryId <= 0 ||
      !Number.isInteger(observationId) ||
      observationId <= 0
    ) {
      return res.status(400).json({
        message: "Valid nurseryId and observation ID are required",
      });
    }

    const result = await pool.query(
      `
      SELECT
        o.*,
        b.batch_name,
        s.name AS species_name
      FROM observation o
      JOIN batch b
        ON b.nursery_id = o.nursery_id
       AND b.batch_id = o.batch_id
      JOIN species s
        ON s.nursery_id = b.nursery_id
       AND s.species_id = b.species_id
      WHERE o.nursery_id = $1
        AND o.observation_id = $2
      `,
      [nurseryId, observationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Observation not found",
      });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching observation:", error);

    return res.status(500).json({
      message: "Failed to fetch observation",
    });
  }
});

// POST a new observation
router.post("/", async (req: Request, res: Response) => {
  try {
    const {
      nurseryId,
      batchId,
      staffId,
      observedAt,
      healthStatus,
      plantsLost = 0,
      notes,
    } = req.body;

    if (
      !Number.isInteger(nurseryId) ||
      nurseryId <= 0 ||
      !Number.isInteger(batchId) ||
      batchId <= 0
    ) {
      return res.status(400).json({
        message: "Valid nurseryId and batchId are required",
      });
    }

    if (
      !["healthy", "unhealthy", "recovering"].includes(healthStatus)
    ) {
      return res.status(400).json({
        message:
          "healthStatus must be healthy, unhealthy, or recovering",
      });
    }

    if (!Number.isInteger(plantsLost) || plantsLost < 0) {
      return res.status(400).json({
        message: "plantsLost must be a non-negative integer",
      });
    }

    if (
      staffId !== undefined &&
      staffId !== null &&
      (!Number.isInteger(staffId) || staffId <= 0)
    ) {
      return res.status(400).json({
        message: "staffId must be a positive integer",
      });
    }

    if (
      observedAt !== undefined &&
      (typeof observedAt !== "string" ||
        Number.isNaN(Date.parse(observedAt)))
    ) {
      return res.status(400).json({
        message: "observedAt must be a valid date/time string",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO observation (
        nursery_id,
        batch_id,
        staff_id,
        observed_at,
        health_status,
        plants_lost,
        notes
      )
      VALUES (
        $1, $2, $3,
        COALESCE($4::timestamptz, CURRENT_TIMESTAMP),
        $5, $6, $7
      )
      RETURNING *
      `,
      [
        nurseryId,
        batchId,
        staffId ?? null,
        observedAt ?? null,
        healthStatus,
        plantsLost,
        notes ?? null,
      ]
    );

    return res.status(201).json({
      message: "Observation recorded successfully",
      observation: result.rows[0],
    });
  } catch (error: any) {
    console.error("Error recording observation:", error);

    // PostgreSQL trigger: plant loss cannot exceed available stock
    if (error.code === "P0001") {
      return res.status(400).json({
        message: error.message,
      });
    }

    if (error.code === "23503") {
      return res.status(400).json({
        message: "Nursery, batch, or staff does not exist",
      });
    }

    return res.status(500).json({
      message: "Failed to record observation",
    });
  }
});

export default router;

