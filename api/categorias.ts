import type { VercelRequest, VercelResponse } from "@vercel/node";
import { pool } from "../db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const [rows] = await pool.query("SELECT * FROM categorias");
    return res.status(200).json(rows);
  } catch (err: any) {
    console.error("API categorias error:", err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
