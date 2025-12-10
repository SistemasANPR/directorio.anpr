import type { VercelRequest, VercelResponse } from "@vercel/node";
import { pool } from "../db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    if (req.method === "POST") {
      const { firebaseUid, email, displayName, photoURL, role = "user" } = req.body;

      if (!firebaseUid || !email) {
        return res.status(400).json({ error: "Firebase UID y email son requeridos" });
      }

      const [existingUsers]: any = await pool.query(
        "SELECT * FROM users WHERE firebase_uid = ?",
        [firebaseUid]
      );

      if (existingUsers.length > 0) {
        return res.status(200).json(existingUsers[0]);
      }

      const [result]: any = await pool.query(
        `INSERT INTO users (firebase_uid, email, display_name, photo_url, role, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
        [firebaseUid, email, displayName || null, photoURL || null, role]
      );

      const [newUser]: any = await pool.query(
        "SELECT * FROM users WHERE id = ?",
        [result.insertId]
      );

      return res.status(201).json(newUser[0]);
    }

    if (req.method === "GET") {
      const { firebaseUid } = req.query;

      if (!firebaseUid) {
        return res.status(400).json({ error: "Firebase UID es requerido" });
      }

      const [rows]: any = await pool.query(
        "SELECT * FROM users WHERE firebase_uid = ?",
        [firebaseUid]
      );

      if (rows.length === 0) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      return res.status(200).json(rows[0]);
    }

    return res.status(405).json({ error: "Método no permitido" });
  } catch (err: any) {
    console.error("API auth error:", err);
    return res.status(500).json({ error: "Error interno del servidor", details: err.message });
  }
}
