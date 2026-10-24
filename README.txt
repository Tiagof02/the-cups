FINAL REFINEMENTS — 24 October 2026
Menu images: identical 145 x 145px squares; Merch images: matching square frames.
Hero/display headings: decorative periods removed, hero line break preserved.
Nata promotion: definite free welcome treat for first 50 eligible customers;
copy only, no new tracking or changes to discount eligibility logic.

FINAL CONTENT UPDATE — 24 October 2026
See FINAL-CONTENT-UPDATE.txt for the complete change list, image mapping and QA.
13 supplied menu photos; 3 display-only Merch images; 8 EN/PT/DE FAQs.
Merch and FAQ navigation links; sections numbered 01–10; heading full stops removed.

THE CUP'S — UPDATED COMPLETE WEBSITE · 15 OCTOBER 2026

RUN / REPLACE YOUR WEBSITE
1. Extract the-cups-local.zip.
2. Copy EVERYTHING INSIDE the-cups-local into your existing repository's site
   root, replacing matching files. Keep your repository's own .git directory.
3. In VS Code, open index.html with Live Server, or commit/push the files through
   your normal GitHub Pages workflow. No build or npm install is needed to run.

All asset paths remain relative, compatible with /the-cups/ on GitHub Pages.
This delivery has not been pushed to GitHub or published. Existing demo accounts
remain compatible when served from the same origin (hostname and port). Do not
clear storage when replacing the files. HTTPS/localhost is required for Web Crypto.

LATEST SMALL CORRECTIONS
- Why The Cup's? now sits immediately below the orange/cream hero ticker and
  above How it works / Three taps to pickup.
- Neighborhood copy and WhatsApp invitation are grouped inside Community.
- Customer Testimonials is a distinct visible section with an honest empty state.
- Section numbers automatically follow page order, 01 through 09, in EN/PT/DE.
- FAQ language matching is improved and a response-language selector supports
  English, Portuguese, German, Spanish and French. This remains a limited FAQ
  assistant; arbitrary-language general AI still requires the configured backend.

WHAT'S NEW
1. Why The Cup's? section: convenience, personal service, everyday value and
   local connection, with desktop/mobile navigation and an ordering CTA.
2. Quick Picks is the first/default category: the existing espresso (EUR 0.75),
   nata (EUR 1.20) and croissant (EUR 1.50), with existing cart/favorite controls.
3. First-nata popup: delayed, dismissible, translated and frequency-limited.
   Claim, add a nata, and ONE nata is deducted from the first demo order.
   Discounted totals are shown in the basket, checkout and account history.
4. Welcome-back popup: a genuine return after 30 minutes away; at most daily.
   Uses real order history for Order Again, or favorites/menu when appropriate.
   It never stacks with the nata offer or an account/payment/chat dialog.
5. Floating FAQ helper: real catalog prices and café information, suggested
   questions, typing indicator, close/reopen and EN/PT/DE UI. Common English,
   Portuguese, German, Spanish and French questions are supported. It is
   explicitly labelled FAQ, not live AI. Optional secure proxy configuration.
6. Sourced-testimonial renderer: three responsive cards, optional supported
   ratings, attribution and source links. No verified quotes were available;
   the old untraceable quotes/rating claims are removed. Until sources are
   provided, this area shows a clear reviews-coming-soon message and feedback link.
   Neighborhood copy is grouped with the existing Community section.
7. Order for Pickup: immediately visible orange hero CTA; persistent header CTA
   now leads straight to the menu. Existing compact mobile header retained.
8. WhatsApp Community invitation: voluntary membership copy and validated URL
   configuration, separate from the existing café support link. No invitation
   URL was supplied, so it honestly displays 'coming soon'.

Every new interface element is translated into EN / Portuguese (Portugal) / DE.
Language changes do not clear the cart, reset forms or trigger new popups.
The exact hero PNG, fonts, prices and existing base styles are unchanged.

CONFIGURATION / EXTERNAL REQUIREMENTS
Edit site-config.js. It contains PUBLIC settings only, never secrets.
- whatsappCommunityUrl: the real https://chat.whatsapp.com/... invitation.
- reviews and googleReviewsUrl: verified review excerpts/attribution/source URLs.
- chatEndpoint: optional HTTPS backend/serverless proxy. Blank = working FAQ.
- firstNataEnabled: enable/disable the university demo first-order offer.
See IMPLEMENTATION.md for review fields, proxy contract and source decisions.

