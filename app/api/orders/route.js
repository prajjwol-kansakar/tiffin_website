import { cookies } from "next/headers";
import { NextResponse } from "next/server";

function isValidOrder(order) {
  return (
    order &&
    typeof order === "object" &&
    Array.isArray(order.SalesOrderProd) &&
    order.SalesOrderProd.length > 0 &&
    order.SalesOrderProd.every(
      (item) =>
        item &&
        typeof item.scode === "string" &&
        typeof item.unit === "string" &&
        item.unit.trim().length > 0 &&
        Number.isFinite(item.rate) &&
        Number.isInteger(item.quantity) &&
        item.quantity > 0
    )
  );
}

export async function POST(request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("tiffin_access_token")?.value;
  if (!token) {
    return NextResponse.json(
      { ok: false, error: "Please sign in before placing your order." },
      { status: 401 }
    );
  }

  let order;
  try {
    order = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Request body must be valid JSON." },
      { status: 400 }
    );
  }

  if (!isValidOrder(order)) {
    return NextResponse.json(
      { ok: false, error: "Order must contain at least one valid product." },
      { status: 400 }
    );
  }

  const orderUrl = process.env.BACKEND_ORDER_URL;
  if (!orderUrl) {
    return NextResponse.json(
      { ok: false, error: "The order service is not configured." },
      { status: 503 }
    );
  }

  try {
    const backendResponse = await fetch(orderUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...order,
        cust_code: cookieStore.get("tiffin_username")?.value ?? "",
        user_nm: cookieStore.get("tiffin_username")?.value ?? "",
      }),
      cache: "no-store",
    });
    const responseBody = await backendResponse.text();

    if (backendResponse.status === 204) {
      return new Response(null, { status: 204 });
    }

    return new Response(responseBody, {
      status: backendResponse.status,
      headers: {
        "Content-Type":
          backendResponse.headers.get("content-type") ?? "application/json",
      },
    });
  } catch (error) {
    console.error("POST /api/orders could not reach the order service:", error);
    return NextResponse.json(
      { ok: false, error: "Could not reach the order service. Please try again." },
      { status: 502 }
    );
  }
}
