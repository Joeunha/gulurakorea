/**
 * Claude Artifact 용 단일 파일 빌드.
 *
 * src/ 아래 모듈을 의존성 순서대로 이어 붙이고 import/export 를 제거한 뒤,
 * 시군구 데이터와 .env 의 키를 직접 박아 넣은 단일 .jsx 를 만듭니다.
 *
 *   npm run build:artifact  →  dist-artifact/palto-jeongbok.jsx
 *
 * 결과물에는 API 키가 평문으로 들어갑니다. dist-artifact/ 는 .gitignore 대상입니다.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ENTRY = "src/App.jsx";
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

function loadEnv() {
  const out = {};
  const file = path.join(root, ".env");
  if (!fs.existsSync(file)) return out;
  for (const raw of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 0) continue;
    out[line.slice(0, eq).trim()] = line.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
  }
  return out;
}

const localImports = (code, fromRel) =>
  [...code.matchAll(/from\s+"(\.[^"]+)"/g)]
    .map((m) => path.posix.normalize(path.posix.join(path.posix.dirname(fromRel), m[1])))
    .filter((p) => (p.endsWith(".js") || p.endsWith(".jsx")) && p !== "src/config.js");
// config.js 는 환경변수 로더라 아티팩트에서는 제외한다 (키를 직접 치환하므로 불필요)

const order = [];
const seen = new Set();
(function walk(rel) {
  if (seen.has(rel)) return;
  seen.add(rel);
  for (const dep of localImports(read(rel), rel)) walk(dep);
  order.push(rel);
})(ENTRY);

const chunks = [];
for (const rel of order) {
  let code = read(rel);
  code = code.replace(/^\/\*\*[\s\S]*?\*\/\n/, "");
  code = code.replace(/^import[\s\S]*?from\s+"[^"]+";\s*$/gm, "");
  code = code.replace(/^export (?!default)/gm, "");
  chunks.push("/* \u2550\u2550\u2550\u2550 " + rel + " \u2550\u2550\u2550\u2550 */\n" + code.trim());
}

let src = 'import React, { useState, useRef, useEffect, useMemo } from "react";\n\n' + chunks.join("\n\n");

const data = JSON.parse(read("data/sigungu_data.json"));
if (!src.includes("const SIGUNGU = SIGUNGU_DATA;")) throw new Error("SIGUNGU 주입 지점을 찾지 못했습니다");
src = src.replace("const SIGUNGU = SIGUNGU_DATA;", "const SIGUNGU = " + JSON.stringify(data) + ";");

const env = loadEnv();
const subs = {
  "CFG.tourKey": env.VITE_TOUR_API_KEY,
  "CFG.tourProxy": env.VITE_TOUR_PROXY,
  "CFG.kakaoJs": env.VITE_KAKAO_JS_KEY,
  "CFG.kakaoRest": env.VITE_KAKAO_REST_KEY,
  "CFG.kakaoNative": env.VITE_KAKAO_NATIVE_KEY,
  "CFG.kakaoProxy": env.VITE_KAKAO_PROXY,
};
const empty = [];
for (const [token, value] of Object.entries(subs)) {
  if (!src.includes(token)) continue;
  if (!value) empty.push(token);
  src = src.split(token).join(JSON.stringify(value || ""));
}

const outDir = path.join(root, "dist-artifact");
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "palto-jeongbok.jsx");
fs.writeFileSync(outFile, src, "utf8");

const bal = (a, b) => src.split(a).length - src.split(b).length;
const rest = src.split("\n").slice(1).join("\n");
const checks = [
  ["\uc911\uad04\ud638 \uade0\ud615", bal("{", "}") === 0],
  ["\uc18c\uad04\ud638 \uade0\ud615", bal("(", ")") === 0],
  ["\ub300\uad04\ud638 \uade0\ud615", bal("[", "]") === 0],
  ["\uc794\uc5ec import \uc5c6\uc74c", !/^import .*from/m.test(rest)],
  ["\uc124\uc815 \ud1a0\ud070 \uce58\ud658 \uc644\ub8cc", !Object.keys(subs).some((t) => src.includes(t))],
  ["default export 1\uac1c", (src.match(/export default/g) || []).length === 1],
];

console.log("\u2192 " + path.relative(root, outFile) + "  (" + src.length.toLocaleString() + " bytes, " + order.length + " modules, " + data.length + " features)");
for (const [name, ok] of checks) console.log((ok ? "  \u2705 " : "  \u274c ") + name);
if (empty.length) console.log("  \u26a0 .env \uc5d0 \ube44\uc5b4 \uc788\ub294 \uac12: " + empty.join(", "));
if (checks.some(([, ok]) => !ok)) process.exit(1);
