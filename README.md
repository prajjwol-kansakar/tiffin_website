# A Fresh Home Made Tiffin — Tiffin Ordering Website

A single-page tiffin ordering website built with **Next.js (App Router)** and
backend APIs for authentication, products, and order submission.

## Quick start

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and configure the backend login, product,
   and order URLs. If the product URL is unset, the app uses a clearly labelled
   sample menu.

3. Run the dev server:

   ```bash
   npm run dev
   ```

   Open http://localhost:3000.

To create a production build:

```bash
npm run build
npm run start
```

## How it works

- `GET /api/product` — fetches products anonymously from the configured
  `/api/Product?pageNumber=...&pageSize=...&searchTerms=...` endpoint, and
  falls back to `data/sampleMenu.js` when no product API is configured.
- `GET /api/auth/session` — reports whether the browser has a valid sign-in
  cookie so checkout can decide whether to open the sign-in modal.
- `POST /api/auth/login` — forwards username/password to the configured
  authentication endpoint and stores the returned access token in an
  HTTP-only cookie.
- `POST /api/orders` — requires that sign-in cookie and forwards the
  `SORDER` payload to the configured sales-order endpoint.

Set `BACKEND_LOGIN_URL`, `BACKEND_ORDER_URL`, and `BACKEND_PRODUCT_URL` in
`.env` (see `.env.example`). The provided example uses the local backend
address; use an address reachable from the Next.js server in your deployment.
The order payload uses `B1`, year `26/27`, the signed-in username for `cust_code`,
and null vendor/reference values. Order lines are sent in `SalesOrderProd`,
mapping menu `id`/`name` to `scode`/`product_name`. The order line's required
`unit` comes from the menu item's `base_unit`, and `warehouse` defaults to
`W-1` when the item doesn't provide one. Customer name, phone, delivery address,
and optional delivery date are included in `notes`.

Checkout submits the order to the backend; payment is not collected by this
website. The login response's access token is kept in an HTTP-only cookie and
is never exposed to browser JavaScript.

## Deploying to Vercel

1. Push this folder to a Git repository.
2. Import the repository in the Vercel dashboard.
3. Set `BACKEND_LOGIN_URL`, `BACKEND_ORDER_URL`, and `BACKEND_PRODUCT_URL` in
   the project settings. Ensure the backend is reachable from the deployed
   Next.js server.
4. Deploy. Vercel auto-detects Next.js; the default build command
   `npm run build` just works.
