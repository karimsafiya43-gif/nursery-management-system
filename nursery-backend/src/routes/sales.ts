
import { Router, Request, Response } from "express";
import { pool } from "../config/db";

const router = Router();

// GET all sales for a nursery, including customer and total information
router.get("/", async (req: Request, res: Response) => {
  try {
    const nurseryId = Number(req.query.nurseryId);

    if (!Number.isInteger(nurseryId) || nurseryId <= 0) {
      return res.status(400).json({
        message: "A valid nurseryId is required",
      });
    }

    const result = await pool.query(
      `
      SELECT
        s.sale_id,
        s.nursery_id,
        s.customer_id,
        c.name AS customer_name,
        s.sale_date,
        s.notes,
        COALESCE(SUM(si.quantity * si.unit_price), 0)::numeric(12,2)
          AS total_amount,
        COALESCE(SUM(si.quantity), 0)::bigint AS total_quantity,
        COUNT(si.sale_item_id)::integer AS item_count
      FROM sale s
      JOIN customer c
        ON c.nursery_id = s.nursery_id
       AND c.customer_id = s.customer_id
      LEFT JOIN sale_item si
        ON si.nursery_id = s.nursery_id
       AND si.sale_id = s.sale_id
      WHERE s.nursery_id = $1
      GROUP BY
        s.sale_id, s.nursery_id, s.customer_id,
        c.name, s.sale_date, s.notes
      ORDER BY s.sale_date DESC, s.sale_id DESC
      `,
      [nurseryId]
    );

    return res.json({
      count: result.rowCount,
      sales: result.rows,
    });
  } catch (error) {
    console.error("Error fetching sales:", error);

    return res.status(500).json({
      message: "Failed to fetch sales",
    });
  }
});

// GET one sale, including its items
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const nurseryId = Number(req.query.nurseryId);
    const saleId = Number(req.params.id);

    if (
      !Number.isInteger(nurseryId) ||
      nurseryId <= 0 ||
      !Number.isInteger(saleId) ||
      saleId <= 0
    ) {
      return res.status(400).json({
        message: "Valid nurseryId and sale ID are required",
      });
    }

    const saleResult = await pool.query(
      `
      SELECT
        s.sale_id,
        s.nursery_id,
        s.customer_id,
        c.name AS customer_name,
        s.sale_date,
        s.notes,
        COALESCE(SUM(si.quantity * si.unit_price), 0)::numeric(12,2)
          AS total_amount,
        COALESCE(SUM(si.quantity), 0)::bigint AS total_quantity,
        COUNT(si.sale_item_id)::integer AS item_count
      FROM sale s
      JOIN customer c
        ON c.nursery_id = s.nursery_id
       AND c.customer_id = s.customer_id
      LEFT JOIN sale_item si
        ON si.nursery_id = s.nursery_id
       AND si.sale_id = s.sale_id
      WHERE s.nursery_id = $1 AND s.sale_id = $2
      GROUP BY
        s.sale_id, s.nursery_id, s.customer_id,
        c.name, s.sale_date, s.notes
      `,
      [nurseryId, saleId]
    );

    if (saleResult.rows.length === 0) {
      return res.status(404).json({
        message: "Sale not found",
      });
    }

    const itemsResult = await pool.query(
      `
      SELECT
        si.sale_item_id,
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
      ...saleResult.rows[0],
      items: itemsResult.rows,
    });
  } catch (error) {
    console.error("Error fetching sale:", error);

    return res.status(500).json({
      message: "Failed to fetch sale",
    });
  }
});

// POST a new sale
router.post("/", async (req: Request, res: Response) => {
  try {
    const { nurseryId, customerId, saleDate, notes } = req.body;

    if (
      !Number.isInteger(nurseryId) ||
      nurseryId <= 0 ||
      !Number.isInteger(customerId) ||
      customerId <= 0
    ) {
      return res.status(400).json({
        message: "Valid nurseryId and customerId are required",
      });
    }

    if (
      saleDate !== undefined &&
      (typeof saleDate !== "string" ||
        Number.isNaN(Date.parse(saleDate)))
    ) {
      return res.status(400).json({
        message: "saleDate must be a valid date/time string",
      });
    }

    if (
      notes !== undefined &&
      notes !== null &&
      typeof notes !== "string"
    ) {
      return res.status(400).json({
        message: "notes must be a string or null",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO sale (nursery_id, customer_id, sale_date, notes)
      VALUES ($1, $2, COALESCE($3::timestamptz, CURRENT_TIMESTAMP), $4)
      RETURNING *
      `,
      [nurseryId, customerId, saleDate ?? null, notes ?? null]
    );

    return res.status(201).json({
      message: "Sale created successfully",
      sale: result.rows[0],
    });
  } catch (error: any) {
    console.error("Error creating sale:", error);

    if (error.code === "23503") {
      return res.status(400).json({
        message: "The specified nursery or customer does not exist",
      });
    }

    return res.status(500).json({
      message: "Failed to create sale",
    });
  }
});

export default router;
