if (!self.define) {
  let e,
    s = {};
  const a = (a, i) => (
    (a = new URL(a + ".js", i).href),
    s[a] ||
      new Promise((s) => {
        if ("document" in self) {
          const e = document.createElement("script");
          ((e.src = a), (e.onload = s), document.head.appendChild(e));
        } else ((e = a), importScripts(a), s());
      }).then(() => {
        let e = s[a];
        if (!e) throw new Error(`Module ${a} didn’t register its module`);
        return e;
      })
  );
  self.define = (i, t) => {
    const n = e || ("document" in self ? document.currentScript.src : "") || location.href;
    if (s[n]) return;
    let c = {};
    const d = (e) => a(e, n),
      r = { module: { uri: n }, exports: c, require: d };
    s[n] = Promise.all(i.map((e) => r[e] || d(e))).then((e) => (t(...e), c));
  };
}
define(["./workbox-00a24876"], function (e) {
  "use strict";
  (importScripts(),
    self.skipWaiting(),
    e.clientsClaim(),
    e.precacheAndRoute(
      [
        { url: "/_next/static/chunks/13633bf0-8f3525ce57819081.js", revision: "8f3525ce57819081" },
        { url: "/_next/static/chunks/1582-6591845c1d7bdb9e.js", revision: "6591845c1d7bdb9e" },
        { url: "/_next/static/chunks/1886-56ad82c510eeb8c9.js", revision: "56ad82c510eeb8c9" },
        { url: "/_next/static/chunks/2350-ab9582bcb0d3f448.js", revision: "ab9582bcb0d3f448" },
        { url: "/_next/static/chunks/3476-84edcba500d1327c.js", revision: "84edcba500d1327c" },
        { url: "/_next/static/chunks/3794-9e97df58f799f86f.js", revision: "9e97df58f799f86f" },
        { url: "/_next/static/chunks/4036-80ad58d51027e651.js", revision: "80ad58d51027e651" },
        { url: "/_next/static/chunks/4147-e69a9b88fecddaf0.js", revision: "e69a9b88fecddaf0" },
        { url: "/_next/static/chunks/4172-fe1de93c4024cf8a.js", revision: "fe1de93c4024cf8a" },
        { url: "/_next/static/chunks/4468-1d8fa82300212d23.js", revision: "1d8fa82300212d23" },
        { url: "/_next/static/chunks/4bd1b696-43ba64781d20dbb7.js", revision: "43ba64781d20dbb7" },
        { url: "/_next/static/chunks/5237-11fb45b8fa8df6de.js", revision: "11fb45b8fa8df6de" },
        { url: "/_next/static/chunks/549-fee6969d4574287e.js", revision: "fee6969d4574287e" },
        { url: "/_next/static/chunks/5709-f9cade187b1581b8.js", revision: "f9cade187b1581b8" },
        { url: "/_next/static/chunks/5726-4e97119433a4d46f.js", revision: "4e97119433a4d46f" },
        { url: "/_next/static/chunks/5772-06f6fbbfa80e5403.js", revision: "06f6fbbfa80e5403" },
        { url: "/_next/static/chunks/6689-94f24f67a9d9fb55.js", revision: "94f24f67a9d9fb55" },
        { url: "/_next/static/chunks/736-5b67416d6c47870d.js", revision: "5b67416d6c47870d" },
        { url: "/_next/static/chunks/7882-e7aac9822d6f4059.js", revision: "e7aac9822d6f4059" },
        { url: "/_next/static/chunks/7936-995e3642a121c536.js", revision: "995e3642a121c536" },
        { url: "/_next/static/chunks/8176-3a94b7394703f002.js", revision: "3a94b7394703f002" },
        { url: "/_next/static/chunks/8409-93b75c73882b75b0.js", revision: "93b75c73882b75b0" },
        { url: "/_next/static/chunks/8500-27e7d9770d119ae1.js", revision: "27e7d9770d119ae1" },
        { url: "/_next/static/chunks/8924-be00e48240f7f3c1.js", revision: "be00e48240f7f3c1" },
        { url: "/_next/static/chunks/9375-66bb8daf61caa638.js", revision: "66bb8daf61caa638" },
        { url: "/_next/static/chunks/9683-973a9bb0c87d4667.js", revision: "973a9bb0c87d4667" },
        { url: "/_next/static/chunks/9849-91e3398a556466fd.js", revision: "91e3398a556466fd" },
        { url: "/_next/static/chunks/9946-507b5a33e5e10db0.js", revision: "507b5a33e5e10db0" },
        {
          url: "/_next/static/chunks/app/(auth)/auth/login/page-d3a4fe65823432cd.js",
          revision: "d3a4fe65823432cd",
        },
        {
          url: "/_next/static/chunks/app/(auth)/auth/register/page-a8c4fe06944477a7.js",
          revision: "a8c4fe06944477a7",
        },
        {
          url: "/_next/static/chunks/app/(auth)/layout-3b2d1c1a95f2fadc.js",
          revision: "3b2d1c1a95f2fadc",
        },
        {
          url: "/_next/static/chunks/app/(dashboard)/admin/packages/page-45a01744cdca77db.js",
          revision: "45a01744cdca77db",
        },
        {
          url: "/_next/static/chunks/app/(dashboard)/admin/page-4026d98bfb9e7cad.js",
          revision: "4026d98bfb9e7cad",
        },
        {
          url: "/_next/static/chunks/app/(dashboard)/admin/payments/page-432ec8604000898f.js",
          revision: "432ec8604000898f",
        },
        {
          url: "/_next/static/chunks/app/(dashboard)/admin/profile/page-f06b5bdf0a686217.js",
          revision: "f06b5bdf0a686217",
        },
        {
          url: "/_next/static/chunks/app/(dashboard)/admin/requests/%5Bid%5D/page-668743159041d03c.js",
          revision: "668743159041d03c",
        },
        {
          url: "/_next/static/chunks/app/(dashboard)/admin/requests/page-53ac9cc04c07b263.js",
          revision: "53ac9cc04c07b263",
        },
        {
          url: "/_next/static/chunks/app/(dashboard)/admin/services/page-3ba5e79bce6af6f6.js",
          revision: "3ba5e79bce6af6f6",
        },
        {
          url: "/_next/static/chunks/app/(dashboard)/admin/subscriptions/page-5b0a5ad52c6b2797.js",
          revision: "5b0a5ad52c6b2797",
        },
        {
          url: "/_next/static/chunks/app/(dashboard)/admin/users/page-2e4b18e8afceefa3.js",
          revision: "2e4b18e8afceefa3",
        },
        {
          url: "/_next/static/chunks/app/(dashboard)/client/notifications/page-77021fd4b7537b7a.js",
          revision: "77021fd4b7537b7a",
        },
        {
          url: "/_next/static/chunks/app/(dashboard)/client/page-d5c3af3876e6fa70.js",
          revision: "d5c3af3876e6fa70",
        },
        {
          url: "/_next/static/chunks/app/(dashboard)/client/payment/page-4534cd9b66ebf95b.js",
          revision: "4534cd9b66ebf95b",
        },
        {
          url: "/_next/static/chunks/app/(dashboard)/client/profile/page-f06b5bdf0a686217.js",
          revision: "f06b5bdf0a686217",
        },
        {
          url: "/_next/static/chunks/app/(dashboard)/client/requests/%5Bid%5D/page-99e548aaac31c8a5.js",
          revision: "99e548aaac31c8a5",
        },
        {
          url: "/_next/static/chunks/app/(dashboard)/client/requests/new/page-e5275677d79df9b4.js",
          revision: "e5275677d79df9b4",
        },
        {
          url: "/_next/static/chunks/app/(dashboard)/client/requests/page-87bb9c631122f115.js",
          revision: "87bb9c631122f115",
        },
        {
          url: "/_next/static/chunks/app/(dashboard)/client/subscription/page-6f522790be1a0313.js",
          revision: "6f522790be1a0313",
        },
        {
          url: "/_next/static/chunks/app/(dashboard)/layout-2de23490b7510543.js",
          revision: "2de23490b7510543",
        },
        {
          url: "/_next/static/chunks/app/(dashboard)/provider/available/%5Bid%5D/page-36452a9491d9889f.js",
          revision: "36452a9491d9889f",
        },
        {
          url: "/_next/static/chunks/app/(dashboard)/provider/available/page-a67cf337a401a9e1.js",
          revision: "a67cf337a401a9e1",
        },
        {
          url: "/_next/static/chunks/app/(dashboard)/provider/my-requests/page-4202e2006883c9e5.js",
          revision: "4202e2006883c9e5",
        },
        {
          url: "/_next/static/chunks/app/(dashboard)/provider/notifications/page-bd0f304e761da261.js",
          revision: "bd0f304e761da261",
        },
        {
          url: "/_next/static/chunks/app/(dashboard)/provider/page-726564b9bd259c39.js",
          revision: "726564b9bd259c39",
        },
        {
          url: "/_next/static/chunks/app/(dashboard)/provider/profile/page-86cfeff8b9618aa1.js",
          revision: "86cfeff8b9618aa1",
        },
        {
          url: "/_next/static/chunks/app/(dashboard)/provider/requests/%5Bid%5D/page-bb509c4f18af6055.js",
          revision: "bb509c4f18af6055",
        },
        {
          url: "/_next/static/chunks/app/_global-error/page-6422994b7dd5093b.js",
          revision: "6422994b7dd5093b",
        },
        {
          url: "/_next/static/chunks/app/_not-found/page-6422994b7dd5093b.js",
          revision: "6422994b7dd5093b",
        },
        {
          url: "/_next/static/chunks/app/api/auth/%5B...nextauth%5D/route-6422994b7dd5093b.js",
          revision: "6422994b7dd5093b",
        },
        {
          url: "/_next/static/chunks/app/api/cron/check-subscriptions/route-6422994b7dd5093b.js",
          revision: "6422994b7dd5093b",
        },
        {
          url: "/_next/static/chunks/app/api/debug-notify/route-6422994b7dd5093b.js",
          revision: "6422994b7dd5093b",
        },
        {
          url: "/_next/static/chunks/app/api/files/%5B...path%5D/route-6422994b7dd5093b.js",
          revision: "6422994b7dd5093b",
        },
        {
          url: "/_next/static/chunks/app/api/health/route-6422994b7dd5093b.js",
          revision: "6422994b7dd5093b",
        },
        {
          url: "/_next/static/chunks/app/api/notifications/sse/route-6422994b7dd5093b.js",
          revision: "6422994b7dd5093b",
        },
        {
          url: "/_next/static/chunks/app/api/notifications/unread-count/route-6422994b7dd5093b.js",
          revision: "6422994b7dd5093b",
        },
        {
          url: "/_next/static/chunks/app/api/trpc/%5Btrpc%5D/route-6422994b7dd5093b.js",
          revision: "6422994b7dd5093b",
        },
        {
          url: "/_next/static/chunks/app/api/upload/route-6422994b7dd5093b.js",
          revision: "6422994b7dd5093b",
        },
        {
          url: "/_next/static/chunks/app/layout-c558aa2e65a26efa.js",
          revision: "c558aa2e65a26efa",
        },
        {
          url: "/_next/static/chunks/app/not-found-61a3622238e09302.js",
          revision: "61a3622238e09302",
        },
        { url: "/_next/static/chunks/app/page-2e18c0b6e0555d8b.js", revision: "2e18c0b6e0555d8b" },
        { url: "/_next/static/chunks/c16f53c3-96a791ceba963490.js", revision: "96a791ceba963490" },
        { url: "/_next/static/chunks/framework-a676db37b243fc59.js", revision: "a676db37b243fc59" },
        { url: "/_next/static/chunks/main-35659d2973a9bb61.js", revision: "35659d2973a9bb61" },
        { url: "/_next/static/chunks/main-app-46b6205ba190e351.js", revision: "46b6205ba190e351" },
        {
          url: "/_next/static/chunks/next/dist/client/components/builtin/app-error-6422994b7dd5093b.js",
          revision: "6422994b7dd5093b",
        },
        {
          url: "/_next/static/chunks/next/dist/client/components/builtin/forbidden-6422994b7dd5093b.js",
          revision: "6422994b7dd5093b",
        },
        {
          url: "/_next/static/chunks/next/dist/client/components/builtin/global-error-74ad7fea6bbb065a.js",
          revision: "74ad7fea6bbb065a",
        },
        {
          url: "/_next/static/chunks/next/dist/client/components/builtin/unauthorized-6422994b7dd5093b.js",
          revision: "6422994b7dd5093b",
        },
        {
          url: "/_next/static/chunks/polyfills-42372ed130431b0a.js",
          revision: "846118c33b2c0e922d7b3a7676f81f6f",
        },
        { url: "/_next/static/chunks/webpack-bfae71e868846ffc.js", revision: "bfae71e868846ffc" },
        { url: "/_next/static/css/9cd408e90996071a.css", revision: "9cd408e90996071a" },
        { url: "/_next/static/css/c99fbfd6c3c365d1.css", revision: "c99fbfd6c3c365d1" },
        {
          url: "/_next/static/kTj9rTOJ4Gagsd7Ms2yGe/_buildManifest.js",
          revision: "4185ce80b158c16c732eeee102480a2f",
        },
        {
          url: "/_next/static/kTj9rTOJ4Gagsd7Ms2yGe/_ssgManifest.js",
          revision: "b6652df95db52feb4daf4eca35380933",
        },
        {
          url: "/_next/static/media/19cfc7226ec3afaa-s.woff2",
          revision: "9dda5cfc9a46f256d0e131bb535e46f8",
        },
        {
          url: "/_next/static/media/21350d82a1f187e9-s.woff2",
          revision: "4e2553027f1d60eff32898367dd4d541",
        },
        {
          url: "/_next/static/media/8e9860b6e62d6359-s.woff2",
          revision: "01ba6c2a184b8cba08b0d57167664d75",
        },
        {
          url: "/_next/static/media/ba9851c3c22cd980-s.woff2",
          revision: "9e494903d6b0ffec1a1e14d34427d44d",
        },
        {
          url: "/_next/static/media/c5fe6dc8356a8c31-s.woff2",
          revision: "027a89e9ab733a145db70f09b8a18b42",
        },
        {
          url: "/_next/static/media/df0a9ae256c0569c-s.woff2",
          revision: "d54db44de5ccb18886ece2fda72bdfe0",
        },
        {
          url: "/_next/static/media/e4af272ccee01ff0-s.p.woff2",
          revision: "65850a373e258f1c897a2b3d75eb74de",
        },
        { url: "/images/favicon.svg", revision: "8fae511f9097db0bc573be868d287787" },
        { url: "/images/icon-192.png", revision: "5f8ec99c247a71e72d2ca5df80a057a9" },
        { url: "/images/icon-512.png", revision: "1481d279f0a0779242458eed12edbb5f" },
        { url: "/images/logo.svg", revision: "a54a868ecea543993b53a5ce9644a6ef" },
        { url: "/manifest.json", revision: "d006ff953a49c0e35cd7134dc225ecd1" },
      ],
      { ignoreURLParametersMatching: [] }
    ),
    e.cleanupOutdatedCaches(),
    e.registerRoute(
      "/",
      new e.NetworkFirst({
        cacheName: "start-url",
        plugins: [
          {
            cacheWillUpdate: async ({ request: e, response: s, event: a, state: i }) =>
              s && "opaqueredirect" === s.type
                ? new Response(s.body, { status: 200, statusText: "OK", headers: s.headers })
                : s,
          },
        ],
      }),
      "GET"
    ),
    e.registerRoute(
      /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
      new e.CacheFirst({
        cacheName: "google-fonts",
        plugins: [new e.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 31536e3 })],
      }),
      "GET"
    ),
    e.registerRoute(
      /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
      new e.StaleWhileRevalidate({
        cacheName: "static-font-assets",
        plugins: [new e.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 604800 })],
      }),
      "GET"
    ),
    e.registerRoute(
      /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
      new e.StaleWhileRevalidate({
        cacheName: "static-image-assets",
        plugins: [new e.ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 86400 })],
      }),
      "GET"
    ),
    e.registerRoute(
      /\.(?:js)$/i,
      new e.StaleWhileRevalidate({
        cacheName: "static-js-assets",
        plugins: [new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 })],
      }),
      "GET"
    ),
    e.registerRoute(
      /\.(?:css|less)$/i,
      new e.StaleWhileRevalidate({
        cacheName: "static-style-assets",
        plugins: [new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 })],
      }),
      "GET"
    ),
    e.registerRoute(
      /\/api\/.*$/i,
      new e.NetworkFirst({
        cacheName: "apis",
        networkTimeoutSeconds: 10,
        plugins: [new e.ExpirationPlugin({ maxEntries: 16, maxAgeSeconds: 86400 })],
      }),
      "GET"
    ),
    e.registerRoute(
      /.*/i,
      new e.NetworkFirst({
        cacheName: "others",
        networkTimeoutSeconds: 10,
        plugins: [new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 })],
      }),
      "GET"
    ));
});
