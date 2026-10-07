THE CUP'S — LOCAL WEBSITE, STAGE 2

RUN IN VS CODE
1. Extract the complete ZIP archive.
2. Open the the-cups-local folder in VS Code (File > Open Folder).
3. Right-click index.html and select Open with Live Server.
4. Use http://localhost:5500 or http://127.0.0.1:5500 (your port may differ).
No npm installation, build step, Canva account or backend is needed to use
this website. Keep the whole folder together, including assets.

Use the same browser, hostname and port each time for saved demo accounts.
Browser storage belongs to the website origin: localhost and 127.0.0.1 have
separate storage. Use fictional account details and a demo-only password.

WHAT WAS ADDED
- Real EN / European Portuguese / German switching throughout the storefront,
  account forms, product labels, cart, order history, FAQ, accessibility labels
  and feedback. Language choice persists. Currency and dates use the chosen
  locale. Brand names, addresses and product identities remain intact.
- Optional Create account / Log in controls in the existing header, plus a
  scrollable account dialog in the same colors, fonts, borders and button style.
- First/last name, email and password; optional age range; favorite drink/food
  categories, optional dietary preferences, pickup location and usual time;
  optional marketing consent, unchecked by default.
- Editable profile/preferences, persistent login and logout, favorites, recent
  demo orders and loyalty stamps. Only the real baseline Laranjeiras location
  is offered. Usual pickup times use the original available demo slots.
- Product hearts, a small personalized favorites area above the menu, repeat
  ordering and a first-name greeting. Guest checkout remains available.

DEMO BEHAVIOR
Completed logged-in orders are saved to the current customer's history, then
the basket is cleared to prevent accidental duplicate confirmations. The
latest 50 orders are stored; the profile shows the latest 10. Repeat ordering
adds those items to the current basket at current catalogue prices.

One stamp is awarded for each completed demo order containing a drink,
including a bundle with a drink. Seven stamps earn one demonstration reward.
The original loyalty section remains; guests see its original example card.
Rewards are displayed only, with no real discount or redemption service.

Each customer's profile, favorites, history and stamps are separate. Logout
clears the current basket and customer UI but retains that customer's saved
data for a later login. Refresh retains login, language and saved account data;
the uncompleted basket itself is not persisted.

PROTOTYPE LIMITATIONS
This is front-end demonstration authentication, not a secure production
account system. Passwords are not saved as plain text: a random salt and a
PBKDF2-SHA256 verifier are stored. Nonetheless, anyone controlling the browser
can inspect or change the local profile data and session. There is no real
identity verification, password recovery, encryption of profile data, backend,
cross-device synchronization, payment, order transmission or email service.
Web Crypto requires localhost/127.0.0.1 or HTTPS; do not run the account demo
from an untrusted LAN HTTP address.

Marketing consent is a stored preference only. Newsletter signup does not
send email; for a matching signed-in email it also saves the marketing opt-in.
Community votes and coffee-break registration retain their original local
feedback behavior. Pickup availability and opening hours are baseline sample
content, not a live service. Existing generic social links and privacy/terms
anchors are preserved. No unrelated pages or real services were invented.

BASELINE PRESERVED
This update extends the reconstructed project in place. The original
styles.css and bundled fonts are unchanged. All 13 products/prices, existing
sections, original CSS illustrations, links, menu filters, pickup options and
FAQ remain. Additional styling is isolated in account.css. The header wraps
to accommodate the requested account controls, and language controls are
available on small screens. Canva dependencies and the report dialog stay
removed.

FILES FOR FURTHER DEVELOPMENT
index.html        Existing storefront plus translation keys and account hooks.
styles.css        Unchanged original design and static Tailwind utilities.
account.css       Added account/personalization and responsive styles.
i18n.js           225 shared translation keys in EN, PT and DE.
products.js       Stable product IDs, categories, prices and translation keys.
account-store.js  Versioned local storage and password-verifier helpers.
app.js            Storefront, localization, profile and order interactions.
assets/           Local fonts and third-party licenses.
tests/            Optional automated DOM and responsive-CSS tests.
package.json      Development test dependencies only; not needed to run the site.

VERIFICATION
JavaScript syntax checks and automated functional tests passed for language
switching (including entered form values and messages), validation, account
creation/login/logout, favorites, profile/consent editing, simulated refresh
with retained storage, customer isolation, order history, repeat orders,
loyalty milestones, guest checkout, FAQ, newsletter and storage failures.
Translation-key and interpolation coverage is checked for all three languages.
The suite currently passes 1,569 assertions, mostly translation coverage.

An additional 73 source-level responsive CSS assertions pass at 320, 375, 390,
560, 768, 1024 and 1366px: form columns, header layout, language control
visibility, product columns, wrapping and dialog sizing/scrolling.

These are DOM simulations and CSS checks, not rendered browser tests. The
environment blocked local browser preview, so actual desktop/mobile rendering
and native keyboard/dialog behavior remain to be visually checked in a browser.
The project does not claim a completed mobile screenshot comparison.

Optional developer tests (Node.js): run npm install, then npm test.
For a browser smoke check: switch each language; create a fictional account;
save favorites; place a demo order; refresh; inspect My account; log out and
back in. At a narrow phone width, check header controls and scroll through
the account form. No real customer data is needed.

RESET ONLY THIS DEMO'S DATA
In browser developer tools for this local website, remove the Local Storage
entry named thecups.demo.v2, then refresh. This removes every demo account,
session, preference, favorite and order saved by this version in that origin.
Do not clear unrelated website storage.
