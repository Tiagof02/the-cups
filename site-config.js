/* Public configuration only. NEVER put an API key, token or other secret here. */
window.CupsConfig = {
  // Paste the café's verified https://chat.whatsapp.com/... community invite here.
  whatsappCommunityUrl: '',
  // Direct, verified Google business/review URL. Never substitute a search result.
  googleReviewsUrl: '',
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
