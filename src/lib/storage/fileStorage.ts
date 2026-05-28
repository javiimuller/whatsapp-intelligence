import { mkdir, writeFile } from "fs/promises";
import path from "path";
import OpenAI from "openai";
import { removeSensitiveText } from "@/lib/privacy";

const uploadRoot = path.join(process.cwd(), "storage", "uploads");

export async function saveUploadedFile(file: File, folder: string) {
  const bytes = Buffer.from(await file.arrayBuffer());
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const dir = path.join(uploadRoot, folder);
  await mkdir(dir, { recursive: true });
  const fileName = `${Date.now()}-${safeName}`;
  const diskPath = path.join(dir, fileName);
  await writeFile(diskPath, bytes);
  return {
    fileName: file.name,
    mimeType: file.type || "application/octet-stream",
    fileUrl: diskPath
  };
}

async function extractTextFromImage(file: File): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    return "Imagen recibida. Conectar OCR real en extractTextFromFile().";
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const mimeType = file.type || "image/png";
  const imageUrl = `data:${mimeType};base64,${bytes.toString("base64")}`;
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "Eres un OCR comercial para capturas de WhatsApp. Extrae solo texto visible útil para análisis comercial. Anonimiza teléfonos, nombres completos y datos sensibles. No inventes mensajes."
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text:
              "Lee esta captura. Devuelve una transcripción breve en texto plano con mensajes, señales comerciales, productos, precios, objeciones, seguimiento y cierre si aparecen. Si no se puede leer, dilo claramente."
          },
          {
            type: "image_url",
            image_url: { url: imageUrl }
          }
        ]
      }
    ]
  });

  const text = response.choices[0]?.message.content?.trim();
  return removeSensitiveText(text || "No se pudo leer texto comercial en la imagen.");
}

export async function extractTextFromFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  const mimeType = file.type.toLowerCase();

  if (name.endsWith(".txt") || name.endsWith(".csv")) {
    return removeSensitiveText(await file.text());
  }

  if (mimeType.startsWith("image/") || /\.(jpg|jpeg|png|webp)$/.test(name)) {
    return extractTextFromImage(file);
  }

  if (name.endsWith(".xlsx")) {
    return "Archivo Excel recibido. Conectar parser XLSX en la siguiente iteración.";
  }

  if (name.endsWith(".pdf")) {
    return "PDF recibido. Conectar extracción PDF/OCR real en la siguiente iteración.";
  }

  return "Archivo recibido, pero no se pudo extraer texto con los parsers disponibles.";
}
