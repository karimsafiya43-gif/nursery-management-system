
import { Router, Request, Response } from "express";
import { pool } from "../config/db";

const router = Router();

const validCategories = [
  "disease",
  "pest",
  "nutrient",
  "environmental",
  "other",
];

// GET all issues for a nursery
router.get("/", async (req: Request, res: Response) => {
  try {
    const nurseryId = Number(req.query.nurseryId);
    const category =
      typeof req.query.category === "string"
        ? req.query.category.toLowerCase()
        : undefined;

    if (!Number.isInteger(nurseryId) || nurseryId <= 0) {
      return res.status(400).json({
        message: "A valid nurseryId is required",
      });
    }

    if (category && !validCategories.includes(category)) {
      return res.status(400).json({
        message:
          "category must be disease, pest, nutrient, environmental, or other",
      });
    }

    const values: (number | string)[] = [nurseryId];

    let query = `
      SELECT issue_id, nursery_id, name, category, description
      FROM issue
      WHERE nursery_id = $1
    `;

    if (category) {
      values.push(category);
      query += ` AND category = $2`;
    }

    query += ` ORDER BY name ASC`;

    const result = await pool.query(query, values);

    return res.json({
      count: result.rowCount,
      issues: result.rows,
    });
  } catch (error) {
    console.error("Error fetching issues:", error);

    return res.status(500).json({
      message: "Failed to fetch issues",
    });
  }
});

// GET one issue by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const nurseryId = Number(req.query.nurseryId);
    const issueId = Number(req.params.id);

    if (
      !Number.isInteger(nurseryId) ||
      nurseryId <= 0 ||
      !Number.isInteger(issueId) ||
      issueId <= 0
    ) {
      return res.status(400).json({
        message: "Valid nurseryId and issue ID are required",
      });
    }

    const result = await pool.query(
      `
      SELECT issue_id, nursery_id, name, category, description
      FROM issue
      WHERE nursery_id = $1 AND issue_id = $2
      `,
      [nurseryId, issueId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Issue not found",
      });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching issue:", error);

    return res.status(500).json({
      message: "Failed to fetch issue",
    });
  }
});

// POST a new issue
router.post("/", async (req: Request, res: Response) => {
  try {
    const { nurseryId, name, category, description } = req.body;

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
      typeof category !== "string" ||
      !validCategories.includes(category.toLowerCase())
    ) {
      return res.status(400).json({
        message:
          "category must be disease, pest, nutrient, environmental, or other",
      });
    }

    if (
      description !== undefined &&
      description !== null &&
      typeof description !== "string"
    ) {
      return res.status(400).json({
        message: "description must be a string or null",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO issue (nursery_id, name, category, description)
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [
        nurseryId,
        name.trim(),
        category.toLowerCase(),
        description ?? null,
      ]
    );

    return res.status(201).json({
      message: "Issue created successfully",
      issue: result.rows[0],
    });
  } catch (error: any) {
    console.error("Error creating issue:", error);

    if (error.code === "23503") {
      return res.status(400).json({
        message: "The specified nursery does not exist",
      });
    }

    if (error.code === "23505") {
      return res.status(409).json({
        message: "An issue with this name already exists for this nursery",
      });
    }

    return res.status(500).json({
      message: "Failed to create issue",
    });
  }
});

export default router;
