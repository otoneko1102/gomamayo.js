var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});

// src/index.ts
import kuromoji from "kuromoji";
import path from "path";
import fs from "fs";
var getPackageDictPath = (packageName) => {
  if (typeof __dirname !== "undefined") {
    const libDictPath = path.resolve(__dirname, "..", "lib", packageName);
    if (fs.existsSync(libDictPath)) {
      return libDictPath;
    }
  }
  try {
    if (typeof __dirname !== "undefined") {
      const { createRequire } = __require("module");
      const localRequire = createRequire(path.join(__dirname, "index.js"));
      const packagePath = localRequire.resolve(`${packageName}/package.json`);
      const dictPath = path.resolve(path.dirname(packagePath), "dict");
      if (fs.existsSync(dictPath)) {
        return dictPath;
      }
    }
  } catch {
  }
  try {
    const packagePath = __require.resolve(`${packageName}/package.json`);
    const dictPath = path.resolve(path.dirname(packagePath), "dict");
    if (fs.existsSync(dictPath)) {
      return dictPath;
    }
  } catch {
  }
  return path.resolve("node_modules", packageName, "dict");
};
var VOWEL_MAP = {
  \u30A2: "\u30A2",
  \u30A4: "\u30A4",
  \u30A6: "\u30A6",
  \u30A8: "\u30A8",
  \u30AA: "\u30AA",
  \u30AB: "\u30A2",
  \u30AD: "\u30A4",
  \u30AF: "\u30A6",
  \u30B1: "\u30A8",
  \u30B3: "\u30AA",
  \u30B5: "\u30A2",
  \u30B7: "\u30A4",
  \u30B9: "\u30A6",
  \u30BB: "\u30A8",
  \u30BD: "\u30AA",
  \u30BF: "\u30A2",
  \u30C1: "\u30A4",
  \u30C4: "\u30A6",
  \u30C6: "\u30A8",
  \u30C8: "\u30AA",
  \u30CA: "\u30A2",
  \u30CB: "\u30A4",
  \u30CC: "\u30A6",
  \u30CD: "\u30A8",
  \u30CE: "\u30AA",
  \u30CF: "\u30A2",
  \u30D2: "\u30A4",
  \u30D5: "\u30A6",
  \u30D8: "\u30A8",
  \u30DB: "\u30AA",
  \u30DE: "\u30A2",
  \u30DF: "\u30A4",
  \u30E0: "\u30A6",
  \u30E1: "\u30A8",
  \u30E2: "\u30AA",
  \u30E4: "\u30A2",
  \u30E6: "\u30A6",
  \u30E8: "\u30AA",
  \u30E9: "\u30A2",
  \u30EA: "\u30A4",
  \u30EB: "\u30A6",
  \u30EC: "\u30A8",
  \u30ED: "\u30AA",
  \u30EF: "\u30A2",
  \u30F2: "\u30AA",
  \u30F3: "\u30F3",
  \u30AC: "\u30A2",
  \u30AE: "\u30A4",
  \u30B0: "\u30A6",
  \u30B2: "\u30A8",
  \u30B4: "\u30AA",
  \u30B6: "\u30A2",
  \u30B8: "\u30A4",
  \u30BA: "\u30A6",
  \u30BC: "\u30A8",
  \u30BE: "\u30AA",
  \u30C0: "\u30A2",
  \u30C2: "\u30A4",
  \u30C5: "\u30A6",
  \u30C7: "\u30A8",
  \u30C9: "\u30AA",
  \u30D0: "\u30A2",
  \u30D3: "\u30A4",
  \u30D6: "\u30A6",
  \u30D9: "\u30A8",
  \u30DC: "\u30AA",
  \u30D1: "\u30A2",
  \u30D4: "\u30A4",
  \u30D7: "\u30A6",
  \u30DA: "\u30A8",
  \u30DD: "\u30AA",
  \u30A1: "\u30A2",
  \u30A3: "\u30A4",
  \u30A5: "\u30A6",
  \u30A7: "\u30A8",
  \u30A9: "\u30AA",
  \u30E3: "\u30A2",
  \u30E5: "\u30A6",
  \u30E7: "\u30AA",
  \u30C3: "\u30C3",
  \u30F4: "\u30A6"
};
var MORA_PATTERN = /[ウクスツヌフムユルグズヅブプヴ][ァィェォ]|[イキシチニヒミリギジヂビピ][ャュェョ]|[テデ][ィュ]|[ァ-ヴー]/g;
function divideMora(str) {
  return str.match(MORA_PATTERN) ?? [];
}
function hiraToKata(str) {
  return str.replace(
    /[\u3041-\u3096]/g,
    (c) => String.fromCharCode(c.charCodeAt(0) + 96)
  );
}
function prolongedToVowel(str) {
  const moras = divideMora(str);
  if (moras.length === 0) return str;
  const first = moras[0];
  if (!first) return str;
  const result = [first];
  for (let i = 1; i < moras.length; i++) {
    const current = moras[i];
    if (!current) continue;
    if (current === "\u30FC") {
      const prevMora = moras[i - 1];
      if (prevMora) {
        const lastChar = prevMora[prevMora.length - 1];
        result.push(lastChar ? VOWEL_MAP[lastChar] ?? lastChar : current);
      } else {
        result.push(current);
      }
    } else {
      result.push(current);
    }
  }
  return result.join("");
}
function getReading(token) {
  const reading = token.reading ?? token.surface_form;
  return hiraToKata(reading);
}
function normalize(str) {
  return str.normalize("NFKC").replace(/\s+/g, "").replace(
    /[Ａ-Ｚａ-ｚ０-９]/g,
    (c) => String.fromCharCode(c.charCodeAt(0) - 65248)
  );
}
var ipadicTokenizer = null;
var neologdTokenizer = null;
function getIpadicTokenizer() {
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
function getNeologdTokenizer() {
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
function findMaxDegree(formerMora, laterMora) {
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
function findInternalGomamayo(moras, higher) {
  const results = [];
  const maxDegree = higher ? Math.floor(moras.length / 2) : 1;
  for (let pos = 1; pos < moras.length; pos++) {
    for (let deg = 1; deg <= Math.min(maxDegree, pos, moras.length - pos); deg++) {
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
function buildTokenInfos(ipadicTokens, neologdTokens) {
  const result = [];
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
          reading: tokenMoras.length > 0 ? tokenMoras.join("") : ipadicReading
        });
        moraIdx += ipadicMoraCount;
      }
      return result;
    }
  }
  for (const token of ipadicTokens) {
    result.push({
      surface: token.surface_form,
      reading: getReading(token)
    });
  }
  return result;
}
async function analyze(input, options = {}) {
  const { higher = true, multi = true } = options;
  const [ipadic, neologd] = await Promise.all([
    getIpadicTokenizer(),
    getNeologdTokenizer()
  ]);
  const normalized = normalize(input);
  const ipadicTokens = ipadic.tokenize(normalized);
  const neologdTokens = neologd.tokenize(normalized);
  const result = {
    isGomamayo: false,
    matches: [],
    degree: 0,
    ary: 0,
    input,
    reading: ""
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
        position: i
      });
      result.degree = Math.max(result.degree, deg);
      result.ary++;
      if (!multi) break;
    }
  }
  if (result.ary === 0 && neologdTokens.length === 1 && ipadicTokens.length > 1) {
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
            position: match.position
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
async function isGomamayo(input, options = {}) {
  return (await analyze(input, options)).isGomamayo;
}
async function find(input, options = {}) {
  const result = await analyze(input, options);
  return result.isGomamayo ? result.matches : null;
}
var index_default = { analyze, isGomamayo, find };
export {
  analyze,
  index_default as default,
  find,
  isGomamayo
};
