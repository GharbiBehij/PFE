class RouteNames {
  const RouteNames._();

  // ── Auth ────────────────────────────────────────────────────────────────
  static const login = '/login';
  static const signup = '/signup';
  static const register = '/register'; // alias kept for backward compat

  // ── Shell tabs (bottom nav) ──────────────────────────────────────────────
  static const home = '/home';
  static const myEsims = '/my-esims';
  static const profile = '/profile';

  // ── Offer browsing (inside shell — bottom nav visible) ───────────────────
  static const destinations = '/destinations'; // country grid
  static const search = '/search';             // search bar + results

  // ── Offer flow (outside shell — no bottom nav) ───────────────────────────
  // /packages/:countryId  → list of packages for a country
  // /package/:packageId   → package detail
  // /payment/:packageId   → checkout
  // /success              → post-payment confirmation
  static String packages(String countryId) => '/packages/$countryId';
  static String package(String packageId) => '/package/$packageId';
  static String payment(String packageId) => '/payment/$packageId';
  static const success = '/success';

  // ── eSIM management (inside shell) ───────────────────────────────────────
  static const esimList = '/my-esims';           // same as myEsims tab
  static String esimDetail(String id) => '/my-esims/$id';
  static const sellEsim = '/sell-esim';
  static const buyEsim = '/buy-esim';

  // ── Wallet / finance (outside shell) ─────────────────────────────────────
  static const wallet = '/wallet';
  static const topup = '/wallet/topup';
  static const adminTopup = '/admin/topup';

  // ── Dashboard / usage ────────────────────────────────────────────────────
  static const dashboard = '/dashboard';
  static const usage = '/usage';
  static const purchase = '/purchase';

  // ── Profile sub-screens (outside shell — no bottom nav) ─────────────────
  static const profilePersonal = '/profile/personal';
  static const profilePayment = '/profile/payment';
  static const profileSettings = '/profile/settings';
  static const profileHelp = '/profile/help';

  // ── Offers legacy alias ──────────────────────────────────────────────────
  static const offers = '/offers';
}
