# AEO Snapshot

AEO Snapshot is a paid-audit MVP for the current AI search visibility market. It turns a prospect
URL into a preview report with:

- AI visibility score, citation gap, entity clarity, schema readiness, and llms.txt readiness.
- Competitor comparison table.
- Priority fixes for the first 30 days.
- PDF export and a sales email draft.
- Configurable $149 order/payment CTA.

## Why This Wedge

The product sells a one-time diagnostic instead of a full monitoring subscription. One $149 sale is
enough to clear a $100 first-revenue target, and the buyer does not need a long procurement cycle.

Market signals used in the product:

- Gartner predicted search engine volume will drop 25% by 2026 because of AI chatbots and virtual
  agents.
- Pew Research reported Google users are less likely to click links when an AI summary appears.
- The Princeton GEO paper frames generative engine optimization as a measurable visibility problem.

## Run Locally

```bash
npm install
npm run dev
```

## Configure Sales Links

The static build works without a backend. For real sales, set one or both environment variables before
building:

```bash
VITE_PAYMENT_LINK="https://buy.stripe.com/..." npm run build
VITE_ORDER_URL="https://your-form-or-calendar-link" npm run build
```

If `VITE_PAYMENT_LINK` is missing, the app opens a prefilled GitHub issue request URL.

## Deploy To GitHub Pages

This repo is configured to use `/aeo-snapshot/` as the Vite base path when `GITHUB_PAGES=true`.

```bash
GITHUB_PAGES=true npm run build
```

The included GitHub Action builds the app and publishes the `dist` folder to Pages.
