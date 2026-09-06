/**
 * Demo documents for one-click import (English-only).
 * Covers all 4 categories: faq, policy, product, order_doc
 *
 * NOTE: order_doc is reserved for ACTUAL customer order documents
 * (uploaded individually, e.g. filename "ORD-20250520-001").
 * Internal process/policy documents must NOT use category "order_doc"
 * — they belong in "policy" or "faq" so they are never surfaced as orders.
 */
import type { Order } from "../_shared";

export interface DemoDoc {
  title: string;
  category: "faq" | "policy" | "product" | "order_doc";
  content: string;
}

export const DEMO_DOCS_EN: DemoDoc[] = [
  {
    title: "Return & Refund Policy",
    category: "policy",
    content: `[Return & Refund Policy]

1. Returns within 7 days for any reason (item must be in resellable condition).
2. Quality issues: returnable within 15 days, shipping covered by us.
3. Refund method: original payment method (WeChat / Alipay / bank card), 3-5 business days.
4. Not eligible for return: customized items, opened single-use consumables, downloadable digital goods.
5. Returns must include complete packaging and accessories, otherwise the refund amount may be reduced.
6. Some promotional items require returning the gift or paying back the discount difference.`,
  },
  {
    title: "How to Return an Item",
    category: "faq",
    content: `[How to Return an Item]

Q: How do I request a return?
A: Follow these steps:
1. On the order detail page, click "Request Return" and select a reason.
2. Once support approves (usually within 1 hour), a return number is generated.
3. Ship the item to the designated address (free pickup available for quality issues).
4. After warehouse inspection, refund completes within 1-2 business days.

Q: What's the return address?
A: The address is shown after approval — please don't ship before that.

Q: Who pays the return shipping?
A: Quality issues: covered by the platform (we provide a free pickup code). Otherwise, the customer pays.`,
  },
  {
    title: "Exchange Policy",
    category: "policy",
    content: `[Exchange Policy]

1. Exchange requests accepted within 15 days of receipt.
2. You can exchange for a different variant (color / size) or an equivalent item.
3. Quality issues: shipping covered by the platform. Otherwise, customer covers round-trip shipping.
4. Items must be in pristine condition with original packaging.
5. Processing time: new item ships within 3 business days of receiving the old one.
6. One exchange per order. After an exchange, returns are still allowed but no further exchanges.`,
  },
  {
    title: "Shipping & Delivery FAQ",
    category: "faq",
    content: `[Shipping & Delivery]

Q: How long does delivery take?
A: 2-4 days for most areas, 5-7 days for remote areas. Orders ship within 24 hours (except pre-orders / customized items).

Q: Which carriers do you use?
A: SF Express / YTO Express / ZTO Express by default. Specifying a carrier is not supported.

Q: How do I track shipping?
A: Real-time tracking on the order detail page, or use the tracking number on the carrier's website.

Q: What if the package arrives damaged?
A: Take a photo and contact support within 48 hours of delivery — we'll prioritize replacement or refund.

Q: Can I change the delivery address?
A: Before shipping: yes. After shipping: contact the carrier for redirection (at your cost).`,
  },
  {
    title: "Shipping Fees",
    category: "policy",
    content: `[Shipping Fees]

1. Free shipping on orders ≥ ¥99 (≥ ¥199 for remote areas).
2. Below threshold: flat ¥8 shipping fee.
3. Remote areas (Xinjiang, Tibet, Hainan, etc.): +¥10 surcharge.
4. Bulky items (> 5kg): priced individually, actual rate shown at checkout.
5. Return shipping: free for quality issues, customer pays otherwise (~¥8-15).
6. Exchange shipping: free for quality issues, customer covers round-trip otherwise.`,
  },
  {
    title: "Warranty Policy",
    category: "policy",
    content: `[Warranty Policy]

1. Electronics: 1-year warranty for the main unit, 6 months for the battery.
2. Accessories (eartips / straps / cables): 3-month warranty.
3. Coverage: quality defects under non-human-error conditions.
4. NOT covered: water damage, drops, disassembly, unauthorized repairs.
5. Method: mail-in repair (you cover outbound shipping, we cover return shipping).
6. Out-of-warranty repairs available at quoted cost (we'll confirm before proceeding).
7. Confirmed quality defects within warranty: choose replacement or refund.`,
  },
  {
    title: "Wireless Noise-Cancelling Headphones Pro",
    category: "product",
    content: `[Product: Wireless Noise-Cancelling Headphones Pro]

Model: EP-2024-PRO
Price: ¥899
Colors: Starry Black / Moonlight Silver / Aurora Blue

Specifications:
- Noise cancelling: Hybrid ANC -42dB
- Battery: 8 hours per charge, 36 hours with case
- Bluetooth: 5.3, multi-device pairing
- Driver: 40mm composite diaphragm
- Weight: 250g (with headband)
- Water resistance: IPX4

In the box: headphones x1, charging case x1, Type-C cable x1, replacement eartips x2 pairs, manual x1

Common Issues:
- Buzzing during noise cancellation? Reset and re-pair. Persistent issues qualify for exchange.
- Unstable connection? Make sure firmware is up to date (check in the app).
- Uncomfortable fit? Try a different eartip size.`,
  },
  {
    title: "Smart Watch Ultra",
    category: "product",
    content: `[Product: Smart Watch Ultra]

Model: SW-ULTRA-49
Price: ¥3999
Materials: Titanium case / sapphire crystal
Size: 49mm

Key Features:
- Health: heart rate, SpO2, body temperature, ECG
- Sports: 100+ modes, dual-frequency GPS
- Battery: 14 days regular use, 8 days workout mode
- Water resistance: 100m (swimming / snorkeling)
- Display: LTPO OLED, always-on
- Connectivity: Bluetooth 5.3 + WiFi

In the box: watch x1, magnetic charging cable x1, quick start guide x1

Compatibility: iOS 15+ / Android 10+
Bands: standard 22mm interchangeable bands (original nylon/silicone/metal recommended)

Notes:
- Charge fully and complete pairing on first use
- ECG must be activated in the app (not available in some regions)
- Water resistance degrades over time; avoid hot water environments`,
  },
  {
    title: "Mechanical Keyboard K8",
    category: "product",
    content: `[Product: Mechanical Keyboard K8]

Model: KB-K8-87
Price: ¥599
Layout: 87 keys / TKL compact
Colors: Black / White
Switch options: Red (linear) / Brown (tactile) / Blue (clicky)

Specifications:
- Connectivity: USB-C wired / Bluetooth 5.1 / 2.4GHz tri-mode
- Battery: ~200 hours over Bluetooth (backlight off)
- Backlight: RGB full color, customizable effects
- Keycaps: PBT double-shot, no greasing
- Tilt: 3-stage feet
- Hot-swappable: yes (switches user-replaceable)

In the box: keyboard x1, USB-C cable x1, 2.4GHz receiver x1, keycap puller x1, spare keycaps x4

Maintenance:
- Clean keycap gaps regularly with an air blower
- Avoid liquids; if spilled, immediately unplug and dry upside down
- Lube switches every ~6 months (optional)`,
  },
  {
    title: "Order Anomaly Handling Guidelines",
    category: "policy",
    content: `[Order Anomaly Handling Guidelines]

1. Shipping delay (>48h):
   - System auto-alerts the warehouse
   - Beyond 72h, support contacts the customer with compensation (coupons / priority shipping)

2. Logistics anomalies (>7 days without update):
   - Support verifies with the carrier
   - Confirmed loss: immediate replacement or full refund
   - Compensation: ¥10 unrestricted coupon

3. Delivery confirmation issues (not received personally):
   - Verify with courier whether someone signed on your behalf
   - Confirmed loss: replacement within 48h

4. Missing items in package:
   - Verify package weight
   - Confirmed shortage: ship missing items + ¥5 coupon

5. Wrong item shipped:
   - Customer keeps the item, we ship the correct one for free
   - If customer wishes to return the wrong item, free pickup is provided`,
  },
  {
    title: "Bulk Orders & Enterprise Procurement",
    category: "policy",
    content: `[Bulk Orders & Enterprise Procurement]

Eligibility: single orders of 10+ items or monthly purchases ≥ ¥5,000

Benefits:
- Bulk discounts: 5% off for 10-49, 10% off for 50-99, custom pricing for 100+
- Dedicated account manager
- Priority shipping: orders processed first, ship same-day
- Corporate invoicing: VAT special invoices supported
- Net-30 terms available for contracted customers

How to apply:
1. Contact support with note "Enterprise Procurement"
2. Provide business license and contact info
3. Sign procurement agreement to activate enterprise account

Special return / exchange terms:
- Bulk orders: partial returns supported (must keep at least 50%)
- Customized items: not returnable
- Exchanges must be done in one shot (no piecemeal exchanges)`,
  },
];

