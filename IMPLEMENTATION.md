# The Cup’s implementation notes

Delivered 15 October 2026 from repository commit `c0039edbba8264989c6eb0d76b4da92ef7d57582`.
The retrieved live GitHub Pages homepage matched the repository's original `index.html` byte-for-byte. This is an incremental update, not a rebuild, and has not been published.

## Source decisions

- **Working Document**, business concept, positioning, UX/UI, email marketing §16 and associated segmentation/calendar tables: order ahead, personal service, accessible prices, local campus/workday audience; a free nata on the first online order; optional accounts and marketing consent.
- **Digital Marketing Strategy Order-Ahead Webstore & Communication Plan — The Cup's**, pages 21–22 (UX/identity), 31–32 (first-order nata and opt-in email): consistent cream/brown/coral/pink identity, short checkout and repeat-order loop. Existing extracted assets and fonts remain unchanged.
- The plan mentions a first-order nata acquisition offer and a subscriber welcome message, but supplies no complete approved eligibility terms, exact launch dates, minimum basket or mandatory code. The implemented **university demo** uses one existing nata on the first completed online order, explicitly claimed, without inventing a minimum spend or forcing newsletter consent. An order consisting of one nata can therefore total €0.00. Validate official rules before a commercial launch.
- Repository product records remain authoritative for prices and IDs. The final content update adds supplied menu photographs; existing add handlers and product records are reused. No live stock rules were added. There are no functioning product modifiers to preserve beyond existing descriptive labels.
- The old testimonial quotations had no attribution or traceable sources. The strategy's historical aggregate rating does not verify individual quotes. Public searches did not yield verifiable matching review excerpts. No fabricated quotes, customer names or current rating statistics are published. The section supports three sourced cards but currently displays an explicit customer-review empty state.
- No WhatsApp Community invite or live AI backend credentials were present. The current customer-support WhatsApp link remains unchanged. No new external subscription or automatic group joining occurs.
- The existing loyalty implementation differs from the plan's proposed seventh-drink redemption. It is intentionally preserved: one stamp per qualifying demo order, and a displayed reward at seven stamps, with no real redemption.

## Files changed

| File | Change |
| --- | --- |
| `index.html` | Story anchor/section, Quick Picks tab, cart discount/offer/help controls, visit/chat dialogs, community invitation, sourced-review area, direct menu CTAs and new asset references. |
| `app.js` | Existing category filter extended to Quick Picks; one discount calculation for cart/payment/order; saved discounted history totals; narrow integration bridge for the feature module. |
| `i18n.js` | Removed unused, untraceable testimonial/rating strings. Other existing translations retained. |
| `package.json`, `package-lock.json` | Version 4.0 and test scripts; no added production or development dependencies. |
| `tests/interactions.cjs` | Loads new modules and expects the added story navigation anchor. Existing regression checks retained. |
| `tests/responsive.cjs` | Checks scoped new responsive rules alongside existing rules. |
| `tests/browser.cjs` | Optional rendered checks extended to story, Quick Picks, popup and chat; obsolete pixel-identical header comparison removed. Not executed in this session. |
| `README.txt` | Run/update instructions, feature overview, honest validation status and prototype limitations. |

## Files added

| File | Purpose |
| --- | --- |
| `site-config.js` | Public, editable external URLs, verified review records, optional AI endpoint and frequency controls. |
| `growth-i18n.js` | New EN/PT-PT/DE strings extending the existing dictionaries. |
| `growth.js` | Visitor frequency/eligibility, popup coordination, real demo discount, verified review rendering, community configuration, FAQ and optional proxy client. |
| `growth.css` | Scoped responsive styles; existing hero/mobile/account styles unchanged. |
| `tests/helpers.cjs`, `tests/growth.cjs` | DOM harness and new behavior tests. |
| `.gitignore` | Excludes dependencies, local secrets and OS files. |
| `IMPLEMENTATION.md` | This implementation, configuration and test guide. |

All unchanged files and assets are included in the ZIP. Copy the **contents** of `the-cups-local` into the repository root. Relative paths work under `/the-cups/`; there is no new deployment/build configuration.

## Visitor and promotion behavior

`thecups.demo.v2` retains its schema. Optional subtotal/discount/total/promotion fields on new orders are backward compatible; old history falls back to its original sum.

