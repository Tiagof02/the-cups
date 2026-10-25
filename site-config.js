/* Public configuration only. NEVER put an API key, token or other secret here. */
window.CupsConfig = {
  // Paste the café's verified https://chat.whatsapp.com/... community invite here.
  whatsappCommunityUrl: '',
  // Direct, verified Google business/review URL. Never substitute a search result.
  googleReviewsUrl: "https://www.google.com/maps/place/The+Cup's+Cafe+%26+Snack+Bar/@38.74727,-9.1723696,17z/data=!4m10!1m2!2m1!1sThe+Cup's+Cafe+%26+Snack+Bar+Lisboa!3m6!1s0xd1933007a8538b1:0x22338e7077c36a03!8m2!3d38.74727!4d-9.1678635!15sCiFUaGUgQ3VwJ3MgQ2FmZSAmIFNuYWNrIEJhciBMaXNib2FaIyIhdGhlIGN1cCdzIGNhZmUgJiBzbmFjayBiYXIgbGlzYm9hkgELY29mZmVlX3Nob3CaASNDaFpEU1VoTk1HOW5TMFZKUTBGblNVUTNkbVZZVVVKUkVBReABAPoBBAgAEEw!16s%2Fg%2F11lmdxz9v1?entry=ttu&g_ep=EgoyMDI2MTAyMC4wIKXMDSoASAFQAw%3D%3D",
  // Add sourced/approved reviews only. Shape documented in IMPLEMENTATION.md.
  reviews: [],
  // Optional HTTPS server-side chat proxy; blank keeps the working local FAQ mode.
  chatEndpoint: '',
  // First-online-order nata: university demo only; no undocumented minimum spend,
  // coupon, newsletter-consent requirement or calendar expiry is invented.
  firstNataEnabled: true,
  popupDelayMs: 12000,
  returnVisitGapMs: 30 * 60 * 1000,
  welcomeCooldownMs: 24 * 60 * 60 * 1000,
  offerDismissalMs: 7 * 24 * 60 * 60 * 1000
};
