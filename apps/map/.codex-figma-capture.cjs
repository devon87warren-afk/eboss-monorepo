const { chromium } = require("playwright");

(async () => {
  const captureId = "faa1fdfd-268f-4b0b-b842-deba9f73d985";
  const endpoint = `https://mcp.figma.com/mcp/capture/${captureId}/submit`;
  const url = "http://127.0.0.1:8080/";

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.route("**/*", async (route) => {
    const response = await route.fetch();
    const headers = { ...response.headers() };
    delete headers["content-security-policy"];
    delete headers["content-security-policy-report-only"];
    await route.fulfill({ response, headers });
  });

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 120000 });
  const scriptResp = await context.request.get("https://mcp.figma.com/mcp/html-to-design/capture.js");
  const scriptText = await scriptResp.text();

  await page.evaluate((s) => {
    const el = document.createElement("script");
    el.textContent = s;
    document.head.appendChild(el);
  }, scriptText);

  await page.waitForTimeout(1000);

  const result = await page.evaluate(async ({ captureId, endpoint }) => {
    if (!window.figma || !window.figma.captureForDesign) {
      throw new Error("Figma capture script not loaded");
    }
    return await window.figma.captureForDesign({
      captureId,
      endpoint,
      selector: "body",
    });
  }, { captureId, endpoint });

  console.log(JSON.stringify(result));
  await browser.close();
})();
