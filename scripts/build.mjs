import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = path.join(rootDir, "src");
const contentDir = path.join(srcDir, "content");
const publicDir = path.join(rootDir, "public");
const distDir = path.join(rootDir, "dist");

async function readJson(fileName) {
  const raw = await readFile(path.join(contentDir, fileName), "utf8");
  return JSON.parse(raw);
}

async function readMarkdown(fileName) {
  const raw = await readFile(path.join(contentDir, fileName), "utf8");
  const frontmatter = {};
  let body = raw.trim();

  if (body.startsWith("---")) {
    const end = body.indexOf("\n---", 3);
    if (end !== -1) {
      const meta = body.slice(3, end).trim();
      body = body.slice(end + 4).trim();
      for (const line of meta.split("\n")) {
        const [key, ...valueParts] = line.split(":");
        if (key && valueParts.length) {
          frontmatter[key.trim()] = valueParts.join(":").trim();
        }
      }
    }
  }

  return {
    frontmatter,
    html: markdownToHtml(body),
    excerptHtml: markdownToHtml(body.split(/\n\s*\n/).slice(0, 3).join("\n\n"))
  };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function markdownInline(value) {
  return escapeHtml(value).replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
}

function markdownToHtml(markdown) {
  return markdown
    .split(/\n\s*\n/)
    .map((block) => `<p>${markdownInline(block.trim()).replaceAll("\n", "<br>")}</p>`)
    .join("\n");
}

function pageTitle(title, company) {
  return title ? `${title} | ${company.siteTitle}` : company.siteTitle;
}

function renderLayout({ company, contacts, nav, activeHref, title, description, body }) {
  const navHtml = nav
    .map((item) => {
      const activeClass = item.href === activeHref ? " nav-link-active" : "";
      return `<a class="nav-link${activeClass}" href="${item.href}">${escapeHtml(item.label)}</a>`;
    })
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(pageTitle(title, company))}</title>
  <meta name="description" content="${escapeHtml(description || company.metaDescription)}">
  <link rel="icon" href="${company.favicon}">
  <link rel="stylesheet" href="assets/css/site.css">
</head>
<body>
  <header class="site-header">
    <div class="topbar">
      <div class="container topbar-inner">
        <a href="${contacts.emailHref}">${escapeHtml(contacts.email)}</a>
        <a href="${contacts.phoneHref}">${escapeHtml(contacts.phone)}</a>
      </div>
    </div>
    <div class="container nav-shell">
      <a class="brand" href="index.html" aria-label="${escapeHtml(company.companyName)}">${escapeHtml(company.companyName)}</a>
      <nav class="main-nav" aria-label="Main navigation">${navHtml}</nav>
    </div>
  </header>
  <main>${body}</main>
  ${renderFooter(company, contacts, nav)}
</body>
</html>`;
}

function renderFooter(company, contacts, nav) {
  const footerLinks = nav
    .map((item) => `<li><a href="${item.href}">${escapeHtml(item.label)}</a></li>`)
    .join("");

  return `<footer class="site-footer">
    <div class="container footer-grid">
      <div class="footer-brand">
        <a class="footer-logo" href="index.html">${escapeHtml(company.companyName)}</a>
        <p>${escapeHtml(company.industry)}</p>
      </div>
      <div>
        <h2 class="footer-title">LINKS</h2>
        <ul class="footer-links">${footerLinks}</ul>
      </div>
      <div>
        <h2 class="footer-title">CONTACT</h2>
        <ul class="footer-contact">
          <li><span>Phone:</span> <a href="${contacts.phoneHref}">${escapeHtml(contacts.phone)}</a></li>
          <li><span>Email:</span> <a href="${contacts.emailHref}">${escapeHtml(contacts.email)}</a></li>
          <li><span>Address:</span> ${escapeHtml(contacts.address)}</li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <div class="container">© ${new Date().getFullYear()} ${escapeHtml(company.companyName)}</div>
    </div>
  </footer>`;
}

function sectionHeading(kicker, title, align = "center") {
  return `<div class="section-heading section-heading-${align}">
    <span>${escapeHtml(kicker)}</span>
    <h2>${escapeHtml(title)}</h2>
  </div>`;
}

function renderHero(slides) {
  const slideHtml = slides
    .map((slide, index) => `<article class="hero-slide hero-slide-${index + 1}" style="--hero-image: url('${slide.image}')">
      <div class="container hero-content">
        <h1>${escapeHtml(slide.title)}</h1>
      </div>
    </article>`)
    .join("");

  const dots = slides.map((slide, index) => `<span aria-label="${escapeHtml(slide.title)}">${index + 1}</span>`).join("");

  return `<section class="hero" aria-label="Featured services">
    ${slideHtml}
    <div class="hero-dots" aria-hidden="true">${dots}</div>
  </section>`;
}

function renderAboutPreview(about) {
  return `<section class="section section-about">
    <div class="container split">
      <div class="media-frame">
        <img src="${about.frontmatter.homeImage}" alt="${escapeHtml(about.frontmatter.title)}">
      </div>
      <div class="section-copy">
        ${sectionHeading("ABOUT", about.frontmatter.title, "left")}
        <div class="rich-text">${about.excerptHtml}</div>
        <a class="button" href="about.html">READ MORE</a>
      </div>
    </div>
  </section>`;
}

function renderServicesGrid(services, limit = services.length) {
  return `<div class="services-grid">
    ${services
      .slice(0, limit)
      .map((service) => `<article class="service-card">
        <img src="${service.image}" alt="${escapeHtml(service.title)}">
        <h3>${escapeHtml(service.title)}</h3>
        ${service.summary ? `<p>${escapeHtml(service.summary)}</p>` : ""}
      </article>`)
      .join("")}
  </div>`;
}

function renderServicesSection(services, { showButton = true } = {}) {
  return `<section class="section section-muted">
    <div class="container">
      ${sectionHeading("WHAT WE DO", "SERVICES")}
      ${renderServicesGrid(services)}
      ${showButton ? '<div class="section-actions"><a class="button" href="services.html">ALL SERVICES</a></div>' : ""}
    </div>
  </section>`;
}

function renderNewsGrid(news, { full = false } = {}) {
  return `<div class="news-grid">
    ${news
      .map((item) => `<article class="news-card">
        <img src="${full ? item.image : item.thumb}" alt="${escapeHtml(item.title)}">
        <div class="news-card-body">
          <time datetime="${item.date}">${formatDate(item.date)}</time>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.body)}</p>
        </div>
      </article>`)
      .join("")}
  </div>`;
}

function renderNewsSection(news, { showButton = true, full = false } = {}) {
  return `<section class="section">
    <div class="container">
      ${sectionHeading("MARKET", "INDUSTRY FOCUS")}
      ${renderNewsGrid(news, { full })}
      ${showButton ? '<div class="section-actions"><a class="button" href="news.html">ALL NEWS</a></div>' : ""}
    </div>
  </section>`;
}

function renderContactCta(contacts) {
  return `<section class="contact-band">
    <div class="container contact-band-inner">
      <div>
        <span>CONTACT US</span>
        <h2>Ready to discuss construction, equipment and logistics supply?</h2>
      </div>
      <div class="contact-band-actions">
        <a href="${contacts.phoneHref}">${escapeHtml(contacts.phone)}</a>
        <a class="button button-light" href="contact.html">CONTACT PAGE</a>
      </div>
    </div>
  </section>`;
}

function renderPageIntro(title) {
  return `<section class="page-intro">
    <div class="container">
      <h1>${escapeHtml(title)}</h1>
    </div>
  </section>`;
}

function renderContactPage(contacts) {
  return `<section class="section">
    <div class="container contact-grid">
      <div class="contact-info">
        ${sectionHeading("CONTACT", "Contact information", "left")}
        <p><strong>Address:</strong> ${escapeHtml(contacts.address)}</p>
        <p><strong>Phone:</strong> <a href="${contacts.phoneHref}">${escapeHtml(contacts.phone)}</a></p>
        <p><strong>Email:</strong> <a href="${contacts.emailHref}">${escapeHtml(contacts.email)}</a></p>
        <iframe title="Map" src="${contacts.mapEmbedUrl}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
      </div>
    </div>
  </section>`;
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "2-digit"
  }).format(new Date(`${value}T00:00:00Z`));
}

async function writePage(fileName, html) {
  await writeFile(path.join(distDir, fileName), html, "utf8");
}

export async function buildSite() {
  const [company, contacts, nav, slides, services, news, about] = await Promise.all([
    readJson("company.json"),
    readJson("contacts.json"),
    readJson("navigation.json"),
    readJson("hero-slides.json"),
    readJson("services.json"),
    readJson("news.json"),
    readMarkdown("about.md")
  ]);

  await rm(distDir, { recursive: true, force: true });
  await mkdir(path.join(distDir, "assets", "css"), { recursive: true });

  if (existsSync(publicDir)) {
    await cp(publicDir, distDir, { recursive: true });
  }

  await cp(path.join(srcDir, "styles", "site.css"), path.join(distDir, "assets", "css", "site.css"));
  await writeFile(path.join(distDir, ".nojekyll"), "", "utf8");

  const base = { company, contacts, nav };

  const homeBody = [
    renderHero(slides),
    renderAboutPreview(about),
    renderServicesSection(services),
    renderNewsSection(news),
    renderContactCta(contacts)
  ].join("\n");

  await writePage(
    "index.html",
    renderLayout({
      ...base,
      activeHref: "index.html",
      title: "",
      body: homeBody
    })
  );

  await writePage(
    "about.html",
    renderLayout({
      ...base,
      activeHref: "about.html",
      title: "ABOUT COMPANY",
      body: `${renderPageIntro("ABOUT COMPANY")}<section class="section"><div class="container split split-top"><div class="media-frame"><img src="${about.frontmatter.image}" alt="ABOUT COMPANY"></div><div class="rich-text page-text">${about.html}</div></div></section>`
    })
  );

  await writePage(
    "services.html",
    renderLayout({
      ...base,
      activeHref: "services.html",
      title: "SERVICES",
      body: `${renderPageIntro("SERVICES")}<section class="section section-muted"><div class="container">${renderServicesGrid(services)}</div></section>`
    })
  );

  await writePage(
    "news.html",
    renderLayout({
      ...base,
      activeHref: "news.html",
      title: "NEWS",
      body: `${renderPageIntro("INDUSTRY FOCUS")}${renderNewsSection(news, { showButton: false, full: true })}`
    })
  );

  await writePage(
    "contact.html",
    renderLayout({
      ...base,
      activeHref: "contact.html",
      title: "CONTACT US",
      body: `${renderPageIntro("CONTACT US")}${renderContactPage(contacts)}`
    })
  );

  return {
    pages: ["index.html", "about.html", "services.html", "news.html", "contact.html"],
    distDir
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  buildSite().then(({ pages }) => {
    console.log(`Built ${pages.length} pages into dist/`);
  });
}