/** Demo orders — Chinese set */

/** Demo orders */
export const DEMO_ORDERS_EN: Order[] = [
  {
    orderId: "ORD-20250520-001",
    userId: "default",
    items: [
      { productId: "P001", name: "Wireless Noise-Cancelling Headphones Pro", specs: "Starry Black / Active NC", quantity: 1, price: 899 },
    ],
    totalAmount: 899,
    status: "delivered",
    createdAt: "2025-05-20T10:30:00Z",
    updatedAt: "2025-05-22T14:00:00Z",
    trackingNumber: "SF1234567890",
    carrier: "SF Express",
  },
  {
    orderId: "ORD-20250518-002",
    userId: "default",
    items: [
      { productId: "P002", name: "Smart Watch Ultra", specs: "Titanium / 49mm", quantity: 1, price: 3999 },
      { productId: "P003", name: "Watch Band (Nylon)", specs: "Midnight Blue", quantity: 2, price: 129 },
    ],
    totalAmount: 4257,
    status: "shipped",
    createdAt: "2025-05-18T08:00:00Z",
    updatedAt: "2025-05-19T16:30:00Z",
    trackingNumber: "YT9876543210",
    carrier: "YTO Express",
  },
  {
    orderId: "ORD-20250515-003",
    userId: "default",
    items: [
      { productId: "P004", name: "Mechanical Keyboard K8", specs: "Red Switch / 87-key / White", quantity: 1, price: 599 },
    ],
    totalAmount: 599,
    status: "delivered",
    createdAt: "2025-05-15T12:00:00Z",
    updatedAt: "2025-05-17T09:00:00Z",
    trackingNumber: "ZT1122334455",
    carrier: "ZTO Express",
  },
  {
    orderId: "ORD-20250510-004",
    userId: "default",
    items: [
      { productId: "P005", name: "Portable Power Bank 20000mAh", specs: "White / 65W Fast Charge", quantity: 1, price: 299 },
      { productId: "P006", name: "Type-C Cable", specs: "1.5m / Braided", quantity: 3, price: 39 },
    ],
    totalAmount: 416,
    status: "pending",
    createdAt: "2025-05-10T18:00:00Z",
    updatedAt: "2025-05-10T18:00:00Z",
  },
];

// ─── Helpers (English-only; locale param kept for backward compatibility) ───

export type DemoLocale = "en";

export function getDemoDocs(_locale?: DemoLocale): DemoDoc[] {
  return DEMO_DOCS_EN;
}

export function getDemoOrders(_locale?: DemoLocale): Order[] {
  return DEMO_ORDERS_EN;
}

// Backward-compat default exports
export const DEMO_DOCS = DEMO_DOCS_EN;
export const DEMO_ORDERS = DEMO_ORDERS_EN;
