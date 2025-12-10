import type { VercelRequest, VercelResponse } from "@vercel/node";
import { pool } from "../db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: "ID de empresa requerido" });
  }

  const companyId = parseInt(id as string);

  try {
    if (req.method === "GET") {
      const [rows]: any = await pool.query(
        "SELECT * FROM companies WHERE id = ?",
        [companyId]
      );

      if (rows.length === 0) {
        return res.status(404).json({ error: "Empresa no encontrada" });
      }

      return res.status(200).json(rows[0]);
    }

    if (req.method === "PUT") {
      const data = req.body;

      if (Object.keys(data).length === 0) {
        return res.status(400).json({ error: "No hay datos para actualizar" });
      }

      const updates: string[] = [];
      const values: any[] = [];

      for (const [key, value] of Object.entries(data)) {
        const columnName = key.replace(/([A-Z])/g, "_$1").toLowerCase();
        updates.push(`${columnName} = ?`);
        values.push(typeof value === "object" ? JSON.stringify(value) : value);
      }

      updates.push("updated_at = NOW()");
      values.push(companyId);

      const query = `UPDATE companies SET ${updates.join(", ")} WHERE id = ?`;
      await pool.query(query, values);

      const [updatedRows]: any = await pool.query(
        "SELECT * FROM companies WHERE id = ?",
        [companyId]
      );

      return res.status(200).json(updatedRows[0]);
    }

    if (req.method === "DELETE") {
      const [existingRows]: any = await pool.query(
        "SELECT id FROM companies WHERE id = ?",
        [companyId]
      );

      if (existingRows.length === 0) {
        return res.status(404).json({ error: "Empresa no encontrada" });
      }

      await pool.query("DELETE FROM companies WHERE id = ?", [companyId]);

      return res.status(200).json({ deleted: true, id: companyId });
    }

    return res.status(405).json({ error: "Método no permitido" });
  } catch (err: any) {
    console.error("API empresas/[id] error:", err);
    return res.status(500).json({ error: "Error interno del servidor", details: err.message });
  }
}