`thecups.visitor.v1` holds timestamps and boolean offer/completion flags, without email or name. `thecups.visit.v1` in sessionStorage prevents multiple automatic messages in one visit.

- New eligible visit: wait 12 seconds. Defer while another dialog, mobile panel or basket is visible, or the page is hidden.
- Dismissal: do not automatically show the offer for seven days. An explicit offer link in the basket remains available while eligible.
- Claim: persist claim first, then open Quick Picks. The customer adds a nata themselves. Until then, the UI says the offer is saved, not applied.
- Discount: only one nata's catalog price, regardless of quantity, calculated in integer cents. Remove natas and the discount disappears. The receipt/history records the actual discounted total.
- Redemption: only on completed demo checkout. Cancelled payment does not consume it. A completed ordinary first order also ends first-order eligibility. Existing accounts with prior orders are ineligible.
- Return: after at least 30 minutes away, show welcome instead of first-nata promotion, at most once per 24 hours. Leaving/refreshing updates last-seen time; section or language changes do not count as a return.
- Personalized CTA: latest actual order → existing Order Again; otherwise actual favorites → favorites area; otherwise → menu. No invented preferences.
- Guest tracking is browser-local. Shared-browser guests are treated conservatively as the same visitor. No static site can enforce one reward per real person across devices or cleared storage.

## Verified reviews

Leave `reviews: []` until evidence is available. Each approved record can contain:

```javascript
{
  name: "Approved public attribution",
  text: "Exact short sourced excerpt",
  language: "en",
  sourceUrl: "https://...", // actual review permalink; no placeholder in production
  verifiedAt: "YYYY-MM-DD", // actual verification date
  rating: 5,               // optional: only if supported by that individual review
  translations: { PT: "Accurate translated excerpt", DE: "Accurate translated excerpt" }
}
```

At most three cards render. Untranslated originals retain their language; provided translations are labelled. Text renders via `textContent`, never as arbitrary HTML. Fill `googleReviewsUrl` only with the verified Google business/review URL. The runtime checks URL form, **not factual authenticity**; a person must verify the evidence first.

## WhatsApp Community

Set `whatsappCommunityUrl` to the café's real `https://chat.whatsapp.com/...` invite. The Join button appears only for an HTTPS WhatsApp invitation; otherwise a translated coming-soon message appears. Click opens WhatsApp for the customer to decide whether to join. Existing `https://wa.me/351920588166` support links are untouched. The test suite uses an isolated fixture to verify the wiring; no test invite ships in the configuration.

## FAQ and live AI

Default FAQ mode sends no requests and is explicitly labelled **not live AI**. It recognizes common English, Portuguese, German, Spanish and French question patterns. This is limited intent matching, not general multilingual reasoning. Unknown questions get a truthful fallback. Menu prices are read from `CupsProducts`; pickup uses `CupsPickup`; unsupported ingredients/allergens are referred to the café. No ingredient, special, price or service is invented.

For genuine AI, deploy a separate HTTPS serverless endpoint and place **only its public URL** in `chatEndpoint`. GitHub Pages cannot run a secret-bearing backend. The client then POSTs:

```json
{
  "message": "customer question, at most 500 characters",
  "language": "EN",
  "history": [{"role": "user", "content": "recent chat only"}],
  "knowledge": {"business": "The Cup's", "menu": [], "demoOnly": true}
}
```

Return `200 application/json` with `{ "reply": "plain text answer" }`. The UI has a 10-second timeout, length/shape validation and FAQ fallback for errors. No API key, authorization secret, account object, password, saved order, payment field or cookie is sent. Questions typed by the customer are sent only when live mode is configured, and the visible notice explains this. Chat history stays in page memory.

The backend must:

1. Keep the model-provider secret in server environment/secret storage.
2. Allow only the intended origin (`https://tiagof02.github.io`) through CORS; handle preflight. Origins do not contain `/the-cups/`.
3. Apply rate/body limits, timeouts and abuse controls. CORS alone is not authorization.
4. Maintain a trusted server copy of the catalog/business facts. Treat all client fields, including `knowledge`, as untrusted; never let them override system instructions or prices.
5. Instruct the model to answer in the user's language, remain within verified café facts, admit unknowns, and never claim to place orders or charge payments.
6. Avoid logging customer messages by default; publish appropriate live-service privacy information.

