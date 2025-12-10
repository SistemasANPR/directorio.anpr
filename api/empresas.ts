import { pool } from "./db";

// -------------------------------------------
// GET /api/empresas
// -------------------------------------------
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const search = url.searchParams.get("search");
    const categoryId = url.searchParams.get("categoryId");
    const membershipTypeId = url.searchParams.get("membershipTypeId");
    const estado = url.searchParams.get("estado");
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    let whereConditions: string[] = [];
    let params: any[] = [];

    if (search) {
      whereConditions.push("(nombre_empresa LIKE ? OR descripcion_empresa LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }

    if (categoryId) {
      whereConditions.push("JSON_CONTAINS(categories_ids, ?)");
      params.push(JSON.stringify(parseInt(categoryId)));
    }

    if (membershipTypeId) {
      whereConditions.push("membership_type_id = ?");
      params.push(parseInt(membershipTypeId));
    }

    if (estado) {
      whereConditions.push("estado = ?");
      params.push(estado);
    } else {
      whereConditions.push("estado = 'activo'");
    }

    const whereClause =
      whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

    // Total count
    const countQuery = `SELECT COUNT(*) as total FROM companies ${whereClause}`;
    const [countResult]: any = await pool.query(countQuery, params);
    const total = countResult[0].total;

    // Data query
    const dataQuery = `
      SELECT * FROM companies 
      ${whereClause} 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;
    const [rows]: any = await pool.query(dataQuery, [...params, limit, offset]);

    return new Response(
      JSON.stringify({
        companies: rows,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("API empresas GET error:", err);
    return new Response(
      JSON.stringify({
        error: "Error interno del servidor",
        details: err.message
      }),
      { status: 500 }
    );
  }
}

// -------------------------------------------
// POST /api/empresas
// -------------------------------------------
export async function POST(req: Request) {
  try {
    const data = await req.json();

    const columns = Object.keys(data);
    const placeholders = columns.map(() => "?").join(", ");
    const values = Object.values(data).map(v =>
      typeof v === "object" ? JSON.stringify(v) : v
    );

    const query = `
      INSERT INTO companies (${columns
        .map(c => c.replace(/([A-Z])/g, "_$1").toLowerCase())
        .join(", ")})
      VALUES (${placeholders})
    `;

    const [result]: any = await pool.query(query, values);

    const [newCompany]: any = await pool.query(
      "SELECT * FROM companies WHERE id = ?",
      [result.insertId]
    );

    return new Response(JSON.stringify(newCompany[0]), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err: any) {
    console.error("API empresas POST error:", err);
    return new Response(
      JSON.stringify({
        error: "Error interno del servidor",
        details: err.message
      }),
      { status: 500 }
    );
  }
}