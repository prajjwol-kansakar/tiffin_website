import { NextResponse } from "next/server";
import { SAMPLE_MENU, SAMPLE_MENU_LABEL } from "@/data/sampleMenu";

const DEFAULT_PAGE_SIZE = 10;

function samplePage(page, pageSize, searchTerms = "%") {
  const normalizedSearch = searchTerms === "%" ? "" : searchTerms.toLowerCase();
  const filteredMenu = normalizedSearch
    ? SAMPLE_MENU.filter((item) =>
        `${item.name} ${item.description} ${item.tag}`
          .toLowerCase()
          .includes(normalizedSearch)
      )
    : SAMPLE_MENU;
  const start = (page - 1) * pageSize;
  const items = filteredMenu.slice(start, start + pageSize);
  return {
    ok: true,
    source: "sample",
    label: SAMPLE_MENU_LABEL,
    items,
    hasMore: start + items.length < filteredMenu.length,
  };
}

function toMenuItem(product, imageOrigin) {
  const productCode = product.scode;
  const picturePath =
    product.pictureurl ?? "";
  let image = picturePath;

  if (picturePath && imageOrigin && !/^[a-z][a-z\d+.-]*:\/\//i.test(picturePath)) {
    image = new URL(picturePath, imageOrigin).toString();
  }

  return {
    id: String(productCode),
    name: product.Name ?? product.name ?? "",
    description: product.description ?? "",
    price: Number(product.srate),
    base_unit: product.base_unit ?? null,
    tag: product.tag ?? "Bestseller",
    image,
  };
}

export async function getProducts(request) {
  const { searchParams } = new URL(request.url);
  const requestedPage = Number(
    searchParams.get("pageNumber") ?? searchParams.get("page")
  );
  const page =
    Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const requestedPageSize = Number(searchParams.get("pageSize"));
  const pageSize =
    Number.isInteger(requestedPageSize) && requestedPageSize > 0
      ? Math.min(requestedPageSize, 50)
      : DEFAULT_PAGE_SIZE;
  const searchTerms = searchParams.get("searchTerms")?.trim() || "%";

  if (searchParams.get("source") === "sample") {
    return NextResponse.json(samplePage(page, pageSize, searchTerms));
  }

  const productUrl = process.env.BACKEND_PRODUCT_URL;
  if (!productUrl) {
    return NextResponse.json(samplePage(page, pageSize, searchTerms));
  }

  const backendUrl = new URL(productUrl);
  const imageOrigin = backendUrl.origin;
  backendUrl.searchParams.set("pageNumber", String(page));
  backendUrl.searchParams.set("pageSize", String(pageSize));
  backendUrl.searchParams.set("searchTerms", searchTerms);

  try {
    const response = await fetch(backendUrl, {
      headers: {
        "x-api-version": "2.0",
        Accept: "application/json",
      },
      cache: "no-store",
    });
    const responseText = await response.text();

    if (!response.ok) {
      return NextResponse.json(
        { ok: false, error: responseText || "Could not load products." },
        { status: response.status }
      );
    }

    let result;
    try {
      result = JSON.parse(responseText);
    } catch {
      return NextResponse.json(
        { ok: false, error: "The product service returned invalid JSON." },
        { status: 502 }
      );
    }

    if (result?.success === false || !Array.isArray(result?.items)) {
      return NextResponse.json(
        {
          ok: false,
          error: result?.message || "The product service returned no product list.",
        },
        { status: 502 }
      );
    }

    if (result.items.some((product) => !toMenuItem(product, imageOrigin).id)) {
      return NextResponse.json(
        { ok: false, error: "A product is missing its SCode." },
        { status: 502 }
      );
    }

    const hasMore =
      typeof result.hasMore === "boolean"
        ? result.hasMore
        : result.items.length === pageSize;
    return NextResponse.json({
      ok: true,
      source: "backend",
      items: result.items.map((product) => toMenuItem(product, imageOrigin)),
      hasMore,
    });
  } catch (error) {
    console.error("GET product API could not reach the product service:", error);
    return NextResponse.json(
      { ok: false, error: "Could not reach the product service." },
      { status: 502 }
    );
  }
}
