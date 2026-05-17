import { buildSite } from "./build.mjs";
import { serveSite } from "./serve.mjs";

const result = await buildSite();
console.log(`Built ${result.pages.length} pages into dist/`);
serveSite();
