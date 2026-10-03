// The "we're live on DevHunt" banner makers add to their site (shown in the banner modal and after a paid launch).
export const bannerScript = (slug: string) =>
  `<script defer data-url="https://devhunt.org/tool/${slug}" src="https://cdn.jsdelivr.net/gh/sidiDev/devhunt-banner/indexV0.js"></script>`;

// Live preview of the banner, for an iframe's srcDoc.
export const bannerPreviewDoc = (slug: string) => `<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Document</title>
      <script defer data-url="https://devhunt.org/tool/${slug}" src="https://devhunt.org/banner/index.js"></script>
      <link rel="stylesheet" href="/normalize.css">
  </head>
  <body>
  </body>
  </html>`;