PROTOTYPE LIMITATIONS RETAINED
Accounts, preferences, favorites, history and stamps remain browser-local.
Authentication is a demonstration, not production security. Use fictional
identity details and a demo-only password. No server receives orders or payments.
There is no live stock/capacity system, real newsletter or payment processing.
The existing product options are descriptive labels, not configurable line-item
modifiers. The update does not invent ingredients, surcharges or availability.
The menu now uses supplied, optimized WebP product photos. The promotional
pop-up retains its existing decorative illustration. See assets/content-manifest.json
for the supplied filenames and their menu/merch asset mappings.
Uncompleted carts do not survive refresh, matching the previous implementation.

Promotion eligibility can only be checked in this browser/account; clearing data
or changing device defeats it. It cannot enforce a real one-per-person offer.
The project gives a first-online-order nata offer, but no complete approved terms,
minimum spend or exact launch dates. This demo invents none of those restrictions
and does not make marketing consent mandatory. Confirm live rules with the café.

PAYMENT TEST DETAILS
Card: 4242 4242 4242 4242 or 5555 5555 5555 4444
Expiry: 12/30     CVV: 123     MB WAY: +351 900 000 000
The modal has a Fill test details control. Use ONLY these public test details.
Apple Pay / Google Pay simulate confirmation without opening real wallets.
Payment values are transient, never saved in an order or sent to chat.

PICKUP / ACCOUNTS / LOYALTY
The three next available slots, same-day schedule, past-slot disabling and one
shared selection are preserved. Lisbon time and the 15-minute preparation buffer
remain. Existing weekday/weekend hours and midnight handling are unchanged.
Signup requires first name, last name, email and password. Preferences, usual
pickup time and marketing consent remain optional. Guest checkout remains open.
Existing loyalty is unchanged: one stamp per completed demo order with a drink;
seven stamps show a demo reward. There is no real loyalty redemption service.
Orders are retained up to 50; the account shows the latest 10. Order Again adds
items to the current basket at current catalog prices, without replaying discounts.

VERIFICATION — THIS UPDATE
npm test passed:
- 2,636 existing-flow / translation assertions (many are dictionary checks).
- 221 new-feature assertions.
- 183 responsive CSS assertions at 320, 375, 390, 430, 560, 768, 1024, 1366px.
JS syntax, local asset paths and anchor targets passed. No build step is required.
Hero PNG and all existing brand/font assets are unchanged from the repository.

These are DOM simulations and source-level CSS checks. Rendered desktop/mobile
browser QA could not be run in this session because the required browser-control
capability was unavailable. Previous version's browser results DO NOT validate
these additions. No current pixel-matching/no-overlap/Safari claim is made.
The updated optional browser test is included but was NOT run in this session.

HOW TO TEST EACH FEATURE
Use a separate browser profile with fictional details. Keep your normal account
storage intact. Detailed test instructions are in IMPLEMENTATION.md.
- Open Why The Cup's? from both navigations and use its order button.
- Quick Picks: add all three, change/remove quantities, then try other categories.
- New browser: wait 12 seconds away from the cart and other open dialogs. Dismiss
  the offer, reload: it should not repeat. The basket offer link remains available.
- Claim, add two natas and an espresso: subtotal EUR 3.15, discount EUR 1.20,
  total EUR 1.95. Finish checkout; another order must not get the discount.
- Return after 30 minutes away: welcome message. For a logged-in buyer, Order
  Again adds the previous products. Reloads/anchor changes must not trigger it.
- Ask the helper about espresso, allergens, hours and pickup in different languages.
- In a test copy, configure genuine sourced reviews and a community invite; check
  source links, translations and voluntary joining. Empty settings show no fake data.
- At 375/390/430px and desktop, check menu/account panels, popup scrolling, chat,
  sticky header, keyboard focus, overflow and the complete guest/account checkout.

OPTIONAL DEVELOPER TESTS
npm ci
npm test
For rendered checks on your machine:
npm install --no-save playwright
npx playwright install chromium
npm run test:browser
CHROMIUM_EXECUTABLE may point to an existing compatible Chromium binary.
Test packages are development-only; the website itself adds no dependencies.

RESET ONLY A DISPOSABLE TEST PROFILE
Local Storage: thecups.demo.v2 (accounts) and thecups.visitor.v1 (visits/offer).
Session Storage: thecups.visit.v1 (per-visit popup frequency).
Removing these deletes this demo data. Never clear unrelated website storage.
