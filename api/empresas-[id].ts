import { pool } from "../db";

// Extrae el parámetro :id desde la URL real
function getCompanyId(req: Request): number | null {
  const url = new URL(req.url);
  const parts = url.pathname.split("/"); // ["api","empresas","123"]
  const id = parts.pop() || parts.pop(); // último segmento válido

  if (!id) return null;
  return parseInt(id);
}

// -------------------------------------------
// GET /api/empresas/:id
// -------------------------------------------
export async function GET(req: Request) {
  try {
    const companyId = getCompanyId(req);

    if (!companyId) {
      return new Response(
        JSON.stringify({ error: "ID de empresa requerido" }),
        { status: 400 },
      );
    }

    const [rows]: any = await pool.query(
      "SELECT * FROM companies WHERE id = ?",
      [companyId],
    );

    if (rows.length === 0) {
      return new Response(JSON.stringify({ error: "Empresa no encontrada" }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify(rows[0]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("API empresas/[id] GET error:", err);
    return new Response(
      JSON.stringify({
        error: "Error interno del servidor",
        details: err.message,
      }),
      { status: 500 },
    );
  }
}

// -------------------------------------------
// PUT /api/empresas/:id
// -------------------------------------------
export async function PUT(req: Request) {
  try {
    const companyId = getCompanyId(req);

    if (!companyId) {
      return new Response(
        JSON.stringify({ error: "ID de empresa requerido" }),
        { status: 400 },
      );
    }

    const data = await req.json();

    if (!data || Object.keys(data).length === 0) {
      return new Response(
        JSON.stringify({ error: "No hay datos para actualizar" }),
        { status: 400 },
      );
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

    const sql = `UPDATE companies SET ${updates.join(", ")} WHERE id = ?`;

    await pool.query(sql, values);

    const [updatedRows]: any = await pool.query(
      "SELECT * FROM companies WHERE id = ?",
      [companyId],
    );

    return new Response(JSON.stringify(updatedRows[0]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("API empresas/[id] PUT error:", err);
    return new Response(
      JSON.stringify({
        error: "Error interno del servidor",
        details: err.message,
      }),
      { status: 500 },
    );
  }
}

// -------------------------------------------
// DELETE /api/empresas/:id
// -------------------------------------------
export async function DELETE(req: Request) {
  try {
    const companyId = getCompanyId(req);

    if (!companyId) {
      return new Response(
        JSON.stringify({ error: "ID de empresa requerido" }),
        { status: 400 },
      );
    }

    const [existing]: any = await pool.query(
      "SELECT id FROM companies WHERE id = ?",
      [companyId],
    );

    if (existing.length === 0) {
      return new Response(JSON.stringify({ error: "Empresa no encontrada" }), {
        status: 404,
      });
    }

    await pool.query("DELETE FROM companies WHERE id = ?", [companyId]);

    return new Response(JSON.stringify({ deleted: true, id: companyId }), {
      status: 200,
    });
  } catch (err: any) {
    console.error("API empresas/[id] DELETE error:", err);
    return new Response(
      JSON.stringify({
        error: "Error interno del servidor",
        details: err.message,
      }),
      { status: 500 },
    );
  }
}
