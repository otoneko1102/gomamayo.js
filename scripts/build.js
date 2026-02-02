import consola from "consola";
import esbuild from "esbuild";
import fs from "fs/promises";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pkg = require("../package.json");

// This plugin provides the source code for the CJS build,
// with the problematic ESM-only lines already removed.
const cjsSourcePlugin = {
  name: "cjs-source",
  setup(build) {
    build.onResolve({ filter: /^cjs-entry$/ }, () => ({
      path: "cjs-entry",
      namespace: "cjs-source-ns",
    }));

    build.onLoad({ filter: /.*/, namespace: "cjs-source-ns" }, async () => {
      let contents = await fs.readFile("src/index.ts", "utf8");
      
      // fileURLToPath importを削除
      contents = contents.replace(/import \{ fileURLToPath \} from "url";\n/, "");
      
      // ESMビルド用のimport.meta.url使用部分を削除
      // try-catchブロック全体を削除して、CJSでは直接__dirnameフォールバックに行く
      contents = contents.replace(
        /try \{\s*\/\/ ESMビルドの場合: import\.meta\.urlからパスを取得[\s\S]*?\} catch \{\}/,
        ""
      );
      
      return {
        contents,
        loader: "ts",
        resolveDir: "src",
      };
    });
  },
};

const commonOptions = {
  platform: "node",
  bundle: true,
  external: Object.keys(pkg.dependencies || {}),
};

// --- Build ESM (.js) ---
esbuild
  .build({
    ...commonOptions,
    entryPoints: ["src/index.ts"],
    outfile: "dist/index.js",
    format: "esm",
    define: {
      __BUILD_FORMAT__: '"esm"',
    },
  })
  .catch((err) => consola.error("Faled to build ESM:", err))
  .then(() => consola.success("ESM build successful!"));

// --- Build CJS (.cjs) ---
esbuild
  .build({
    ...commonOptions,
    entryPoints: ["cjs-entry"], // Use a virtual entry point
    outfile: "dist/index.cjs",
    format: "cjs",
    plugins: [cjsSourcePlugin], // Use the new, more robust plugin
    define: {
      __BUILD_FORMAT__: '"cjs"',
    },
  })
  .catch((err) => consola.error("Faled to build CJS:", err))
  .then(() => consola.success("CJS build successful!"));

// --- Build CLI ---
esbuild
  .build({
    ...commonOptions,
    entryPoints: ["src/cli.ts"],
    outfile: "dist/cli.js",
    format: "esm",
    define: {
      __BUILD_FORMAT__: '"esm"',
    },
    banner: {
      js: "#!/usr/bin/env node",
    },
  })
  .catch((err) => consola.error("Failed to build CLI:", err))
  .then(() => consola.success("CLI build successful!"));
