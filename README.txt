THE CUP'S — LOCAL WEBSITE, STAGE 3 · TRANSPARENT CUP / QUICK PICKUP SLOTS

RUN IN VS CODE
1. Extract this complete archive and open the the-cups-local folder in VS Code.
2. Right-click index.html and choose Open with Live Server.
3. Use localhost or 127.0.0.1; keep the same hostname and port for saved data.
No npm installation, build, Canva account or backend is needed. All styles,
fonts, images and JavaScript are local. Keep the folder and assets together.

UPDATING YOUR EXISTING DEMO
Replace the project files, then serve them from the SAME browser origin as
before. The existing thecups.demo.v2 storage key/schema is retained: accounts,
password verifiers, favorites, preferences, orders and stamps are preserved.
Do not clear browser storage when updating. Different hostnames/ports use
separate browser storage. Use fictional account details and a demo password.

PRESENTATION-INSPIRED VISUAL UPDATE
The supplied The Cup's Presentation is now the visual reference. The project
was extended in place, preserving the catalog, sections and working flows.
- Original dark/light wordmarks, coral wave and pink splash extracted from
  the supplied presentation. The hero uses the supplied transparent PNG directly, byte-for-byte,
  without cropping or modification. Its natural proportions are preserved on
  the existing cream background, with no card, backdrop or sticker.
- Presentation palette: cream #F7EDE2, brown #2B1912, coral #FF5A3C and pink
  #FFB1C8, with a muted green supporting accent.
- Local League Spartan display headings and DM Sans interface typography.
- Cream hero, rounded white header and product cards, pink order/loyalty
  panels, organic wave accents, softer borders and larger tap targets.
- Existing product CSS illustrations remain. Functional language capitalization
  is preserved, including German. Order for Pickup remains the primary CTA.

ACCOUNT VALIDATION
First name, last name, email and password are required for account creation.
Blank/whitespace-only required fields are all highlighted and creation is
blocked with a translated message. Email syntax and password length (8–128
characters) are checked. Age, drink/food categories, dietary preferences,
pickup location, usual pickup time and marketing consent are ALL optional.
Consent starts unchecked. Names remain required when editing the profile.

PICKUP TIMES
Pickup orders are for the current Lisbon calendar day only. Three quick-access
boxes show the earliest three available slots; the first is labelled Next
available and selected by default. Near closing, only the remaining valid
slots are shown (one or two if fewer than three remain). No tomorrow slots
are manufactured. The quick boxes always track the earliest available slots,
even if the customer selects a later time in the expanded schedule.

More times opens a compact scrollable dropdown with the full daily schedule;
it is closed by default. Quick buttons, dropdown selection, selected-time
feedback, hero banner, cart pickup summary and checkout share one selected
slot. If a later dropdown time is outside the quick boxes, none of those boxes
is falsely marked selected. All labels are translated in EN/PT/DE. Saved
usual-time preferences remain editable but do not override the earliest default.
Labels contain HH:MM only.

