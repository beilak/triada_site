# TRIADA LLC Reference Scan

Source site: https://triada-llc.com/

This folder contains a local scan of the reference site for building a simple static/SSR company site.

## Folder Layout

- `raw/html/` - downloaded source HTML and RSS files.
- `assets/images/` - downloaded reference images with normalized filenames.
- `content/` - cleaned content blocks for future templates or SSR.

## Main Site Structure

- Header topbar: email, phone, language switcher.
- Main navigation: home, about company, services, media/news, contact.
- Home hero: 4 image slides.
- About block: image + company text.
- Services block: 7 cards, each with title and image.
- Media/news block: 3 news cards with title, image and short text.
- Footer: logo, navigation links, contact data, patterned background.
- Contact page: contact information, Google Maps iframe and message form.

## Important Observations

- The source site has both Turkish and English content.
- The root page is Turkish. English content is available under `/en/`.
- `/sitemap.xml` returns 404. RSS feeds were used to find entries.
- Service detail pages have no body descriptions beyond title and image.
- Contact data has inconsistencies:
  - Footer/contact page email: `info@triada-llc.com`.
  - Topbar mailto: `info@biobalancellc.com`.
  - Visible phone: `0545000000`.
  - Topbar tel href: `05450000000`.

## Content Blocks

- `content/company.json` - company name, branding colors, logos and source metadata.
- `content/contacts.json` - phone, email, address, map and contact form fields.
- `content/navigation.json` - TR/EN menu and language links.
- `content/hero-slides.json` - hero titles and images.
- `content/services.json` - service cards.
- `content/about.en.md` and `content/about.tr.md` - about text.
- `content/news.json` - three news entries in TR/EN.
- `content/assets-manifest.json` - local image inventory.
- `content/pages.json` - downloaded pages and feeds.
- `content/home-sections.json` - home page section order for SSR templates.
- `content/footer.json` - footer block data.

## Suggested Next Step

For the final site, keep this content split and add a small SSR build script that reads JSON/Markdown from `content/`, renders partial templates, and writes plain HTML/CSS into `dist/`.
