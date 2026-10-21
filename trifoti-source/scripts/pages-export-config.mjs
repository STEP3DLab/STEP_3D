/** Used only in the temporary Next.js export tree created by build-pages.mjs. */
const config = {
  output: "export",
  trailingSlash: true,
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
  images: { unoptimized: true },
  experimental: { cpus: 2 },
};

export default config;
