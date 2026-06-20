const fs = require("fs");

let model = fs.readFileSync("e:/Manga/client/src/entities/series/model.ts", "utf8");

// Update chapters based on slugs
const patches = [
  { slug: "ghost-fixers", chapter: "Ch. 12" },
  { slug: "gokurakugai", chapter: "Ch. 05" },
  { slug: "gachiakuta", chapter: "Ch. 48" },
  { slug: "vagabond", chapter: "Ch. 327" },
  { slug: "one-piece", chapter: "Ch. 1122" },
];

patches.forEach((p) => {
  const r = new RegExp(`slug: "${p.slug}",[\\s\\S]*?currentChapter: "Ch\\.\\s*\\d+",`);
  model = model.replace(r, (match) => {
    return match.replace(/currentChapter: "Ch\.\s*\d+"/, `currentChapter: "${p.chapter}"`);
  });
});

// Update "Wait for board" to "Waiting for board" and "Wait for feedback" to "Waiting for feedback"
model = model.replace(/"Wait for board"/g, '"Waiting for board"');
model = model.replace(/"Wait for feedback"/g, '"Waiting for feedback"');

fs.writeFileSync("e:/Manga/client/src/entities/series/model.ts", model);
