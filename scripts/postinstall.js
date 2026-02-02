import fetch from "node-fetch";
import AdmZip from "adm-zip";
import fs from "fs";
import path from "path";
import url from "node:url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const DICT_URL =
  "https://github.com/otoneko1102/gomamayo.js/releases/download/dict/dict.zip";
const outputPath = path.resolve(rootDir, "lib");
const zipPath = path.resolve(rootDir, "dict.zip");

async function downloadFile(fileUrl, dest) {
  const res = await fetch(fileUrl, { redirect: "follow" });
  if (!res.ok) throw new Error(`Failed to fetch ${fileUrl}: ${res.statusText}`);
  const fileStream = fs.createWriteStream(dest);
  await new Promise((resolve, reject) => {
    res.body.pipe(fileStream);
    res.body.on("error", reject);
    fileStream.on("finish", resolve);
  });
}

function unzipFile(zipFilePath, outputDir) {
  const zip = new AdmZip(zipFilePath);
  zip.extractAllTo(outputDir, true);
}

(async () => {
  try {
    // 既にlibが存在する場合はスキップ
    const kuromojiPath = path.join(outputPath, "kuromoji");
    const neologdPath = path.join(outputPath, "kuromoji-neologd");
    if (fs.existsSync(kuromojiPath) && fs.existsSync(neologdPath)) {
      console.log("[postinstall] Dictionaries already exist, skipping...");
      return;
    }

    console.log(`[postinstall] Downloading dictionaries from ${DICT_URL}...`);
    await downloadFile(DICT_URL, zipPath);
    console.log(`[postinstall] Downloaded to ${zipPath}`);

    console.log(`[postinstall] Extracting ZIP to ${outputPath}...`);
    fs.mkdirSync(outputPath, { recursive: true });
    unzipFile(zipPath, outputPath);
    console.log(`[postinstall] Extracted to ${outputPath}`);

    fs.unlinkSync(zipPath);
    console.log(`[postinstall] Temporary ZIP file deleted.`);
  } catch (error) {
    console.error(`[postinstall] Error: ${error.message}`);
    console.error(
      "[postinstall] Failed to download dictionaries. Falling back to node_modules...",
    );

    // フォールバック: node_modulesからコピー
    try {
      const dictSources = [
        {
          name: "kuromoji",
          src: path.join(rootDir, "node_modules", "kuromoji", "dict"),
          dest: path.join(outputPath, "kuromoji"),
        },
        {
          name: "kuromoji-neologd",
          src: path.join(rootDir, "node_modules", "kuromoji-neologd", "dict"),
          dest: path.join(outputPath, "kuromoji-neologd"),
        },
      ];

      for (const { name, src, dest } of dictSources) {
        if (!fs.existsSync(src)) {
          console.log(`[postinstall] ${name} not found at ${src}, skipping...`);
          continue;
        }
        if (fs.existsSync(dest)) {
          console.log(`[postinstall] ${name} already exists, skipping...`);
          continue;
        }
        fs.mkdirSync(dest, { recursive: true });
        const files = fs.readdirSync(src);
        for (const file of files) {
          fs.copyFileSync(path.join(src, file), path.join(dest, file));
        }
        console.log(`[postinstall] Copied ${name} to ${dest}`);
      }
    } catch (fallbackError) {
      console.error(`[postinstall] Fallback failed: ${fallbackError.message}`);
    }
  }
})();

