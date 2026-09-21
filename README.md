# S LV BOOK CENTER — Established in 1997

React + Vite + Tailwind bookstore with an admin dashboard, live order
notifications, and phone-number order lookup, backed by Firebase Firestore.

## 🔒 Security hardening (latest update)

Order pricing, stock checks, and coupon validation now happen **entirely on
the server** (`/api/create-order.js`) using the Firebase Admin SDK — the
browser can no longer set or influence price, discount, tax, total, or
stock. Firestore/Storage rules were rewritten so books, orders, and coupons
are properly locked to verified admins at the database level, not just
hidden in the UI. **This means checkout now requires one new setup step**
(a Firebase Admin service account, section 3 below) and **local testing now
requires `vercel dev`, not plain `npm run dev`.** If a payment succeeds but
stock runs out in the exact same instant (two people buying the last
copy), the customer is automatically refunded via Razorpay — never
silently charged for nothing. A runnable test script
(`scripts/security-test.mjs`) exercises the real checkout endpoints,
including that race condition. See the full breakdown at the end of this
file.

## What's new in this version

- **Books load 24 at a time with pagination** ("Load More"), not the whole
  catalog at once — much lighter on Firestore reads as your catalog grows.
  Books are stored in Firestore (`store_books` collection), so admin
  changes show live to every customer. Since automatic seeding was removed
  (it was reading the entire collection just to check if it was empty), run
  `node scripts/seed-books.mjs` once to add starter books to a fresh
  project — see the script's own comments for setup.
