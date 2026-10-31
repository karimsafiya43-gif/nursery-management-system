
import { Router, Request, Response } from "express";
import { pool } from "../config/db";

const router = Router();

// GET /api/batches
// Return all batches for a nursery
router.get("/", async (req: Request, res: Response) => {
  try {
    const nurseryId = Number(req.query.nurseryId);

    if (!Number.isInteger(nurseryId) || nurseryId <= 0) {
      res.status(400).json({
        message: "A valid nurseryId query parameter is required",
      });
      return;
    }

    const result = await pool.query(
      `SELECT
         bs.nursery_id,
         bs.batch_id,
         bs.batch_name,
         s.name AS species_name,
         bs.sow_date,
         bs.initial_quantity,
         bs.total_lost,
         bs.total_sold,
         bs.current_stock,
         b.status
       FROM batch_stock bs
       JOIN batch b
         ON b.nursery_id = bs.nursery_id
        AND b.batch_id = bs.batch_id
       JOIN species s
         ON s.nursery_id = b.nursery_id
        AND s.species_id = b.species_id
       WHERE bs.nursery_id = $1
       ORDER BY bs.batch_id`,
      [nurseryId]
    );

    res.json({
      count: result.rowCount ?? result.rows.length,
      batches: result.rows,
    });
  } catch (error) {
    console.error("Failed to fetch batches:", error);
    res.status(500).json({
      message: "Failed to fetch batches",
    });
  }
});

export default router;
