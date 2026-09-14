import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Request body must be valid JSON." },
      { status: 400 }
    );
  }

  const { name, phone, address, items, total, deliveryDate } = body ?? {};

  // ---- validation ----
  if (!isNonEmptyString(name)) {
    return NextResponse.json({ ok: false, error: "Name is required." }, { status: 400 });
  }
  if (!isNonEmptyString(phone)) {
    return NextResponse.json({ ok: false, error: "Phone is required." }, { status: 400 });
  }
  if (!isNonEmptyString(address)) {
    return NextResponse.json({ ok: false, error: "Delivery address is required." }, { status: 400 });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ ok: false, error: "Cart is empty." }, { status: 400 });
  }
  for (const it of items) {
    if (
      !it ||
      !isNonEmptyString(it.id) ||
      !isNonEmptyString(it.name) ||
      typeof it.price !== "number" ||
      !(Number.isInteger(it.qty) && it.qty > 0)
    ) {
      return NextResponse.json(
        { ok: false, error: "Each item needs an id, name, numeric price and a positive quantity." },
        { status: 400 }
      );
    }
  }
  if (typeof total !== "number" || total <= 0) {
    return NextResponse.json({ ok: false, error: "Total must be a positive number." }, { status: 400 });
  }

  const order = {
    name: name.trim(),
    phone: phone.trim(),
    address: address.trim(),
    items: items.map((it) => ({
      id: it.id,
      name: it.name,
      qty: it.qty,
      price: it.price,
    })),
    total,
    deliveryDate: isNonEmptyString(deliveryDate) ? deliveryDate.trim() : null,
    paymentStatus: "demo — no payment taken",
    createdAt: new Date(),
  };

  // ---- persist when MongoDB is configured ----
  try {
    const db = await getDb();
    if (db) {
      const result = await db.collection("orders").insertOne(order);
      return NextResponse.json({
        ok: true,
        orderId: String(result.insertedId),
        stored: true,
      });
    }
  } catch (err) {
    console.error("POST /api/orders failed to store order:", err.message);
    // fall through to demo response
  }

  // ---- demo mode: no database configured ----
  return NextResponse.json({
    ok: true,
    orderId: `demo-${Date.now()}`,
    stored: false,
  });
}
