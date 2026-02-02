import AdmZip from "adm-zip";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const zip = new AdmZip();
const outputPath = path.resolve(rootDir, "dict.zip");

const dictSources = [
  { name: "kuromoji", src: path.join(rootDir, "node_modules", "kuromoji", "dict") },
  { name: "kuromoji-neologd", src: path.join(rootDir, "node_modules", "kuromoji-neologd", "dict") },
];

for (const { name, src } of dictSources) {
  if (!fs.existsSync(src)) {
    console.error(`[create-dict-zip] ${name} not found at ${src}`);
    process.exit(1);
  }
  console.log(`[create-dict-zip] Adding ${name} from ${src}...`);
  zip.addLocalFolder(src, name);
}

zip.writeZip(outputPath);
console.log(`[create-dict-zip] Created ${outputPath}`);
console.log(`[create-dict-zip] Upload this file to GitHub Releases with tag "dict"`);
