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
      const { search, categoryId, membershipTypeId, estado, page = "1", limit = "10" } = req.query;

      const pageNum = parseInt(page as string) || 1;
      const limitNum = parseInt(limit as string) || 10;
      const offset = (pageNum - 1) * limitNum;

      let whereConditions: string[] = [];
      let params: any[] = [];

      if (search) {
        whereConditions.push("(nombre_empresa LIKE ? OR descripcion_empresa LIKE ?)");
        params.push(`%${search}%`, `%${search}%`);
      }

      if (categoryId) {
        whereConditions.push("JSON_CONTAINS(categories_ids, ?)");
        params.push(JSON.stringify(parseInt(categoryId as string)));
      }

      if (membershipTypeId) {
        whereConditions.push("membership_type_id = ?");
        params.push(parseInt(membershipTypeId as string));
      }

      if (estado) {
        whereConditions.push("estado = ?");
        params.push(estado);
      } else {
        whereConditions.push("estado = 'activo'");
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

      const countQuery = `SELECT COUNT(*) as total FROM companies ${whereClause}`;
      const [countResult]: any = await pool.query(countQuery, params);
      const total = countResult[0].total;

      const dataQuery = `SELECT * FROM companies ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`;
      const [rows]: any = await pool.query(dataQuery, [...params, limitNum, offset]);

      return res.status(200).json({
        companies: rows,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum)
      });
    }

    if (req.method === "POST") {
      const data = req.body;

      const columns = Object.keys(data);
      const placeholders = columns.map(() => "?").join(", ");
      const values = Object.values(data).map(v => 
        typeof v === "object" ? JSON.stringify(v) : v
      );

      const query = `INSERT INTO companies (${columns.map(c => 
        c.replace(/([A-Z])/g, "_$1").toLowerCase()
      ).join(", ")}) VALUES (${placeholders})`;

      const [result]: any = await pool.query(query, values);

      const [newCompany]: any = await pool.query(
        "SELECT * FROM companies WHERE id = ?",
        [result.insertId]
      );

      return res.status(201).json(newCompany[0]);
    }

    return res.status(405).json({ error: "Método no permitido" });
  } catch (err: any) {
    console.error("API empresas error:", err);
    return res.status(500).json({ error: "Error interno del servidor", details: err.message });
  }
}
