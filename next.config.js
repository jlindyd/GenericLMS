// The preview page may be framed only by the CMS app (either spelling of the local address). Everything else may not be framed by other sites.
const cmsOrigins = process.env.CMS_ORIGINS || 'http://127.0.0.1:3021 http://localhost:3021';
const common = [{ key: 'X-Content-Type-Options', value: 'nosniff' }, { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }];
module.exports = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: { externalDir: true },
  async headers() {
    return [
      { source: '/preview', headers: [...common, { key: 'Content-Security-Policy', value: `frame-ancestors ${cmsOrigins}` }, { key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
      { source: '/((?!preview).*)', headers: [...common, { key: 'X-Frame-Options', value: 'SAMEORIGIN' }] },
    ];
  },
};
