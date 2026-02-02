import kuromoji, { Tokenizer, IpadicFeatures } from "kuromoji";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// ESM/CJS両対応で現在のディレクトリを取得
const getCurrentDir = (): string => {
  // ESM環境
  try {
    if (typeof import.meta !== "undefined" && import.meta.url) {
      return path.dirname(fileURLToPath(import.meta.url));
    }
  } catch {}
  // CJS環境
  if (typeof __dirname !== "undefined") {
    return __dirname;
  }
  return process.cwd();
};

declare const __dirname: string;
const currentDir = getCurrentDir();

const getPackageDictPath = (packageName: string): string => {
  // 1. まずlib/フォルダを確認（グローバルインストール対応）
  const libDictPath = path.resolve(currentDir, "..", "lib", packageName);
  if (fs.existsSync(libDictPath)) {
    return libDictPath;
  }

  // 2. require.resolveでパッケージを参照
  try {
    const { createRequire } = require("module");
    const localRequire = createRequire(path.join(currentDir, "index.js"));
    const packagePath = localRequire.resolve(`${packageName}/package.json`);
    const dictPath = path.resolve(path.dirname(packagePath), "dict");
    if (fs.existsSync(dictPath)) {
      return dictPath;
    }
  } catch {}
  try {
    const packagePath = require.resolve(`${packageName}/package.json`);
    const dictPath = path.resolve(path.dirname(packagePath), "dict");
    if (fs.existsSync(dictPath)) {
      return dictPath;
    }
  } catch {}

  // 3. 最終フォールバック
  return path.resolve("node_modules", packageName, "dict");
};

export interface GomamayoOptions {
  higher?: boolean;
  multi?: boolean;
}

export interface GomamayoMatch {
  words: [string, string];
  readings: [string, string];
  degree: number;
  position: number;
}

export interface GomamayoResult {
  isGomamayo: boolean;
  matches: GomamayoMatch[];
  degree: number;
  ary: number;
  input: string;
  reading: string;
}

const VOWEL_MAP: Record<string, string> = {
  ア: "ア",
  イ: "イ",
  ウ: "ウ",
  エ: "エ",
  オ: "オ",
  カ: "ア",
  キ: "イ",
  ク: "ウ",
  ケ: "エ",
  コ: "オ",
  サ: "ア",
  シ: "イ",
  ス: "ウ",
  セ: "エ",
  ソ: "オ",
  タ: "ア",
  チ: "イ",
  ツ: "ウ",
  テ: "エ",
  ト: "オ",
  ナ: "ア",
  ニ: "イ",
  ヌ: "ウ",
  ネ: "エ",
  ノ: "オ",
  ハ: "ア",
  ヒ: "イ",
  フ: "ウ",
  ヘ: "エ",
  ホ: "オ",
  マ: "ア",
  ミ: "イ",
  ム: "ウ",
  メ: "エ",
  モ: "オ",
  ヤ: "ア",
  ユ: "ウ",
  ヨ: "オ",
  ラ: "ア",
  リ: "イ",
  ル: "ウ",
  レ: "エ",
  ロ: "オ",
  ワ: "ア",
  ヲ: "オ",
  ン: "ン",
  ガ: "ア",
  ギ: "イ",
  グ: "ウ",
  ゲ: "エ",
  ゴ: "オ",
  ザ: "ア",
  ジ: "イ",
  ズ: "ウ",
  ゼ: "エ",
  ゾ: "オ",
  ダ: "ア",
  ヂ: "イ",
  ヅ: "ウ",
  デ: "エ",
  ド: "オ",
  バ: "ア",
  ビ: "イ",
  ブ: "ウ",
  ベ: "エ",
  ボ: "オ",
  パ: "ア",
  ピ: "イ",
  プ: "ウ",
  ペ: "エ",
  ポ: "オ",
  ァ: "ア",
  ィ: "イ",
  ゥ: "ウ",
  ェ: "エ",
  ォ: "オ",
  ャ: "ア",
  ュ: "ウ",
  ョ: "オ",
  ッ: "ッ",
  ヴ: "ウ",
};

