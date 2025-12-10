import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

interface UploadResult {
  url: string;
  publicId: string;
  format: string;
  width?: number;
  height?: number;
}

async function uploadToCloudinary(
  base64Data: string,
  folder: string = "anpr"
): Promise<UploadResult> {
  const result = await cloudinary.uploader.upload(base64Data, {
    folder,
    resource_type: "image",
    transformation: [
      { quality: "auto:good" },
      { fetch_format: "auto" }
    ]
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
    format: result.format,
    width: result.width,
    height: result.height
  };
}

// --------------------------
// SERVERLESS FUNCTION
// --------------------------
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { image, folder = "anpr/images" } = body;

    if (!image) {
      return new Response(
        JSON.stringify({ error: "No se recibió ninguna imagen" }),
        { status: 400 }
      );
    }

    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      return new Response(
        JSON.stringify({ error: "Cloudinary no está configurado" }),
        { status: 500 }
      );
    }

    let base64Data = image;
    if (!image.startsWith("data:")) {
      base64Data = `data:image/jpeg;base64,${image}`;
    }

    const result = await uploadToCloudinary(base64Data, folder);

    return new Response(
      JSON.stringify({
        success: true,
        imageUrl: result.url,
        secure_url: result.url,
        publicId: result.publicId,
        format: result.format,
        width: result.width,
        height: result.height
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    console.error("API upload error:", err);

    return new Response(
      JSON.stringify({
        error: "Error al subir la imagen",
        details: err.message
      }),
      { status: 500 }
    );
  }
}