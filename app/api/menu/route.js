import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { SAMPLE_MENU, SAMPLE_MENU_LABEL } from "@/data/sampleMenu";

export async function GET() {
  try {
    const db = await getDb();
    if (db) {
      const items = await db.collection("menus").find({}).toArray();
      if (items.length > 0) {
        return NextResponse.json({
          ok: true,
          source: "database",
          items: items.map((m) => ({
            id: m.id ?? String(m._id),
            name: m.name,
            description: m.description ?? "",
            price: Number(m.price),
            tag: m.tag ?? "",
            image: m.image ?? "",
          })),
        });
      }
    }
  } catch (err) {
    console.error("GET /api/menu failed, falling back to sample menu:", err.message);
  }

  // Demo fallback: clearly labelled sample data
  return NextResponse.json({
    ok: true,
    source: "sample",
    label: SAMPLE_MENU_LABEL,
    items: SAMPLE_MENU,
  });
}