const MORA_PATTERN =
  /[ウクスツヌフムユルグズヅブプヴ][ァィェォ]|[イキシチニヒミリギジヂビピ][ャュェョ]|[テデ][ィュ]|[ァ-ヴー]/g;

function divideMora(str: string): string[] {
  return str.match(MORA_PATTERN) ?? [];
}

function hiraToKata(str: string): string {
  return str.replace(/[\u3041-\u3096]/g, (c) =>
    String.fromCharCode(c.charCodeAt(0) + 0x60),
  );
}

function prolongedToVowel(str: string): string {
  const moras = divideMora(str);
  if (moras.length === 0) return str;
  const first = moras[0];
  if (!first) return str;

  const result: string[] = [first];
  for (let i = 1; i < moras.length; i++) {
    const current = moras[i];
    if (!current) continue;
    if (current === "ー") {
      const prevMora = moras[i - 1];
      if (prevMora) {
        const lastChar = prevMora[prevMora.length - 1];
        result.push(lastChar ? (VOWEL_MAP[lastChar] ?? lastChar) : current);
      } else {
        result.push(current);
      }
    } else {
      result.push(current);
    }
  }
  return result.join("");
}

function getReading(token: IpadicFeatures): string {
  const reading = token.reading ?? token.surface_form;
  return hiraToKata(reading);
}

function normalize(str: string): string {
  return str
    .normalize("NFKC")
    .replace(/\s+/g, "")
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (c) =>
      String.fromCharCode(c.charCodeAt(0) - 0xfee0),
    );
}

let ipadicTokenizer: Promise<Tokenizer<IpadicFeatures>> | null = null;
let neologdTokenizer: Promise<Tokenizer<IpadicFeatures>> | null = null;

function getIpadicTokenizer(): Promise<Tokenizer<IpadicFeatures>> {
  if (!ipadicTokenizer) {
    ipadicTokenizer = new Promise((resolve, reject) => {
      const dicPath = getPackageDictPath("kuromoji");
      kuromoji.builder({ dicPath }).build((err, tokenizer) => {
        if (err) reject(err);
        else resolve(tokenizer);
      });
    });
  }
  return ipadicTokenizer;
}

function getNeologdTokenizer(): Promise<Tokenizer<IpadicFeatures>> {
  if (!neologdTokenizer) {
    neologdTokenizer = new Promise((resolve, reject) => {
      const dicPath = getPackageDictPath("kuromoji-neologd");
      kuromoji.builder({ dicPath }).build((err, tokenizer) => {
        if (err) reject(err);
        else resolve(tokenizer);
      });
    });
  }
  return neologdTokenizer;
}

function findMaxDegree(formerMora: string[], laterMora: string[]): number {
  const maxCheck = Math.min(formerMora.length, laterMora.length);
  let maxDegree = 0;

  for (let deg = 1; deg <= maxCheck; deg++) {
    let match = true;
    for (let i = 0; i < deg; i++) {
      if (formerMora[formerMora.length - deg + i] !== laterMora[i]) {
        match = false;
        break;
      }
    }
    if (match) maxDegree = deg;
  }
  return maxDegree;
}

function findInternalGomamayo(
  moras: string[],
  higher: boolean,
): { degree: number; position: number }[] {
  const results: { degree: number; position: number }[] = [];
  const maxDegree = higher ? Math.floor(moras.length / 2) : 1;

  for (let pos = 1; pos < moras.length; pos++) {
    for (
      let deg = 1;
      deg <= Math.min(maxDegree, pos, moras.length - pos);
      deg++
    ) {
      let match = true;
      for (let i = 0; i < deg; i++) {
        if (moras[pos - deg + i] !== moras[pos + i]) {
          match = false;
          break;
        }
      }
      if (match) {
        const existing = results.find((r) => r.position === pos);
        if (existing) {
          existing.degree = Math.max(existing.degree, deg);
        } else {
          results.push({ degree: deg, position: pos });
        }
      }
    }
  }
  return results;
}

