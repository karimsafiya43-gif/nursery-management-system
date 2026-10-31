
import { Router, Request, Response } from "express";
import { pool } from "../config/db";

const router = Router();

// GET all expenses for a nursery
router.get("/", async (req: Request, res: Response) => {
  try {
    const nurseryId = req.query.nurseryId;

    if (!nurseryId) {
      return res.status(400).json({
        message: "nurseryId query parameter is required",
      });
    }

    const result = await pool.query(
      `SELECT
         e.expense_id,
         e.nursery_id,
         e.batch_id,
         b.batch_name,
         s.name AS species_name,
         e.category,
         e.amount,
         e.expense_date,
         e.description
       FROM expense e
       LEFT JOIN batch b
         ON e.nursery_id = b.nursery_id
        AND e.batch_id = b.batch_id
       LEFT JOIN species s
         ON b.nursery_id = s.nursery_id
        AND b.species_id = s.species_id
       WHERE e.nursery_id = $1
       ORDER BY e.expense_date DESC, e.expense_id DESC`,
      [nurseryId]
    );

    return res.json(result.rows);
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return res.status(500).json({
      message: "Failed to fetch expenses",
    });
  }
});

// GET one expense by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const nurseryId = req.query.nurseryId;
    const expenseId = req.params.id;

    if (!nurseryId) {
      return res.status(400).json({
        message: "nurseryId query parameter is required",
      });
    }

    const result = await pool.query(
      `SELECT
         e.expense_id,
         e.nursery_id,
         e.batch_id,
         b.batch_name,
         s.name AS species_name,
         e.category,
         e.amount,
         e.expense_date,
         e.description
       FROM expense e
       LEFT JOIN batch b
         ON e.nursery_id = b.nursery_id
        AND e.batch_id = b.batch_id
       LEFT JOIN species s
         ON b.nursery_id = s.nursery_id
        AND b.species_id = s.species_id
       WHERE e.expense_id = $1
         AND e.nursery_id = $2`,
      [expenseId, nurseryId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Expense not found",
      });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching expense:", error);
    return res.status(500).json({
      message: "Failed to fetch expense",
    });
  }
});

// POST create a new expense
router.post("/", async (req: Request, res: Response) => {
  try {
    const {
      nurseryId,
      batchId,
      category,
      amount,
      expenseDate,
      description,
    } = req.body;

    if (!nurseryId || !category || amount === undefined || amount === null) {
      return res.status(400).json({
        message: "nurseryId, category, and amount are required",
      });
    }

    const validCategories = [
      "seeds",
      "soil",
      "fertilizer",
      "pesticide",
      "labour",
      "equipment",
      "water",
      "transport",
      "other",
    ];

    if (!validCategories.includes(category)) {
      return res.status(400).json({
        message: "Invalid category",
        validCategories,
      });
    }

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        message: "amount must be a number greater than zero",
      });
    }

    const result = await pool.query(
      `INSERT INTO expense
         (nursery_id, batch_id, category, amount, expense_date, description)
       VALUES ($1, $2, $3, $4, COALESCE($5::date, CURRENT_DATE), $6)
       RETURNING *`,
      [
        nurseryId,
        batchId ?? null,
        category,
        numericAmount,
        expenseDate ?? null,
        description ?? null,
      ]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error("Error creating expense:", error);

    if (error.code === "23503") {
      return res.status(400).json({
        message: "Invalid nurseryId or batchId",
      });
    }

    if (error.code === "23514") {
      return res.status(400).json({
        message: "Expense violates a database constraint",
      });
    }

    if (error.code === "22007" || error.code === "22008") {
      return res.status(400).json({
        message: "Invalid expenseDate",
      });
    }

    return res.status(500).json({
      message: "Failed to create expense",
    });
  }
});

export default router;
