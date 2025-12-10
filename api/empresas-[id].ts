import type { VercelRequest, VercelResponse } from "@vercel/node";
import { pool } from "../db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const id = req.query.id;

  try {
    if (req.method === "GET") {
      const [rows]: any = await pool.query(
        "SELECT * FROM empresas WHERE id = ?",
        [id]
      );
      return res.status(200).json(rows[0] || null);
    }

    if (req.method === "PUT") {
      const data = req.body;
      await pool.query("UPDATE empresas SET ? WHERE id = ?", [data, id]);
      return res.status(200).json({ updated: true });
    }

    if (req.method === "DELETE") {
      await pool.query("DELETE FROM empresas WHERE id = ?", [id]);
      return res.status(200).json({ deleted: true });
    }

    return res.status(405).json({ error: "Método no permitido" });
  } catch (err: any) {
    console.error("API empresas/[id] error:", err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
