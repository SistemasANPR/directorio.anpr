import { pool } from "./db";

// --------------------------------------------------
// POST /api/auth
// Registrar o retornar usuario Firebase
// --------------------------------------------------
export async function POST(req: Request) {
  try {
    const { firebaseUid, email, displayName, photoURL, role = "user" } =
      await req.json();

    if (!firebaseUid || !email) {
      return new Response(
        JSON.stringify({
          error: "Firebase UID y email son requeridos",
        }),
        { status: 400 }
      );
    }

    // Verificar si ya existe
    const [existingUsers]: any = await pool.query(
      "SELECT * FROM users WHERE firebase_uid = ?",
      [firebaseUid]
    );

    if (existingUsers.length > 0) {
      return new Response(JSON.stringify(existingUsers[0]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Crear nuevo usuario
    const [result]: any = await pool.query(
      `INSERT INTO users (firebase_uid, email, display_name, photo_url, role, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      [firebaseUid, email, displayName || null, photoURL || null, role]
    );

    const [newUser]: any = await pool.query(
      "SELECT * FROM users WHERE id = ?",
      [result.insertId]
    );

    return new Response(JSON.stringify(newUser[0]), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("API auth POST error:", err);
    return new Response(
      JSON.stringify({
        error: "Error interno del servidor",
        details: err.message,
      }),
      { status: 500 }
    );
  }
}

// --------------------------------------------------
// GET /api/auth?firebaseUid=xxxx
// Obtener usuario por firebase_uid
// --------------------------------------------------
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const firebaseUid = url.searchParams.get("firebaseUid");

    if (!firebaseUid) {
      return new Response(
        JSON.stringify({ error: "Firebase UID es requerido" }),
        { status: 400 }
      );
    }

    const [rows]: any = await pool.query(
      "SELECT * FROM users WHERE firebase_uid = ?",
      [firebaseUid]
    );

    if (rows.length === 0) {
      return new Response(JSON.stringify({ error: "Usuario no encontrado" }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify(rows[0]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("API auth GET error:", err);
    return new Response(
      JSON.stringify({
        error: "Error interno del servidor",
        details: err.message,
      }),
      { status: 500 }
    );
  }
}