interface TokenInfo {
  surface: string;
  reading: string;
}

function buildTokenInfos(
  ipadicTokens: IpadicFeatures[],
  neologdTokens: IpadicFeatures[],
): TokenInfo[] {
  const result: TokenInfo[] = [];

  if (neologdTokens.length === 1 && ipadicTokens.length > 1) {
    const neo = neologdTokens[0];
    if (neo && neo.reading) {
      const neoReading = hiraToKata(neo.reading);
      const neoMoras = divideMora(neoReading);

      let moraIdx = 0;
      for (const token of ipadicTokens) {
        const ipadicReading = getReading(token);
        const ipadicMoraCount = divideMora(ipadicReading).length;

        const tokenMoras = neoMoras.slice(moraIdx, moraIdx + ipadicMoraCount);
        result.push({
          surface: token.surface_form,
          reading: tokenMoras.length > 0 ? tokenMoras.join("") : ipadicReading,
        });
        moraIdx += ipadicMoraCount;
      }
      return result;
    }
  }

  for (const token of ipadicTokens) {
    result.push({
      surface: token.surface_form,
      reading: getReading(token),
    });
  }
  return result;
}

export async function analyze(
  input: string,
  options: GomamayoOptions = {},
): Promise<GomamayoResult> {
  const { higher = true, multi = true } = options;

  const [ipadic, neologd] = await Promise.all([
    getIpadicTokenizer(),
    getNeologdTokenizer(),
  ]);

  const normalized = normalize(input);
  const ipadicTokens = ipadic.tokenize(normalized);
  const neologdTokens = neologd.tokenize(normalized);

  const result: GomamayoResult = {
    isGomamayo: false,
    matches: [],
    degree: 0,
    ary: 0,
    input,
    reading: "",
  };

  const tokenInfos = buildTokenInfos(ipadicTokens, neologdTokens);
  result.reading = tokenInfos.map((t) => t.reading).join("");

  for (let i = 0; i < tokenInfos.length - 1; i++) {
    const former = tokenInfos[i];
    const later = tokenInfos[i + 1];
    if (!former || !later) continue;

    const formerReading = prolongedToVowel(former.reading);
    const laterReading = later.reading;

    const formerMora = divideMora(formerReading);
    const laterMora = divideMora(laterReading);

    if (formerMora.length === 0 || laterMora.length === 0) continue;

    const deg = findMaxDegree(formerMora, laterMora);

    if (deg > 0 && (higher || deg === 1)) {
      result.matches.push({
        words: [former.surface, later.surface],
        readings: [former.reading, later.reading],
        degree: deg,
        position: i,
      });
      result.degree = Math.max(result.degree, deg);
      result.ary++;
      if (!multi) break;
    }
  }

  if (
    result.ary === 0 &&
    neologdTokens.length === 1 &&
    ipadicTokens.length > 1
  ) {
    const token = neologdTokens[0];
    if (token && token.reading) {
      const reading = prolongedToVowel(hiraToKata(token.reading));
      const moras = divideMora(reading);
      const internal = findInternalGomamayo(moras, higher);

      for (const match of internal) {
        if (higher || match.degree === 1) {
          const beforeMoras = moras.slice(0, match.position);
          const afterMoras = moras.slice(match.position);
          result.matches.push({
            words: [token.surface_form, token.surface_form],
            readings: [beforeMoras.join(""), afterMoras.join("")],
            degree: match.degree,
            position: match.position,
          });
          result.degree = Math.max(result.degree, match.degree);
          result.ary++;
          if (!multi) break;
        }
      }
    }
  }

  result.isGomamayo = result.ary > 0;
  return result;
}

export async function isGomamayo(
  input: string,
  options: GomamayoOptions = {},
): Promise<boolean> {
  return (await analyze(input, options)).isGomamayo;
}

export async function find(
  input: string,
  options: GomamayoOptions = {},
): Promise<GomamayoMatch[] | null> {
  const result = await analyze(input, options);
  return result.isGomamayo ? result.matches : null;
}

export default { analyze, isGomamayo, find };
