/** @type {import('next').NextConfig} */
const nextConfig = {
  // Export estático: `next build` deja el sitio listo en out/ para rsync (hosting sin Node).
  output: 'export',
  // /en/ -> out/en/index.html, así Apache sirve las rutas sin reescrituras.
  trailingSlash: true,
  images: { unoptimized: true },
  // Evita que Turbopack tome un package-lock.json ajeno más arriba en el árbol.
  turbopack: { root: import.meta.dirname },
  // El arcade vive en public/arcade y se sirve tal cual.
};
export default nextConfig;
