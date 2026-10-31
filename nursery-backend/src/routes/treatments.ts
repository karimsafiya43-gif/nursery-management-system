
import { Router, Request, Response } from "express";
import { pool } from "../config/db";

const router = Router();

const validStatuses = ["planned", "in_progress", "completed"];

// GET all treatments for a nursery
// Optional filter: ?observationId=1
router.get("/", async (req: Request, res: Response) => {
  try {
    const nurseryId = Number(req.query.nurseryId);
    const observationId = req.query.observationId
      ? Number(req.query.observationId)
      : undefined;

    if (!Number.isInteger(nurseryId) || nurseryId <= 0) {
      return res.status(400).json({
        message: "A valid nurseryId is required",
      });
    }

    if (
      observationId !== undefined &&
      (!Number.isInteger(observationId) || observationId <= 0)
    ) {
      return res.status(400).json({
        message: "observationId must be a positive integer",
      });
    }

    const values: number[] = [nurseryId];

    let query = `
      SELECT
        t.*,
        o.batch_id,
        b.batch_name,
        i.name AS issue_name
      FROM treatment_log t
      JOIN observation o
        ON o.nursery_id = t.nursery_id
       AND o.observation_id = t.observation_id
      JOIN batch b
        ON b.nursery_id = o.nursery_id
       AND b.batch_id = o.batch_id
      LEFT JOIN issue i
        ON i.nursery_id = t.nursery_id
       AND i.issue_id = t.issue_id
      WHERE t.nursery_id = $1
    `;

    if (observationId !== undefined) {
      values.push(observationId);
      query += ` AND t.observation_id = $2`;
    }

    query += ` ORDER BY t.treatment_date DESC, t.treatment_id DESC`;

    const result = await pool.query(query, values);

    return res.json({
      count: result.rowCount,
      treatments: result.rows,
    });
  } catch (error) {
    console.error("Error fetching treatments:", error);

    return res.status(500).json({
      message: "Failed to fetch treatments",
    });
  }
});

// GET one treatment by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const nurseryId = Number(req.query.nurseryId);
    const treatmentId = Number(req.params.id);

    if (
      !Number.isInteger(nurseryId) ||
      nurseryId <= 0 ||
      !Number.isInteger(treatmentId) ||
      treatmentId <= 0
    ) {
      return res.status(400).json({
        message: "Valid nurseryId and treatment ID are required",
      });
    }

    const result = await pool.query(
      `
      SELECT
        t.*,
        o.batch_id,
        b.batch_name,
        i.name AS issue_name
      FROM treatment_log t
      JOIN observation o
        ON o.nursery_id = t.nursery_id
       AND o.observation_id = t.observation_id
      JOIN batch b
        ON b.nursery_id = o.nursery_id
       AND b.batch_id = o.batch_id
      LEFT JOIN issue i
        ON i.nursery_id = t.nursery_id
       AND i.issue_id = t.issue_id
      WHERE t.nursery_id = $1
        AND t.treatment_id = $2
      `,
      [nurseryId, treatmentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Treatment not found",
      });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching treatment:", error);

    return res.status(500).json({
      message: "Failed to fetch treatment",
    });
  }
});

// POST a new treatment
router.post("/", async (req: Request, res: Response) => {
  try {
    const {
      nurseryId,
      observationId,
      issueId,
      staffId,
      treatmentName,
      treatmentDate,
      status = "in_progress",
      notes,
    } = req.body;

    if (
      !Number.isInteger(nurseryId) ||
      nurseryId <= 0 ||
      !Number.isInteger(observationId) ||
      observationId <= 0
    ) {
      return res.status(400).json({
        message: "Valid nurseryId and observationId are required",
      });
    }

    if (
      typeof treatmentName !== "string" ||
      treatmentName.trim().length === 0 ||
      treatmentName.trim().length > 150
    ) {
      return res.status(400).json({
        message: "treatmentName must contain 1–150 characters",
      });
    }

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: "status must be planned, in_progress, or completed",
      });
    }

    if (
      issueId !== undefined &&
      issueId !== null &&
      (!Number.isInteger(issueId) || issueId <= 0)
    ) {
      return res.status(400).json({
        message: "issueId must be a positive integer",
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
      treatmentDate !== undefined &&
      (typeof treatmentDate !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(treatmentDate) ||
        Number.isNaN(Date.parse(treatmentDate)))
    ) {
      return res.status(400).json({
        message: "treatmentDate must use YYYY-MM-DD format",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO treatment_log (
        nursery_id,
        observation_id,
        issue_id,
        staff_id,
        treatment_name,
        treatment_date,
        status,
        notes
      )
      VALUES (
        $1, $2, $3, $4, $5,
        COALESCE($6::date, CURRENT_DATE),
        $7, $8
      )
      RETURNING *
      `,
      [
        nurseryId,
        observationId,
        issueId ?? null,
        staffId ?? null,
        treatmentName.trim(),
        treatmentDate ?? null,
        status,
        notes ?? null,
      ]
    );

    return res.status(201).json({
      message: "Treatment recorded successfully",
      treatment: result.rows[0],
    });
  } catch (error: any) {
    console.error("Error recording treatment:", error);

    if (error.code === "23503") {
      return res.status(400).json({
        message:
          "Nursery, observation, issue, or staff record does not exist",
      });
    }

    if (error.code === "23514") {
      return res.status(400).json({
        message: "Invalid treatment status or other constraint violation",
      });
    }

    return res.status(500).json({
      message: "Failed to record treatment",
    });
  }
});

export default router;