Past times and slots within the existing 15-minute preparation allowance
remain visible but are disabled and greyed out. Future selectable times are
in 15-minute intervals. The opening hours remain unchanged: weekdays 08:00,
weekends 08:30, until 00:30. To enforce the same-calendar-day rule, the full
list is 00:00, 00:15 (today's early-morning service), then 08:00/08:30 through
23:45. At an afternoon visit the early-morning slots are therefore disabled;
no tomorrow slots, dates or date selector are displayed.

If no time remains today, checkout is disabled and a localized message is
shown. No order is shifted to tomorrow. The clock refreshes automatically,
on tab focus and before slot selection/checkout. A midnight rollover replaces
the schedule with the new CURRENT day; stale IDs cannot select a past/future
day. An expired selection moves to the next valid slot, or becomes unavailable
if none remain. Availability remains simulated, with no live capacity service.

SIMULATED PAYMENT — NO REAL PAYMENT DETAILS
Checkout opens a translated branded modal showing the total, pickup time
and location. Choose MB WAY, Card (Visa/Mastercard), Apple Pay or Google Pay.
Card/MB WAY fields accept ONLY the public dummy details below. Use the
"Use test details" button to fill them. Never enter real payment information.

Visa test number:       4242 4242 4242 4242
Mastercard test number: 5555 5555 5555 4444
Test expiry:           12/30 (fixed demo fixture, not a real expiry check)
Test CVV:              123
MB WAY test phone:     +351 900 000 000

Apple Pay and Google Pay simulate payment without opening a real wallet.
No processor, SDK, wallet, SMS or MB WAY service is contacted. Payment inputs
stay transient in the modal, are discarded on method change/close/success,
and are never written to storage, sent over the network or included in orders.
Only the method name (e.g. "card") is saved with a signed-in demo order.

A successful demo payment displays an order number and pickup time,
clears the cart, and saves the order/stamps if logged in. Guest checkout is
fully available without an account. Canceling retains the cart and creates
no order. No real money moves and the café does not receive or prepare orders.

FEATURES RETAINED
EN / European Portuguese / German switching covers all original and new
interface text, forms, messages, accessible labels and payment controls.
Language changes preserve entered form values. Language/account state persists.
Names, email, preferences, marketing choice, product favorites, personalized
greetings, recent history and reorder remain available in My account.
The latest 50 orders are stored; the profile shows 10. Reorder adds products
to the current basket at current catalog prices.

The existing loyalty rule is retained: one stamp per completed demo order
containing a drink, including drink bundles. Seven stamps display one demo
reward. Rewards have no real discount/redemption service. Guests see the
original example stamp card. Logout clears the basket/customer UI but keeps
saved account data for later login. Uncompleted carts do not survive refresh.

PROTOTYPE LIMITATIONS
Authentication is a front-end demonstration, not production security.
Passwords use a random salt and PBKDF2-SHA256 verifier rather than plaintext;
anyone controlling the browser can still inspect/edit local data and sessions.
There is no backend, identity verification, password recovery, cross-device
sync, live inventory, real payment, order transmission or email service.
Web Crypto requires localhost/127.0.0.1 or HTTPS. Avoid an insecure LAN URL.
Newsletter signup and community interactions provide local demo feedback;
marketing consent is only a saved preference. Existing generic social links
and privacy/terms anchors remain. The hero cup contains no lettering; the functional interface switches languages.

FILES
index.html        Existing storefront and dialogs.
styles.css        Original layout/utilities, updated brand color values.
account.css       Existing account and personalization structure.
brand.css         Presentation identity, responsive styling, payment/slot UI.
i18n.js           Shared EN/PT/DE translations; add keys to all three locales.
products.js       Stable products/categories/prices/translation keys.
account-store.js  Compatible local account storage and password verification.
pickup-times.js   Lisbon-time demo schedule and 15-minute intervals.
app.js            Localization, account, cart, favorites, pickup and checkout.
assets/           Local fonts/licenses and presentation brand artwork.
tests/            Optional automated DOM and responsive-CSS tests.

VERIFICATION
2,056 DOM/translation assertions pass, including all required blank fields in
EN/PT/DE, optional-only preferences, signup, login/logout, profile editing,
favorites, refresh persistence, customer isolation, pickup dropdown/intervals,
Card and MB WAY dummy validation, four payment methods, guest/signed-in orders,
payment input disposal, history, reorder, loyalty, FAQ and storage errors.
Most assertions check translation coverage; these are DOM simulations.
91 source-level responsive CSS assertions pass at 320, 375, 390, 560, 768, 1024
and 1366px. Additional checks cover the complete same-day schedule, disabled
past slots, consistent time selection, late-day closure, midnight rollover and
Lisbon daylight-saving boundaries. The hero PNG matches the attachment byte-for-byte, including its alpha
transparency; responsive CSS preserves its aspect ratio. Checks also cover
quick-button selection in EN/PT/DE, synchronization with the full schedule,
cart and checkout, and one/two-slot end-of-day availability.
JavaScript syntax and local asset references also pass.

Actual desktop/mobile screenshots and native dialog/select behavior could not
be verified in this environment: no runnable browser was available and the
browser download endpoint returned HTML instead of the browser archive.
CSS/DOM checks are not a substitute for rendered browser QA.

Optional developer tests: npm install, then npm test (Node.js).
Suggested browser smoke check in Live Server:
- At desktop and 390px/320px mobile widths, switch EN/PT/DE and scroll sections.
- Submit blank signup: four required fields highlight. Enter the four core
  details only; leave all preferences empty/default and create the account.
- Edit preferences, favorite a product, reload, log out/in, verify saved state.
- Expand the pickup arrow, choose a later slot, add a drink and check total.
- Try invalid/empty payment fields; then use test details to complete Card
  and MB WAY. Verify pickup, history, stamps and Order again.
- Cancel checkout once: the cart should remain and no order should be saved.
- Log out, repeat guest checkout, and try Apple Pay/Google Pay demo buttons.
- Verify the cart, FAQ, keyboard focus, modal scrolling and tap targets.

RESET ONLY THIS DEMO
Remove the Local Storage entry thecups.demo.v2 in browser developer tools,
then refresh. This deletes this demo's accounts, preferences, favorites,
sessions and order history. Do not clear unrelated website storage.
