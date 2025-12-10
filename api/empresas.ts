import type { VercelRequest, VercelResponse } from "@vercel/node";
import { pool } from "../db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === "GET") {
      const [rows] = await pool.query("SELECT * FROM empresas");
      return res.status(200).json(rows);
    }

    if (req.method === "POST") {
      const data = req.body;
      const [result]: any = await pool.query(
        "INSERT INTO empresas SET ?",
        data
      );
      return res.status(201).json({ id: result.insertId, ...data });
    }

    return res.status(405).json({ error: "Método no permitido" });
  } catch (err: any) {
    console.error("API empresas error:", err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
