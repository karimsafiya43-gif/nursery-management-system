
import { Router, Request, Response } from "express";
import { pool } from "../config/db";

const router = Router();

// GET all customers for a nursery
router.get("/", async (req: Request, res: Response) => {
  try {
    const nurseryId = Number(req.query.nurseryId);

    if (!Number.isInteger(nurseryId) || nurseryId <= 0) {
      return res.status(400).json({
        message: "A valid nurseryId is required",
      });
    }

    const result = await pool.query(
      `SELECT customer_id, nursery_id, name, phone, email, address
       FROM customer
       WHERE nursery_id = $1
       ORDER BY name ASC`,
      [nurseryId]
    );

    return res.json({
      count: result.rowCount,
      customers: result.rows,
    });
  } catch (error) {
    console.error("Error fetching customers:", error);

    return res.status(500).json({
      message: "Failed to fetch customers",
    });
  }
});

// GET one customer by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const nurseryId = Number(req.query.nurseryId);
    const customerId = Number(req.params.id);

    if (
      !Number.isInteger(nurseryId) ||
      nurseryId <= 0 ||
      !Number.isInteger(customerId) ||
      customerId <= 0
    ) {
      return res.status(400).json({
        message: "Valid nurseryId and customer ID are required",
      });
    }

    const result = await pool.query(
      `SELECT customer_id, nursery_id, name, phone, email, address
       FROM customer
       WHERE nursery_id = $1 AND customer_id = $2`,
      [nurseryId, customerId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching customer:", error);

    return res.status(500).json({
      message: "Failed to fetch customer",
    });
  }
});

// POST a new customer
router.post("/", async (req: Request, res: Response) => {
  try {
    const { nurseryId, name, phone, email, address } = req.body;

    if (!Number.isInteger(nurseryId) || nurseryId <= 0) {
      return res.status(400).json({
        message: "A valid nurseryId is required",
      });
    }

    if (
      typeof name !== "string" ||
      name.trim().length === 0 ||
      name.trim().length > 150
    ) {
      return res.status(400).json({
        message: "name must contain 1–150 characters",
      });
    }

    if (
      phone !== undefined &&
      phone !== null &&
      (typeof phone !== "string" || phone.length > 20)
    ) {
      return res.status(400).json({
        message: "phone must be a string of at most 20 characters",
      });
    }

    if (
      email !== undefined &&
      email !== null &&
      (typeof email !== "string" ||
        email.length > 255 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    ) {
      return res.status(400).json({
        message: "email must be a valid email address",
      });
    }

    if (
      address !== undefined &&
      address !== null &&
      typeof address !== "string"
    ) {
      return res.status(400).json({
        message: "address must be a string or null",
      });
    }

    const result = await pool.query(
      `INSERT INTO customer
         (nursery_id, name, phone, email, address)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING customer_id, nursery_id, name, phone, email, address`,
      [
        nurseryId,
        name.trim(),
        phone?.trim() || null,
        email?.trim() || null,
        address?.trim() || null,
      ]
    );

    return res.status(201).json({
      message: "Customer created successfully",
      customer: result.rows[0],
    });
  } catch (error: any) {
    console.error("Error creating customer:", error);

    if (error.code === "23503") {
      return res.status(400).json({
        message: "The specified nursery does not exist",
      });
    }

    return res.status(500).json({
      message: "Failed to create customer",
    });
  }
});

export default router;
