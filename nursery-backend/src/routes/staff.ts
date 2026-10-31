
import { Router, Request, Response } from "express";
import { pool } from "../config/db";
import bcrypt from "bcryptjs";

const router = Router();

const validRoles = ["owner", "manager", "staff"];

// GET all staff members for a nursery
router.get("/", async (req: Request, res: Response) => {
  try {
    const nurseryId = Number(req.query.nurseryId);

    if (!Number.isInteger(nurseryId) || nurseryId <= 0) {
      return res.status(400).json({
        message: "A valid nurseryId is required",
      });
    }

    const result = await pool.query(
      `SELECT staff_id, nursery_id, full_name, username,
              role, is_active, created_at
       FROM staff
       WHERE nursery_id = $1
       ORDER BY staff_id`,
      [nurseryId]
    );

    return res.json(result.rows);
  } catch (error) {
    console.error("Error fetching staff:", error);
    return res.status(500).json({
      message: "Failed to fetch staff",
    });
  }
});

// GET one staff member
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const nurseryId = Number(req.query.nurseryId);
    const staffId = Number(req.params.id);

    if (
      !Number.isInteger(nurseryId) || nurseryId <= 0 ||
      !Number.isInteger(staffId) || staffId <= 0
    ) {
      return res.status(400).json({
        message: "Valid nurseryId and staff ID are required",
      });
    }

    const result = await pool.query(
      `SELECT staff_id, nursery_id, full_name, username,
              role, is_active, created_at
       FROM staff
       WHERE nursery_id = $1 AND staff_id = $2`,
      [nurseryId, staffId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Staff member not found",
      });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching staff member:", error);
    return res.status(500).json({
      message: "Failed to fetch staff member",
    });
  }
});

// POST register a staff member
router.post("/", async (req: Request, res: Response) => {
  try {
    const { nurseryId, fullName, username, password, role } = req.body;

    const parsedNurseryId = Number(nurseryId);

    if (
      !Number.isInteger(parsedNurseryId) ||
      parsedNurseryId <= 0 ||
      typeof fullName !== "string" ||
      !fullName.trim() ||
      typeof username !== "string" ||
      !username.trim() ||
      typeof password !== "string" ||
      password.length < 8 ||
      typeof role !== "string" ||
      !validRoles.includes(role)
    ) {
      return res.status(400).json({
        message:
          "Provide a valid nurseryId, fullName, username, password (at least 8 characters), and role (owner, manager, or staff)",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `INSERT INTO staff
         (nursery_id, full_name, username, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING staff_id, nursery_id, full_name, username,
                 role, is_active, created_at`,
      [
        parsedNurseryId,
        fullName.trim(),
        username.trim(),
        passwordHash,
        role,
      ]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error("Error creating staff member:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        message: "This username is already registered",
      });
    }

    if (error.code === "23503") {
      return res.status(400).json({
        message: "The specified nursery does not exist",
      });
    }

    return res.status(500).json({
      message: "Failed to create staff member",
    });
  }
});

// PATCH activate or deactivate a staff member
router.patch("/:id/status", async (req: Request, res: Response) => {
  try {
    const nurseryId = Number(req.body.nurseryId);
    const staffId = Number(req.params.id);
    const { isActive } = req.body;

    if (
      !Number.isInteger(nurseryId) || nurseryId <= 0 ||
      !Number.isInteger(staffId) || staffId <= 0 ||
      typeof isActive !== "boolean"
    ) {
      return res.status(400).json({
        message: "Provide valid nurseryId, staff ID, and boolean isActive",
      });
    }

    const result = await pool.query(
      `UPDATE staff
       SET is_active = $1
       WHERE nursery_id = $2 AND staff_id = $3
       RETURNING staff_id, nursery_id, full_name, username,
                 role, is_active, created_at`,
      [isActive, nurseryId, staffId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Staff member not found",
      });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating staff status:", error);
    return res.status(500).json({
      message: "Failed to update staff status",
    });
  }
});

export default router;
