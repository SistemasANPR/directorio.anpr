import type { VercelRequest, VercelResponse } from "@vercel/node";
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { image, folder = "anpr/images" } = req.body;

    if (!image) {
      return res.status(400).json({ error: "No se recibió ninguna imagen" });
    }

    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return res.status(500).json({ error: "Cloudinary no está configurado" });
    }

    let base64Data = image;
    if (!image.startsWith("data:")) {
      base64Data = `data:image/jpeg;base64,${image}`;
    }

    const result = await uploadToCloudinary(base64Data, folder);

    return res.status(200).json({
      success: true,
      imageUrl: result.url,
      secure_url: result.url,
      publicId: result.publicId,
      format: result.format,
      width: result.width,
      height: result.height
    });
  } catch (err: any) {
    console.error("API upload error:", err);
    return res.status(500).json({ 
      error: "Error al subir la imagen", 
      details: err.message 
    });
  }
}
