
import { Router, Request, Response } from "express";
import { pool } from "../config/db";

const router = Router();

// GET all items belonging to a sale
router.get("/:saleId/items", async (req: Request, res: Response) => {
  try {
    const nurseryId = Number(req.query.nurseryId);
    const saleId = Number(req.params.saleId);

    if (
      !Number.isInteger(nurseryId) || nurseryId <= 0 ||
      !Number.isInteger(saleId) || saleId <= 0
    ) {
      return res.status(400).json({
        message: "Valid nurseryId and saleId are required",
      });
    }

    const result = await pool.query(
      `
      SELECT
        si.sale_item_id,
        si.sale_id,
        si.batch_id,
        b.batch_name,
        sp.name AS species_name,
        si.quantity,
        si.unit_price,
        (si.quantity * si.unit_price)::numeric(12,2) AS subtotal
      FROM sale_item si
      JOIN batch b
        ON b.nursery_id = si.nursery_id
       AND b.batch_id = si.batch_id
      JOIN species sp
        ON sp.nursery_id = b.nursery_id
       AND sp.species_id = b.species_id
      WHERE si.nursery_id = $1 AND si.sale_id = $2
      ORDER BY si.sale_item_id
      `,
      [nurseryId, saleId]
    );

    return res.json({
      count: result.rowCount,
      items: result.rows,
    });
  } catch (error) {
    console.error("Error fetching sale items:", error);

    return res.status(500).json({
      message: "Failed to fetch sale items",
    });
  }
});

// POST a plant batch into a sale
router.post("/:saleId/items", async (req: Request, res: Response) => {
  try {
    const nurseryId = Number(req.body.nurseryId);
    const saleId = Number(req.params.saleId);
    const { batchId, quantity, unitPrice } = req.body;

    if (
      !Number.isInteger(nurseryId) || nurseryId <= 0 ||
      !Number.isInteger(saleId) || saleId <= 0 ||
      !Number.isInteger(batchId) || batchId <= 0
    ) {
      return res.status(400).json({
        message: "Valid nurseryId, saleId, and batchId are required",
      });
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({
        message: "quantity must be a positive integer",
      });
    }

    if (
      typeof unitPrice !== "number" ||
      !Number.isFinite(unitPrice) ||
      unitPrice < 0
    ) {
      return res.status(400).json({
        message: "unitPrice must be a non-negative number",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO sale_item
        (nursery_id, sale_id, batch_id, quantity, unit_price)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [nurseryId, saleId, batchId, quantity, unitPrice]
    );

    return res.status(201).json({
      message: "Sale item added successfully",
      item: result.rows[0],
    });
  } catch (error: any) {
    console.error("Error adding sale item:", error);

    if (error.code === "P0001") {
      return res.status(400).json({
        message: error.message,
      });
    }

    if (error.code === "23503") {
      return res.status(400).json({
        message: "The sale, batch, or nursery does not exist",
      });
    }

    if (error.code === "23514") {
      return res.status(400).json({
        message: "Quantity or unit price violates a database constraint",
      });
    }

    return res.status(500).json({
      message: "Failed to add sale item",
    });
  }
});

export default router;
