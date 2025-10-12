import { sql } from "../config/db.js";

export const createExecution = async (req, res) => {
  try {
    const { booking_id, client_id, provider_id, payment_id } = req.body;

    if (!booking_id || !client_id || !provider_id || !payment_id) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const [existingExecution] = await sql`
      SELECT * FROM execution WHERE booking_id = ${booking_id};
    `;
    if (existingExecution) {
      return res
        .status(400)
        .json({ message: "Execution for this booking already exists" });
    }

    const [newExecution] = await sql`
      INSERT INTO execution (
        booking_id, client_id, provider_id, payment_id,
        validatedCredential, completedProvider, completedClient
      )
      VALUES (
        ${booking_id}, ${client_id}, ${provider_id}, ${payment_id},
        'pending', 'pending', 'pending'
      )
      RETURNING *;
    `;

    res.status(201).json({
      message: "Execution created successfully",
      execution: newExecution,
    });
  } catch (error) {
    console.error("❌ Error creating execution:", error.message);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const updateExecutionStatus = async (req, res) => {
  try {
    const { execution_id } = req.params;
    const { validatedCredential, completedProvider, completedClient } = req.body;
    const [execution] = await sql`UPDATE execution SET validatedCredential = ${validatedCredential}, completedProvider = ${completedProvider}, completedClient = ${completedClient} WHERE id = ${execution_id} RETURNING *`;
    if (!execution) {
      return res.status(404).json({ message: "Execution not found" });
    }
    res.status(200).json({ message: "Execution updated successfully", execution });
  } catch (error) {
    console.error("Error updating execution status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}