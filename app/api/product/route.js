import { getProducts } from "@/lib/productApi";

export async function GET(request) {
  return getProducts(request);
}
