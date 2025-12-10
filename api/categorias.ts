import { pool } from "../db";

// -------------------------------------------
// GET /api/categorias
// -------------------------------------------
export async function GET() {
  try {
    const [rows]: any = await pool.query(
      "SELECT * FROM categories ORDER BY nombre_categoria ASC"
    );

    return new Response(JSON.stringify(rows), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err: any) {
    console.error("API categorias GET error:", err);
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
// POST /api/categorias
// -------------------------------------------
export async function POST(req: Request) {
  try {
    const { nombreCategoria, descripcion, icono, iconoUrl } = await req.json();

    if (!nombreCategoria) {
      return new Response(
        JSON.stringify({
          error: "El nombre de la categoría es requerido"
        }),
        { status: 400 }
      );
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

    return new Response(JSON.stringify(newCategory[0]), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err: any) {
    console.error("API categorias POST error:", err);
    return new Response(
      JSON.stringify({
        error: "Error interno del servidor",
        details: err.message
      }),
      { status: 500 }
    );
  }
}