- **Phone number is now required at checkout**, and orders are saved to
  Firestore (in addition to the browser's local "My Orders") so the admin can
  see them from any device.
- **Admin dashboard → Orders tab**: live list of every order, updates
  instantly (no refresh needed) when a customer checks out. A toast pops up
  in-app, and — once you click "Enable desktop alerts" — you'll also get a
  browser notification even if the Orders tab isn't focused.
- **Phone lookup**: type a phone number into the search box on the Orders tab
  to see every past order placed with that number.
- **Order status**: mark orders pending / confirmed / shipped / delivered /
  cancelled from a dropdown on each order.
- **Amazon-style cart button**: once a book is in the cart, its "Add to
  Cart" button becomes a quantity stepper (− / count / +) right on the book
  card, instead of staying stuck on "Add to Cart".
- **Cancel order**: customers can cancel their own order from Order History
  (only while it's still "pending" or "confirmed" — not after it ships).
  Order History now reads live from Firestore, same as the admin dashboard.
- **Order confirmation emails** to customers via EmailJS (optional — see
  setup below; the app works fine without it, emails are just skipped).
- **Bulk upload books via CSV** — Admin Dashboard → Books has a "Bulk Upload
  (CSV)" button plus a "Template" download so you know the exact column
  format. Note: CSV can only carry image *links* (URLs), not actual photo
  files — for real photos, add/edit that book afterward using the existing
  "upload from your device" option.
- **Guest checkout** — customers no longer need an account to buy something.
  Logged-in customers still get order history; guests get a printable
  invoice link right on the confirmation page instead.
- **Coupon codes at checkout, now admin-managed** — Admin Dashboard has a
  new "Coupons" tab to create, disable, and delete discount codes (code +
  percentage off). No more editing a code file — everything's live in
  Firestore. Comes with 3 starter codes (`FIRST10`, `WELCOME50`,
  `BOOKLOVER20`) the first time you connect a fresh Firebase project.
- **Printable invoice** for every order — a "Print Invoice" link on the
  confirmation page, Order History, and the admin Orders tab opens a clean,
  printable bill at `/invoice/<order id>`.
- **Stock now actually decreases** when an order is placed (and is restored
  if the order is cancelled) — previously the stock number was just
  decorative. This uses a Firestore transaction, so it stays correct even if
  two people order the same book at the same moment.
- **Admin can now set a book's stock quantity** in the Add/Edit Book form —
  this was missing before, so every new book defaulted to 0 stock.
- **Real login with working "Forgot password"** via Firebase Authentication —
  replaces the old hardcoded demo accounts. Anyone can sign up with their own
  email/password, and a real password-reset email works out of the box.
- **Cash on Delivery** is now a payment option at checkout, alongside real
  online payment.
- **Analytics page for admins** (Profile → View Analytics): revenue, total
  orders, books sold, average order value, orders by status, best-selling
  books, and a 14-day revenue chart. Cancelled orders are excluded from
  revenue/books-sold figures.
- **Admin can upload a cover image file directly** (JPG/PNG/WEBP/GIF, up to
  5MB) instead of only pasting a URL — stored in Firebase Storage. Pasting a
  URL still works too; it's "either/or," whichever is easier.
- **Real payment via Razorpay** (Test Mode by default — fake money, real
  flow). Checkout still works even if you skip this setup; it just runs in
  a clearly-labeled demo mode with no real charge.

> ⚠️ If you set up Firestore rules before this update, **re-publish
> `firestore.rules`** — it now also covers the `store_books` collection.

## 1. Local setup

```bash
npm install
cp .env.example .env
```

## 2. Create a Firebase project (free tier is enough)

1. Go to https://console.firebase.google.com → **Add project** → follow the
   steps (you can leave Google Analytics off).
2. Once created, click the **`</>` (Web) icon** to register a web app. Give it
   any nickname.
3. Firebase will show you a `firebaseConfig` object — copy each value into
   your `.env` file:

   ```
   VITE_FIREBASE_API_KEY=AIzaSy...
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
   ```

4. In the Firebase console sidebar, go to **Build → Firestore Database →
   Create database**. Start in **production mode** (any region is fine).
5. Go to the **Rules** tab of Firestore, delete what's there, and paste in the
   contents of `firestore.rules` from this project. Click **Publish**.
6. Go to **Build → Authentication → Get started**. Under the **Sign-in
   method** tab, enable **Email/Password** (the first option in the list) and
   save. This is what powers real login, signup, and "Forgot password."
7. Run `npm run dev`. Go to `/login` → **New Account** → sign up with your
   own email and password (the old `admin@example.com` demo login no longer
   works now that real accounts are in place).
8. **To make your account an admin**: in the Firebase console, go to
   **Firestore Database → Data → users**, find the document with your email,
   click it, and change the `role` field from `user` to `admin`. Refresh the
   app (or log out and back in) — you'll now see the Admin Panel.

## 3. Set up the Firebase Admin SDK (REQUIRED — checkout will not work without this)

Since the security hardening pass, **all order creation, pricing, stock
checks, and coupon validation happen on the server**, not in the browser —
the server needs its own elevated credentials (separate from the public
`VITE_FIREBASE_*` keys) to do this. Without this step, adding to cart and
browsing still works, but checkout will show a clear error instead of
completing.

1. Firebase console → ⚙️ **Project Settings** → **Service accounts** tab.
2. Click **Generate new private key** → confirm → a `.json` file downloads.
   **Keep this file private — never commit it or share it.** It grants full
   admin access to your Firebase project.
3. Open that JSON file. Copy 3 values into `.env`:
   ```
   FIREBASE_ADMIN_PROJECT_ID=<the "project_id" value>
   FIREBASE_ADMIN_CLIENT_EMAIL=<the "client_email" value>
   FIREBASE_ADMIN_PRIVATE_KEY=<the "private_key" value, including the -----BEGIN/END----- lines>
   ```
   The private key contains real newlines in the JSON file — when pasted
   into a single `.env` line, that's fine as long as it stays inside quotes
   or the `\n` sequences remain intact (the app converts `\n` back to real
   newlines automatically).
4. Restart `npm run dev` (or `vercel dev`, see section 6 below) after saving `.env`.

> ⚠️ **Testing checkout locally now requires `vercel dev`, not plain
> `npm run dev`** — checkout calls serverless functions in `/api`, which
> plain Vite doesn't run. Browsing books/cart works fine either way; only
> completing a purchase needs `vercel dev` (see section 6 below) or an actual
> Vercel deployment.

## 4. Set up Firebase Storage (for uploading cover images)

This step is only needed if you want the "upload from your device" option
for book covers. If you're happy always pasting an image URL, skip this —
that keeps working with no setup at all.

1. In the Firebase console → **Build → Storage → Get started**.
2. Firebase will ask you to **upgrade to the Blaze (pay-as-you-go) plan** —
   this requires linking a billing card, since Google changed this rule in
   Feb 2026. You won't be charged unless you go far beyond the free quota
   (5GB storage / 1GB download per day is free either way).
3. Choose **production mode**, pick the same region as your Firestore
   database, and click **Done**.
4. Go to the **Rules** tab (under Storage, not Firestore's Rules tab — they're
   separate). Delete the default rules and paste in the contents of
   `storage.rules` from this project. Click **Publish**.
5. Restart `npm run dev`. In Admin Dashboard → Add/Edit Book, you'll now see
   an "Or upload from your device" button next to the image URL field.

If you'd rather not link a card at all, Cloudinary is a good free
alternative with no card required — ask if you'd like that wired in instead.

## 5. (Optional) Set up order confirmation emails

1. Go to https://www.emailjs.com → sign up (free tier: 200 emails/month).
2. **Email Services** → Add New Service → connect Gmail (or any provider) →
   copy the **Service ID**.
3. **Email Templates** → Create New Template. Use these variables in the
   template body: `{{to_name}}`, `{{to_email}}`, `{{order_id}}`,
   `{{order_total}}`, `{{order_items}}`. Set the "To email" field to
   `{{to_email}}`. Copy the **Template ID**.
4. **Account** → **General** → copy your **Public Key**.
5. Add all three to `.env`:
   ```
   VITE_EMAILJS_SERVICE_ID=service_xxxxxxx
   VITE_EMAILJS_TEMPLATE_ID=template_xxxxxxx
   VITE_EMAILJS_PUBLIC_KEY=xxxxxxxxxxxxxxx
   ```
6. Restart `npm run dev` and place a test order — check the inbox of the
   email you used at checkout.

If you skip this section, checkout still works exactly the same — the app
just won't send an email.

## 6. (Optional) Set up real payment via Razorpay

Without this, checkout still works — it just runs in "demo mode" (order is
placed with no real charge, and a toast tells you so).

1. Go to https://dashboard.razorpay.com/signup and create an account (no
   business verification is needed for **Test Mode**, which is what you
   want for now — it simulates real payments with fake money).
2. Once logged in, make sure the toggle in the top bar says **Test Mode**.
3. Go to **Settings → API Keys → Generate Test Key**. You'll get a
   **Key ID** and **Key Secret** — copy both immediately (the secret is
   only shown once).
4. Add all three values to `.env`:
   ```
   VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
   RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
   RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
   ```
   (Yes, the first two are the same value — one is for the browser, one is
   for the serverless functions in `/api`. The secret is server-only.)

### Testing checkout locally

Plain `npm run dev` does **not** run the `/api` serverless functions —
Vite doesn't know about them, and since the security hardening pass, ALL
checkout (COD included, not just Razorpay) goes through those functions.
To test checkout locally, install the Vercel CLI once and use it instead:
```bash
npm install -g vercel
vercel dev
```
This runs your whole app, including `/api`, exactly like it'll behave once
deployed. Browsing books, cart, and wishlist work fine under plain
`npm run dev` too — only completing a purchase needs `vercel dev`.

**Test card for Test Mode:** card number `4111 1111 1111 1111`, any future
expiry date, any 3-digit CVV, any name. For test UPI, use `success@razorpay`
as the UPI ID. No real money moves in Test Mode, ever.

### Going live later

Once you're ready to accept real payments, Razorpay requires business KYC
verification (PAN, bank account, etc.) before you can switch from Test Mode
to Live Mode keys. That's a Razorpay account step, not a code change — the
same code here works for both, you'd just swap the keys.

## 7. Deploy to Vercel

1. Push this project to a GitHub repo.
2. On https://vercel.com → **Add New → Project** → import that repo.
   Vercel auto-detects Vite; leave the build settings as default
   (`npm run build`, output directory `dist`).
3. Before deploying, open **Environment Variables** and add the same six
   `VITE_FIREBASE_*` keys from your `.env` file, PLUS the 3
   `FIREBASE_ADMIN_*` keys from section 3 (checkout will not work on the
   live site without these — this is not optional). If you set up EmailJS
   (step 5), add those 3 `VITE_EMAILJS_*` keys too. If you set up Razorpay
   (step 6), add `VITE_RAZORPAY_KEY_ID`, `RAZORPAY_KEY_ID`, and
   `RAZORPAY_KEY_SECRET` as well — Vercel runs the `/api` functions
   automatically, no extra config needed.
4. Deploy. `vercel.json` in this project is already set up so React Router
   routes (like `/books/123`) work correctly on refresh/direct links.
5. Any time you change an environment variable on Vercel, redeploy for it to
   take effect.

## Notes / next steps worth knowing about

- **Admin authorization** is enforced via a `role` field on each user's
  Firestore document, checked server-side in every `/api` function and in
  the Firestore/Storage rules — not via Firebase Auth "custom claims". That
  would be the more scalable standard approach, but requires deploying
  separate Firebase Cloud Functions infrastructure this project doesn't
  have; the role-field approach is genuinely secure (unforgeable from the
  client, verified server-side) at this project's scale. Ask if you want
  custom claims built later.
- **Not yet done** (flagged honestly, not silently skipped): book catalog
  pagination (the whole catalog loads on first visit), image
  optimization/WebP conversion, and route-level code-splitting for heavier
  pages (Checkout, Admin Dashboard, Analytics). These are performance
  improvements, not security issues — worth doing as a follow-up, not
  bundled into the security pass.
- **Desktop notifications** only fire while the admin has the site open in a
  browser tab (even in the background) — there's no push notification when
  the browser itself is closed. Adding that would mean setting up Firebase
  Cloud Messaging with a service worker, which is a reasonable next step if
  you want it.
- **Automatic refunds aren't wired up.** In the rare case stock runs out in
  the exact moment between a customer's payment succeeding and the order
  finalizing, the order is marked `stock_conflict_needs_refund` instead of
  silently failing — but issuing the actual refund via Razorpay is a manual
  step for now (check Admin → Orders for that status).
