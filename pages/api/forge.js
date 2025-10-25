// pages/api/forge.js
import { commitCommand } from "@/lib/ptac";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST required" });
  }

  try {
    const command = req.body;
    const id = await commitCommand(command);
    res.status(200).json({ ok: true, id });
  } catch (err) {
    console.error("Forge error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
}