No backend was deployed or credentials supplied. The proxy success/error paths were tested with stubs; real model responses and backend security remain unverified.

## Validation and manual checks

`npm ci && npm test` passed 2,636 existing-flow/translation assertions, 221 new-feature assertions and 183 responsive source assertions. Most original assertions are translation checks, not independent end-to-end scenarios. The tests cover account creation/validation/login/logout, persisted profiles, favorites, history, all demo payment methods, loyalty, same-day selection/clock boundaries, correct category products, quantity badges, discount arithmetic/redemption, popup frequency/priority, FAQ languages, secure-output handling and optional external configuration.

Source CSS checks cover 320, 375, 390, 430, 560, 768, 1024 and 1366px. They verify responsive columns, viewport-bounded dialogs, scrollable chat, tap-target sizes and retained mobile layout rules. **They do not measure actual overflow or overlap.** Rendered browser testing was unavailable under the current environment's supported workflow. The previous release's rendered results do not establish this version's compatibility. Physical iPhone/Safari testing remains outstanding.

Use a disposable browser profile, then repeat in EN/PT/DE at 375/390/430px and desktop:

| Feature | Manual check |
| --- | --- |
| Story / CTA | Open its link in desktop and hamburger menus; target clears the sticky header; order button opens menu. |
| Quick Picks | Three existing products; add each, alter quantities in basket; switch every original category; favorites remain linked to the same product. |
| Nata offer | Fresh profile: wait 12 seconds away from cart/dialogs. Close and reload; no repeat. Claim through basket, add two natas plus espresso: €3.15 subtotal, −€1.20 discount, €1.95 total. Cancel/reopen, then complete payment. A second order has no discount. |
| Welcome | Leave, return after 30 minutes; one welcome, not both popups. With account history, repeat order matches actual products. Without history, no invented order appears. |
| Helper | Open, send menu, allergen, opening-hour and pickup questions; try each supported language, unknown topics and close/reopen. Verify keyboard focus, mobile keyboard and scrollability. |
| Reviews | Add only genuine verified records in a test copy; check attribution, optional rating, translations and source links. Empty configuration shows no quotations/statistics. |
| WhatsApp | Configure the real invite in a test copy; verify destination and voluntary join. Café support still opens its original number. |
| Baseline | Required/optional signup fields, guest/account payments, later pickup time, account refresh, favorites, stamps and Order Again. |

Optional rendered runner: `npm install --no-save playwright`, `npx playwright install chromium`, then `npm run test:browser`. It uses 375/390/430/1366px and all site languages. It has been updated but was not executed in this environment.

## Follow-up corrections — 15 October 2026

Why The Cup’s? moved directly below the hero ticker, before How it works. The
neighborhood copy and WhatsApp invitation now belong to `#community`.
`#testimonials` has an explicit translated Customer Testimonials heading, an
honest pending-reviews state and a feedback link; supplied verified reviews
replace that empty state automatically.

Major section labels derive their consecutive 01–10 prefixes from actual DOM
order after every language change. This avoids stale manual numbering.

The FAQ now scores language cues across EN/PT/DE/ES/FR, recognizes additional
common questions, and has an explicit reply-language selector. Tests cover six
topics in each language and all five manual reply choices. Spanish/French catalog
labels are translated too. Automatic mode falls back to the site language for
ambiguous questions. For a configured AI proxy, Automatic sends `language: "auto"`
so the backend can detect languages outside those five; explicit selections send
the chosen code. This does not make the local FAQ a general AI service.

The follow-up passed 2,636 existing-flow/translation assertions, 221 feature
assertions and 183 responsive CSS assertions. Rendered testing remains unavailable;
no new desktop/mobile screenshot verification is claimed.

## Final content update — 24 October 2026

See FINAL-CONTENT-UPDATE.txt for the new photography, display-only Merch gallery, FAQ source integration and current QA results. The only app.js change translates image alt text; ordering and account logic are unchanged.

### Final refinements

Menu images now have fixed 145 × 145px display boxes. The existing pop-up
uses a 100 × 100px photo in its unchanged illustration band. The hero uses
a newline plus `white-space: pre-line` to retain its two-line layout without
decorative periods. The promotion is definite and limited to the first 50
eligible customers in copy only; no tracking mechanism was added.
