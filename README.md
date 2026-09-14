# A Fresh Home Made Tiffin — Tiffin Ordering Website

A single-page tiffin ordering website built with **Next.js (App Router)** and
**MongoDB**. Works out of the box in demo mode (no database required), and
stores menus and orders in MongoDB when configured.

## Quick start

1. Install dependencies:

   ```bash
   npm install
   ```

2. (Optional) Connect MongoDB. Copy `.env.example` to `.env` and set
   `MONGODB_URI`. Without it, the app runs in demo mode with a clearly
   labelled sample menu.

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

- `GET /api/menu` — returns menu items. Reads the `menus` collection in
  MongoDB when connected; otherwise falls back to `data/sampleMenu.js`
  (clearly labelled sample data in USD, meant to be replaced).
- `POST /api/orders` — accepts
  `{ name, phone, address, items, total, deliveryDate }`, validates input,
  inserts into the `orders` collection when MongoDB is configured, and
  returns `{ ok, orderId, stored }`. In demo mode it still returns an order
  id with `stored: false` so the full flow can be tried.

Checkout is a **demo — no real payment is taken**. The checkout screen is an
order summary with a clear demo banner; wire up Stripe or PayPal next:

- **Stripe:** create a business account, then add
  [Stripe Checkout](https://stripe.com/docs/payments/checkout) or Payment
  Links. The cleanest path is replacing the "Place Order" submit with a
  server-side call to the Stripe API that creates a Checkout Session and
  redirects the customer to it.
- **PayPal:** create a business account and use
  [PayPal Checkout / Smart Buttons](https://developer.paypal.com/docs/checkout/standard/integrate/)
  or a Payment Link button on the checkout screen.

## Deploying to Vercel

1. Push this folder to a Git repository.
2. Import the repository in the Vercel dashboard.
3. Add the `MONGODB_URI` environment variable in the project settings
   (skip this for demo mode).
4. Deploy. Vercel auto-detects Next.js; the default build command
   `npm run build` just works.

## MongoDB notes

- Database: defaults to the DB in the connection string (e.g. `fresh_tiffin`).
- Collections used: `menus` (menu items) and `orders` (placed orders).
- Seed a real menu by inserting documents shaped like:
  `{ id, name, description, price, tag }` into the `menus` collection.
