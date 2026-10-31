
import { Router, Request, Response } from "express";
import { pool } from "../config/db";

const router = Router();

// GET /api/species?nurseryId=1
router.get("/", async (req: Request, res: Response) => {
  try {
    const nurseryId = Number(req.query.nurseryId);

    if (!Number.isInteger(nurseryId) || nurseryId <= 0) {
      res.status(400).json({
        message: "A valid nurseryId is required",
      });
      return;
    }

    const result = await pool.query(
      `SELECT
         species_id,
         nursery_id,
         name,
         form,
         days_to_ready,
         watering_interval_days,
         description,
         is_active
       FROM species
       WHERE nursery_id = $1
       ORDER BY name`,
      [nurseryId]
    );

    res.json({
      count: result.rows.length,
      species: result.rows,
    });
  } catch (error) {
    console.error("Failed to fetch species:", error);
    res.status(500).json({
      message: "Failed to fetch species",
    });
  }
});

// POST /api/species
router.post("/", async (req: Request, res: Response) => {
  try {
    const {
      nursery_id,
      name,
      form,
      days_to_ready,
      watering_interval_days,
      description,
    } = req.body;

    if (
      !Number.isInteger(nursery_id) ||
      nursery_id <= 0 ||
      typeof name !== "string" ||
      !name.trim() ||
      typeof form !== "string" ||
      !form.trim() ||
      !Number.isInteger(days_to_ready) ||
      days_to_ready < 0 ||
      !Number.isInteger(watering_interval_days) ||
      watering_interval_days <= 0
    ) {
      res.status(400).json({
        message: "Please provide valid nursery, species, readiness and watering details",
      });
      return;
    }

    const result = await pool.query(
      `INSERT INTO species (
         nursery_id,
         name,
         form,
         days_to_ready,
         watering_interval_days,
         description
       )
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        nursery_id,
        name.trim(),
        form.trim(),
        days_to_ready,
        watering_interval_days,
        description ?? null,
      ]
    );

    res.status(201).json({
      message: "Species created successfully",
      species: result.rows[0],
    });
  } catch (error: any) {
    if (error.code === "23505") {
      res.status(409).json({
        message: "This species name and form already exist in the nursery",
      });
      return;
    }

    if (error.code === "23503") {
      res.status(400).json({
        message: "The specified nursery does not exist",
      });
      return;
    }

    console.error("Failed to create species:", error);
    res.status(500).json({
      message: "Failed to create species",
    });
  }
});

export default router;
