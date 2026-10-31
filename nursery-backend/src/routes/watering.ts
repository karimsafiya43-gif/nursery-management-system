
import { Router, Request, Response } from "express";
import { pool } from "../config/db";

const router = Router();

// GET /api/watering?nurseryId=1
// GET /api/watering?nurseryId=1&batchId=1
router.get("/", async (req: Request, res: Response) => {
  try {
    const { nurseryId, batchId } = req.query;

    if (
      nurseryId !== undefined &&
      (typeof nurseryId !== "string" ||
        !/^[1-9]\d*$/.test(nurseryId))
    ) {
      return res.status(400).json({
        error: "nurseryId must be a positive integer",
      });
    }

    if (
      batchId !== undefined &&
      (typeof batchId !== "string" ||
        !/^[1-9]\d*$/.test(batchId))
    ) {
      return res.status(400).json({
        error: "batchId must be a positive integer",
      });
    }

    const conditions: string[] = [];
    const values: string[] = [];

    if (nurseryId !== undefined) {
      values.push(nurseryId as string);
      conditions.push(`w.nursery_id = $${values.length}`);
    }

    if (batchId !== undefined) {
      values.push(batchId as string);
      conditions.push(`w.batch_id = $${values.length}`);
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    const result = await pool.query(
      `SELECT
         w.watering_id,
         w.nursery_id,
         w.batch_id,
         b.batch_name,
         s.name AS species_name,
         w.staff_id,
         w.watered_at,
         w.quantity_litres,
         w.notes
       FROM watering_log w
       JOIN batch b
         ON b.nursery_id = w.nursery_id
        AND b.batch_id = w.batch_id
       JOIN species s
         ON s.nursery_id = b.nursery_id
        AND s.species_id = b.species_id
       ${whereClause}
       ORDER BY w.watered_at DESC`,
      values
    );

    return res.json({
      count: result.rows.length,
      wateringLogs: result.rows,
    });
  } catch (error) {
    console.error("Error fetching watering logs:", error);

    return res.status(500).json({
      error: "Failed to fetch watering logs",
    });
  }
});

// GET /api/watering/overdue?nurseryId=1
// Returns active batches whose next watering date has arrived.
router.get("/overdue", async (req: Request, res: Response) => {
  try {
    const nurseryId = Number(req.query.nurseryId);

    if (!Number.isSafeInteger(nurseryId) || nurseryId <= 0) {
      return res.status(400).json({
        error: "A valid nurseryId is required",
      });
    }

    const result = await pool.query(
      `
      WITH latest_watering AS (
        SELECT
          nursery_id,
          batch_id,
          MAX(watered_at AT TIME ZONE 'Asia/Kolkata')::date AS last_watered
        FROM watering_log
        WHERE nursery_id = $1
        GROUP BY nursery_id, batch_id
      )

      SELECT
        b.batch_id,
        b.batch_name AS name,
        lw.last_watered::text AS last_watered,

        (
          COALESCE(lw.last_watered, b.sow_date)
          + s.watering_interval_days
        )::text AS due_date,

        GREATEST(
          CURRENT_DATE -
          (
            COALESCE(lw.last_watered, b.sow_date)
            + s.watering_interval_days
          ),
          0
        )::integer AS days_overdue

      FROM batch b

      JOIN batch_stock bs
        ON bs.nursery_id = b.nursery_id
       AND bs.batch_id = b.batch_id

      JOIN species s
        ON s.nursery_id = b.nursery_id
       AND s.species_id = b.species_id

      LEFT JOIN latest_watering lw
        ON lw.nursery_id = b.nursery_id
       AND lw.batch_id = b.batch_id

      WHERE b.nursery_id = $1
        AND b.status = 'active'
        AND s.is_active = TRUE
        AND bs.current_stock > 0

        AND (
          COALESCE(lw.last_watered, b.sow_date)
          + s.watering_interval_days
        ) <= CURRENT_DATE

      ORDER BY due_date ASC, b.batch_id ASC
      `,
      [nurseryId]
    );

    return res.json({
      count: result.rows.length,
      overdueBatches: result.rows,
    });

  } catch (error) {
    console.error("Error calculating overdue watering:", error);

    return res.status(500).json({
      error: "Failed to calculate overdue watering",
    });
  }
});

// GET /api/watering/:id
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const id  = req.params.id;

    if (typeof id !== "string" || !/^[1-9]\d*$/.test(id)) {
  return res.status(400).json({
    error: "Invalid watering ID"
  });
}

    const result = await pool.query(
      `SELECT
         w.watering_id,
         w.nursery_id,
         w.batch_id,
         b.batch_name,
         s.name AS species_name,
         w.staff_id,
         w.watered_at,
         w.quantity_litres,
         w.notes
       FROM watering_log w
       JOIN batch b
         ON b.nursery_id = w.nursery_id
        AND b.batch_id = w.batch_id
       JOIN species s
         ON s.nursery_id = b.nursery_id
        AND s.species_id = b.species_id
       WHERE w.watering_id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Watering record not found",
      });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching watering record:", error);

    return res.status(500).json({
      error: "Failed to fetch watering record",
    });
  }
});

// POST /api/watering
router.post("/", async (req: Request, res: Response) => {
  try {
    const {
      nurseryId,
      batchId,
      staffId,
      wateredAt,
      quantityLitres,
      notes,
    } = req.body;

    // Required IDs
    if (
      !Number.isSafeInteger(nurseryId) ||
      nurseryId <= 0 ||
      !Number.isSafeInteger(batchId) ||
      batchId <= 0
    ) {
      return res.status(400).json({
        error: "nurseryId and batchId must be positive integer numbers",
      });
    }

    // Optional staff ID
    if (
      staffId !== undefined &&
      staffId !== null &&
      (!Number.isSafeInteger(staffId) || staffId <= 0)
    ) {
      return res.status(400).json({
        error: "staffId must be a positive integer or null",
      });
    }

    // Optional water quantity
    if (
      quantityLitres !== undefined &&
      quantityLitres !== null &&
      (
        typeof quantityLitres !== "number" ||
        !Number.isFinite(quantityLitres) ||
        quantityLitres <= 0 ||
        quantityLitres > 99999999.99
      )
    ) {
      return res.status(400).json({
        error: "quantityLitres must be a positive number within the database limit",
      });
    }

    // Optional timestamp
    if (wateredAt !== undefined) {
      if (
        typeof wateredAt !== "string" ||
        wateredAt.trim() === "" ||
        Number.isNaN(Date.parse(wateredAt))
      ) {
        return res.status(400).json({
          error: "wateredAt must be a valid date/time string",
        });
      }
    }

    // Optional notes
    if (
      notes !== undefined &&
      notes !== null &&
      typeof notes !== "string"
    ) {
      return res.status(400).json({
        error: "notes must be a string or null",
      });
    }

    const result = await pool.query(
      `INSERT INTO watering_log (
         nursery_id,
         batch_id,
         staff_id,
         watered_at,
         quantity_litres,
         notes
       )
       VALUES (
         $1,
         $2,
         $3,
         COALESCE($4::timestamptz, CURRENT_TIMESTAMP),
         $5,
         $6
       )
       RETURNING *`,
      [
        nurseryId,
        batchId,
        staffId ?? null,
        wateredAt ?? null,
        quantityLitres ?? null,
        notes ?? null,
      ]
    );

    return res.status(201).json({
      message: "Watering record created successfully",
      wateringLog: result.rows[0],
    });
  } catch (error: any) {
    console.error("Error creating watering record:", error);

    if (error.code === "23503") {
      return res.status(400).json({
        error: "Invalid nursery, batch, or staff ID",
        details: error.constraint,
      });
    }

    if (error.code === "23514") {
      return res.status(400).json({
        error: "Water quantity violates a database constraint",
      });
    }

    return res.status(500).json({
      error: "Failed to create watering record",
    });
  }
});

export default router;
