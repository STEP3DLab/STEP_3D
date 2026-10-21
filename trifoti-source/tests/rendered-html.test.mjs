import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";

const origin = "https://trifoti.step3d.chatgpt.site";

function structuredData(html) {
  return [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
    .flatMap(([, json]) => {
      const data = JSON.parse(json);
      return Array.isArray(data) ? data : data["@graph"] ?? [data];
    });
}

function assertBundledMedia(html, path) {
  for (const [tag] of html.matchAll(/<(?:img|source|video|script|link)\b[^>]*>/g)) {
    for (const [, value] of tag.matchAll(/\b(?:src|poster|href)="([^"]+)"/g)) {
      if (!/^\/(?:images\/|videos\/|assets\/|favicon\.svg(?:\?|$))/.test(value)) continue;
      const pathname = new URL(value.replaceAll("&amp;", "&"), origin).pathname;
      assert.ok(existsSync(new URL(`../dist/client${pathname}`, import.meta.url)), `${path}: missing bundled asset ${pathname}`);
    }
    if (tag.startsWith("<img")) assert.match(tag, /\balt="[^"]*"/, `${path}: images need an alt attribute`);
  }
}

test("renders the production ТРИФОТИ experience and retained application routes", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const environment = { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } };
  const context = { waitUntil() {}, passThroughOnException() {} };
  const fetchPath = (path) => worker.fetch(new Request(`${origin}${path}`, { headers: { accept: "text/html" } }), environment, context);

  async function renderPage(path) {
    const response = await fetchPath(path);
    assert.equal(response.status, 200, path);
    assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i, path);
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    assert.equal(response.headers.get("referrer-policy"), "strict-origin-when-cross-origin");
    assert.equal(response.headers.get("permissions-policy"), "camera=(), microphone=(), geolocation=()");
    const html = await response.text();
    assert.doesNotMatch(html, /codex-preview|step3d-art\.step3d\.chatgpt\.site/i, path);
    assert.match(html, /<html\b[^>]*lang="ru"/, path);
    assert.equal((html.match(/<main\b/g) ?? []).length, 1, `${path}: one main landmark`);
    assert.equal((html.match(/<h1\b/g) ?? []).length, 1, `${path}: one page heading`);
    assert.match(html, /href="#content"/, `${path}: keyboard skip link`);
    assert.match(html, /<main\b[^>]*id="content"/, `${path}: skip target`);
    assert.match(html, /aria-label="ТРИФОТИ — на главную"/, `${path}: named brand link`);
    assert.match(html, /<title>[^<]*ТРИФОТИ/, `${path}: studio metadata`);
    const canonicalTag = [...html.matchAll(/<link\b[^>]*>/g)].map(([tag]) => tag).find(tag => /\brel="canonical"/.test(tag));
    assert.ok(canonicalTag, `${path}: canonical URL`);
    const canonical = new URL(canonicalTag.match(/\bhref="([^"]+)"/)[1]);
    assert.equal(canonical.origin, origin, `${path}: canonical origin`);
    assert.equal(canonical.pathname, path, `${path}: canonical path`);
    assertBundledMedia(html, path);
    return html;
  }

  const html = await renderPage("/");
  assert.match(html, /aria-label="Основная навигация"/);
  assert.match(html, /id="request"[^>]*aria-labelledby="request-title"/);
  assert.match(html, /<form\b/);
  assert.match(html, /href="\/projects"/);
  assert.match(html, /href="\/services\/awards"/);
  assert.match(html, /step_3d_mngr/);
  assert.match(html, /projects\.step3d@gmail\.com/);
  assert.match(html, /Фёдор Паршин/);
  assert.match(html, /Владимир Ганьшин/);
  const studio = structuredData(html).find(item => item["@type"] === "ProfessionalService");
  assert.equal(studio?.name, "ТРИФОТИ");
  assert.equal(studio?.url, origin);
  assert.ok(structuredData(html).some(item => item["@type"] === "FAQPage"));

  const pages = new Map();
  for (const path of ["/services", "/projects", "/business", "/about"]) {
    const page = await renderPage(path);
    assert.match(page, /aria-label="Основная навигация"/);
    assert.match(page, /aria-label="Навигационная цепочка"/);
    pages.set(path, page);
  }
  const projectsHtml = pages.get("/projects");
  assert.match(projectsHtml, /id="project-search"/);
  assert.match(projectsHtml, /aria-label="Фильтр проектов"/);
  const collection = structuredData(projectsHtml).find(item => item["@type"] === "CollectionPage");
  assert.ok(collection?.mainEntity?.numberOfItems >= 5);
  assert.equal(collection.mainEntity.numberOfItems, collection.mainEntity.itemListElement.length);
  assert.ok(structuredData(pages.get("/services")).some(item => item["@type"] === "ItemList"));
  const about = structuredData(pages.get("/about")).find(item => item["@type"] === "AboutPage");
  assert.deepEqual(about?.mainEntity?.founder?.map(person => person.name), ["Фёдор Паршин", "Владимир Ганьшин"]);

  // Keep evidence and authorship checks, without freezing the order or design of cards.
  const caseEvidence = [
    ["std-award", /Награда для премии СТД России/, ["award-series.webp", "design-process.webp", "award-ceremony.webp"]],
    ["sakharov-art", /Интерьерные 3D-панно/, ["ring-workshop.webp", "ring-installed.webp"]],
    ["rto-traveling-cup", /Ленком Марка Захарова/, ["trophy.webp", "ceremony.webp"]],
    ["parshin-sculptures", /Производство скульптур Фёдора Паршина/, ["animal-segments.webp", "relief-finished.webp"]],
    ["pletneva-costume", /Сценический костюм Анны Плетнёвой/, ["01-printed-elements.webp", "09-assembled-front.webp", "3d-scan-model.mp4", "3d-printing.mp4"]],
  ];
  for (const [slug, evidence, assets] of caseEvidence) {
    const page = await renderPage(`/cases/${slug}`);
    assert.match(page, evidence);
    assert.match(page, /href="\/projects"/);
    assert.match(page, /aria-label="Навигационная цепочка"/);
    for (const asset of assets) assert.ok(page.includes(asset), `${slug}: ${asset}`);
    const data = structuredData(page);
    const work = data.find(item => item["@type"] === "CreativeWork");
    assert.ok(work, `${slug}: project structured data`);
    assert.equal(work.url, `${origin}/cases/${slug}`);
    assert.ok(data.some(item => item["@type"] === "BreadcrumbList"));
    if (slug === "parshin-sculptures") {
      assert.deepEqual(work.creator, { "@type": "Person", name: "Фёдор Паршин" });
      assert.equal(work.contributor?.name, "Step3D");
    }
    if (slug === "std-award") {
      assert.match(page, /10 дней/);
      assert.match(page, /Владимир Машков/);
      assert.match(page, /https:\/\/stdrf\.ru\//);
    }
    if (slug === "pletneva-costume") {
      const videos = [...page.matchAll(/<video\b[^>]*>/g)].map(([tag]) => tag);
      assert.equal(videos.length, 2);
      for (const video of videos) {
        assert.match(video, /\bcontrols=""/);
        assert.match(video, /\bpreload="none"/);
        assert.doesNotMatch(video, /\bautoplay\b/);
      }
    }
  }

  for (const slug of ["sculptures", "decor-installations", "awards", "3d-modeling", "3d-printing", "3d-scanning"]) {
    const page = await renderPage(`/services/${slug}`);
    const data = structuredData(page);
    assert.ok(data.some(item => item["@type"] === "BreadcrumbList"), slug);
    assert.ok(data.some(item => item["@type"] === "FAQPage"), slug);
    assert.match(page, /href="\/projects"/);
    assert.match(page, /#request/);
  }

  const robotsResponse = await fetchPath("/robots.txt");
  assert.equal(robotsResponse.status, 200);
  const robotsText = await robotsResponse.text();
  for (const path of ["/api/", "/leads", "/status"]) assert.ok(robotsText.includes(`Disallow: ${path}`));
  assert.ok(robotsText.includes(`Sitemap: ${origin}/sitemap.xml`));
  const sitemapResponse = await fetchPath("/sitemap.xml");
  assert.equal(sitemapResponse.status, 200);
  const sitemapText = await sitemapResponse.text();
  for (const path of ["/about", "/projects", "/services/sculptures", "/cases/parshin-sculptures"]) assert.ok(sitemapText.includes(`${origin}${path}`));
  assert.doesNotMatch(sitemapText, /step3d-art\.step3d\.chatgpt\.site|<loc>[^<]*\/(?:leads|status)(?:<|\?)/);
  const notFoundResponse = await fetchPath("/never-existing-trifoti-page");
  assert.equal(notFoundResponse.status, 404);
  const notFoundHtml = await notFoundResponse.text();
  assert.match(notFoundHtml, /<meta[^>]*(?:content="noindex"[^>]*name="robots"|name="robots"[^>]*content="noindex")[^>]*>/);
  assert.doesNotMatch(notFoundHtml, /content="index, follow"/);

  const analyticsResponse = await worker.fetch(
    new Request("http://localhost/api/analytics"),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
  assert.equal(analyticsResponse.status, 200);
  assert.deepEqual(await analyticsResponse.json(), { yandexMetrikaId: null });

  const configuredAnalyticsResponse = await worker.fetch(
    new Request("http://localhost/api/analytics"),
    {
      ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
      YANDEX_METRIKA_ID: "12345678",
    },
    { waitUntil() {}, passThroughOnException() {} },
  );
  assert.equal(configuredAnalyticsResponse.status, 200);
  assert.deepEqual(await configuredAnalyticsResponse.json(), { yandexMetrikaId: "12345678" });

  const analyticsQueries = [];
  const analyticsDb = {
    prepare(sql) {
      const query = { sql, values: [] };
      analyticsQueries.push(query);
      return {
        bind(...values) { query.values = values; return this; },
        async first() { return { count: 0 }; },
        async run() { return { success: true, meta: { changes: 1, last_row_id: 1 } }; },
        async all() {
          if (sql.includes("GROUP BY event")) return { results: [
            { event: "page_view", count: 24, sessions: 12 },
            { event: "cta_click", count: 7, sessions: 6 },
            { event: "estimate_complete", count: 4, sessions: 4 },
            { event: "lead_submit", count: 3, sessions: 3 },
          ] };
          if (sql.includes("substr(created_at")) return { results: [{ day: "2026-09-05", views: 24, sessions: 12, leads: 3 }] };
          if (sql.includes("CASE WHEN utm_source")) return { results: [{ label: "telegram", value: 14 }] };
          if (sql.includes("SELECT path AS label")) return { results: [{ label: "/", value: 24 }] };
          return { results: [] };
        },
      };
    },
  };

  const eventResponse = await worker.fetch(
    new Request("http://localhost/api/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ event: "page_view", path: "/business", source: "telegram", sessionId: "testsession123456", utmSource: "telegram" }),
    }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) }, DB: analyticsDb },
    { waitUntil() {}, passThroughOnException() {} },
  );
  assert.equal(eventResponse.status, 201);
  assert.deepEqual(await eventResponse.json(), { accepted: true });
  assert.ok(analyticsQueries.some((query) => query.sql.startsWith("INSERT INTO analytics_events")));

  const dashboardResponse = await worker.fetch(
    new Request("http://localhost/api/events?days=30", { headers: { "x-trifoti-admin-key": "test-admin-key-1234567890" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) }, DB: analyticsDb, LEADS_ADMIN_KEY: "test-admin-key-1234567890" },
    { waitUntil() {}, passThroughOnException() {} },
  );
  assert.equal(dashboardResponse.status, 200);
  const dashboard = await dashboardResponse.json();
  assert.equal(dashboard.totals.pageViews, 24);
  assert.equal(dashboard.totals.sessions, 12);
  assert.equal(dashboard.totals.leads, 3);
  assert.equal(dashboard.totals.conversion, 25);
  assert.deepEqual(dashboard.sources, [{ label: "telegram", value: 14 }]);

  const deniedDashboardResponse = await worker.fetch(
    new Request("http://localhost/api/events"),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) }, DB: analyticsDb, LEADS_ADMIN_KEY: "test-admin-key-1234567890" },
    { waitUntil() {}, passThroughOnException() {} },
  );
  assert.equal(deniedDashboardResponse.status, 401);

  for (const [contactMethod, contact] of [["E-mail", "not-an-email"], ["Телефон", "+7 123"]]) {
    const invalidContactResponse = await worker.fetch(
      new Request("http://localhost/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: "Тестовый заказчик",
          contact,
          contactMethod,
          projectType: "Промышленный дизайн / прототип",
          projectFormat: "Единичный объект",
          budget: "Пока не определён",
          details: "Нужна предварительная оценка нового прототипа.",
          startedAt: Date.now() - 5_000, consent: true,
        }),
      }),
      { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
      { waitUntil() {}, passThroughOnException() {} },
    );
    assert.equal(invalidContactResponse.status, 400);
    assert.deepEqual(await invalidContactResponse.json(), { error: "Проверьте контакт для выбранного способа связи." });
  }

  const originalFetch = globalThis.fetch;
  let telegramCall = null;
  globalThis.fetch = async (input, init) => {
    const url = typeof input === "string" ? input : input.url;
    if (url.startsWith("https://api.telegram.org/")) {
      telegramCall = { url, body: JSON.parse(String(init?.body ?? "{}")) };
      return Response.json({ ok: true, result: { message_id: 1 } });
    }
    throw new Error("Unexpected external request in the isolated test");
  };
  const dbStatement = {
    bind() { return this; },
    async all() { return { results: [] }; },
    async first() { return null; },
    async run() { return { success: true, meta: { changes: 1, last_row_id: 1 } }; },
    async raw() { return []; },
  };
  try {
    const notificationStateResponse = await worker.fetch(
      new Request("http://localhost/api/leads", { headers: { "x-trifoti-admin-key": "test-admin-key-1234567890" } }),
      {
        ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
        DB: { prepare() { return { ...dbStatement }; } },
        LEADS_ADMIN_KEY: "test-admin-key-1234567890",
        TELEGRAM_BOT_TOKEN: "123456789:ABCDEFGHIJKLMNOPQRSTUVWXYZabcd",
        TELEGRAM_CHAT_ID: "-1001234567890",
      },
      { waitUntil() {}, passThroughOnException() {} },
    );
    assert.equal(notificationStateResponse.status, 200);
    assert.deepEqual(await notificationStateResponse.json(), { leads: [], authorization: "key", notification: { channel: "telegram" } });

    const leadResponse = await worker.fetch(
      new Request("http://localhost/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json", "user-agent": "Trifoti integration test" },
        body: JSON.stringify({
          name: "Тестовая компания",
          contact: "@trifoti_test",
          contactMethod: "Telegram",
          projectType: "Кубок / награда",
          projectFormat: "Единичный объект",
          budget: "Пока не определён",
          deadline: "В течение месяца",
          details: "Разработать и изготовить авторскую награду для мероприятия.",
          source: "integration_test",
          startedAt: Date.now() - 5_000, consent: true,
          estimateMin: 35_000,
          estimateMax: 130_000,
        }),
      }),
      {
        ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
        DB: { prepare() { return { ...dbStatement }; } },
        TELEGRAM_BOT_TOKEN: "123456789:ABCDEFGHIJKLMNOPQRSTUVWXYZabcd",
        TELEGRAM_CHAT_ID: "-1001234567890",
      },
      { waitUntil() {}, passThroughOnException() {} },
    );
    assert.equal(leadResponse.status, 201);
    assert.ok(telegramCall);
    assert.equal(telegramCall.body.chat_id, "-1001234567890");
    assert.equal(telegramCall.body.parse_mode, "HTML");
    assert.match(telegramCall.body.text, /Новая заявка ТРИФОТИ/);
    assert.match(telegramCall.body.text, /Тестовая компания/);
    assert.match(telegramCall.body.text, /35 000–130 000 ₽/);
    assert.match(telegramCall.body.text, /integration_test/);
  } finally {
    globalThis.fetch = originalFetch;
  }

  let uploadedObject = null;
  let uploadRecordCreated = false;
  const uploadDb = {
    prepare(sql) {
      return {
        bind() { return this; },
        async all() {
          if (sql.includes('from "leads"')) return { results: [{ id: 17 }] };
          if (sql.includes('from "lead_files"')) return { results: [] };
          return { results: [] };
        },
        async raw() {
          if (sql.includes('from "leads"')) return [[17]];
          return [];
        },
        async run() {
          if (sql.includes('insert into "lead_files"')) uploadRecordCreated = true;
          return { success: true, meta: { changes: 1, last_row_id: 41 } };
        },
      };
    },
  };
  const uploadForm = new FormData();
  uploadForm.set("leadId", "TFT-260905-QATEST");
  uploadForm.set("token", "0123456789abcdef0123456789abcdef");
  uploadForm.set("file", new File(["solid qa\nendsolid qa\n"], "award concept.stl", { type: "model/stl" }));
  const uploadResponse = await worker.fetch(
    new Request("http://localhost/api/uploads", { method: "POST", body: uploadForm }),
    {
      ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
      DB: uploadDb,
      BUCKET: {
        async put(key, value, options) {
          uploadedObject = { key, value, options };
        },
      },
    },
    { waitUntil() {}, passThroughOnException() {} },
  );
  assert.equal(uploadResponse.status, 201);
  assert.deepEqual(await uploadResponse.json(), { ok: true, file: { name: "award-concept.stl", size: 21 } });
  assert.ok(uploadedObject?.key.startsWith("leads/TFT-260905-QATEST/"));
  assert.equal(uploadedObject?.options.customMetadata.originalName, "award-concept.stl");
  assert.ok(uploadRecordCreated);

  const rejectedUploadForm = new FormData();
  rejectedUploadForm.set("leadId", "TFT-260905-QATEST");
  rejectedUploadForm.set("token", "0123456789abcdef0123456789abcdef");
  rejectedUploadForm.set("file", new File(["not allowed"], "payload.exe", { type: "application/octet-stream" }));
  const rejectedUploadResponse = await worker.fetch(
    new Request("http://localhost/api/uploads", { method: "POST", body: rejectedUploadForm }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) }, DB: uploadDb },
    { waitUntil() {}, passThroughOnException() {} },
  );
  assert.equal(rejectedUploadResponse.status, 415);
  assert.match((await rejectedUploadResponse.json()).error, /Поддерживаются STL/);

  const statusDb = {
    prepare(sql) {
      return {
        bind() { return this; },
        async all() {
          return { results: [{
            publicId: "TFT-260905-QATEST",
            createdAt: "2026-09-05 10:00:00",
            updatedAt: "2026-09-05 10:15:00",
            status: "Оценка",
            projectType: "Кубок / награда",
            projectFormat: "Серия или тираж",
            deadline: "К 1 октября",
          }] };
        },
        async raw() {
          if (!sql.includes('from "leads"')) return [];
          return [[
            "TFT-260905-QATEST",
            "2026-09-05 10:00:00",
            "2026-09-05 10:15:00",
            "Оценка",
            "Кубок / награда",
            "Серия или тираж",
            "К 1 октября",
          ]];
        },
      };
    },
  };
  const statusResponse = await worker.fetch(
    new Request("http://localhost/api/status?id=TFT-260905-QATEST&token=0123456789abcdef0123456789abcdef"),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) }, DB: statusDb },
    { waitUntil() {}, passThroughOnException() {} },
  );
  assert.equal(statusResponse.status, 200);
  assert.deepEqual((await statusResponse.json()).lead, {
    publicId: "TFT-260905-QATEST",
    createdAt: "2026-09-05 10:00:00",
    updatedAt: "2026-09-05 10:15:00",
    status: "Оценка",
    projectType: "Кубок / награда",
    projectFormat: "Серия или тираж",
    deadline: "К 1 октября",
  });

  for (const path of ["/requisites", "/offer", "/privacy", "/consent"]) {
    const legalHtml = await renderPage(path);
    assert.doesNotMatch(legalHtml, /115093|Павловский пер\./i);
  }
});
