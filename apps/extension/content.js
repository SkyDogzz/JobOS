(() => {
  const jsonLd = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
    .map((node) => node.textContent?.trim())
    .filter(Boolean)
    .join("\n");
  const title = document.querySelector("h1")?.textContent?.trim() || document.title.trim();
  const description = document.querySelector('[data-testid="job-description"], .job-description, #job-description, main')?.textContent?.trim();

  return {
    contractVersion: "0.4.4",
    pageUrl: location.href,
    title,
    html: jsonLd ? `<script type="application/ld+json">${jsonLd}</script>` : document.documentElement.outerHTML,
    text: document.body.innerText,
    description,
    sourceName: "browser_extension",
    capturedAt: new Date().toISOString()
  };
})();
