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
    if (req.method === "GET") {
      const [rows]: any = await pool.query(
        "SELECT * FROM categories ORDER BY nombre_categoria ASC"
      );
      return res.status(200).json(rows);
    }

    if (req.method === "POST") {
      const { nombreCategoria, descripcion, icono, iconoUrl } = req.body;

      if (!nombreCategoria) {
        return res.status(400).json({ error: "El nombre de la categoría es requerido" });
      }

      const [result]: any = await pool.query(
        `INSERT INTO categories (nombre_categoria, descripcion, icono, icono_url, created_at, updated_at) 
         VALUES (?, ?, ?, ?, NOW(), NOW())`,
        [nombreCategoria, descripcion || null, icono || "Tag", iconoUrl || null]
      );

      const [newCategory]: any = await pool.query(
        "SELECT * FROM categories WHERE id = ?",
        [result.insertId]
      );

      return res.status(201).json(newCategory[0]);
    }

    return res.status(405).json({ error: "Método no permitido" });
  } catch (err: any) {
    console.error("API categorias error:", err);
    return res.status(500).json({ error: "Error interno del servidor", details: err.message });
  }
}
