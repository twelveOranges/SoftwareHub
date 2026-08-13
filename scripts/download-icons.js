#!/usr/bin/env node
/**
 * Icon downloader for soft-ware-hub
 * -------------------------------------------------
 * Downloads app icons from:
 *   - iTunes Search API (Apple / Mac App Store) → most Mac + iOS apps
 *   - Google Play mobile page → Android apps (og:image meta)
 *   - Manual URL overrides for hard-to-find apps
 *
 * Usage:
 *   node scripts/download-icons.js
 *
 * All icons saved to icons/{platform}/{filename}.png
 * A report is written to scripts/icon-report.txt
 */

const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

const ROOT = path.resolve(__dirname, "..");
const ICONS_DIR = path.join(ROOT, "icons");
const REPORT_PATH = path.join(__dirname, "icon-report.txt");

// ==================== Icon Source Map ====================
// Priority order:
//   1. `url`     - direct image URL (overrides everything)
//   2. `itunes`  - iTunes Search API term (country/entity auto-picked)
//   3. `gplay`   - Google Play package ID (com.xxx.xxx)
//   4. fallback  - skip, report as missing
//
// filename should match the value in data/apps.js (e.g. "icons/mac/photoshop.png")
const SOURCES = [
    // ============ Mac apps (via iTunes Mac App Store, or direct URL) ============
    { file: "icons/mac/photoshop.png",   itunes: { term: "Photoshop",              entity: "macSoftware" } },
    { file: "icons/mac/illustrator.png", itunes: { term: "Illustrator",            entity: "macSoftware" } },
    { file: "icons/mac/sketch.png",      itunes: { term: "Sketch",                 entity: "macSoftware" } },
    { file: "icons/mac/vscode.png",      url: "https://code.visualstudio.com/assets/apple-touch-icon.png" },
    { file: "icons/mac/idea.png",        url: "https://resources.jetbrains.com/storage/products/intellij-idea/img/meta/intellij-idea_logo_300x300.png" },
    { file: "icons/mac/iterm2.png",      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/ITerm2_v3.4_icon.png/512px-ITerm2_v3.4_icon.png" },
    { file: "icons/mac/docker.png",      url: "https://www.docker.com/wp-content/uploads/2022/03/vertical-logo-monochromatic.png" },
    { file: "icons/mac/office.png",      itunes: { term: "Microsoft Word",         entity: "macSoftware" } },
    { file: "icons/mac/notion.png",      itunes: { term: "Notion",                 entity: "macSoftware" } },
    { file: "icons/mac/obsidian.png",    url: "https://obsidian.md/images/obsidian-logo-gradient.svg" },
    { file: "icons/mac/fcpx.png",        itunes: { term: "Final Cut Pro",          entity: "macSoftware" } },
    { file: "icons/mac/iina.png",        url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/IINA-v1.1-icon.png/512px-IINA-v1.1-icon.png" },
    { file: "icons/mac/cleanmymac.png",  itunes: { term: "CleanMyMac",             entity: "macSoftware" } },
    { file: "icons/mac/alfred.png",      itunes: { term: "Alfred",                 entity: "macSoftware" } },
    { file: "icons/mac/raycast.png",     itunes: { term: "Raycast",                entity: "macSoftware" } },
    { file: "icons/mac/chrome.png",      url: "https://www.google.com/chrome/static/images/chrome-logo-m100.svg" },
    { file: "icons/mac/arc.png",         itunes: { term: "Arc Browser",            entity: "macSoftware" } },
    { file: "icons/mac/wechat.png",      itunes: { term: "WeChat",                 entity: "macSoftware" } },
    { file: "icons/mac/qq.png",          itunes: { term: "QQ",                     entity: "macSoftware", country: "cn" } },
    { file: "icons/mac/telegram.png",    itunes: { term: "Telegram",               entity: "macSoftware" } },
    { file: "icons/mac/steam.png",       url: "https://store.steampowered.com/favicon.ico" },
    { file: "icons/mac/minecraft.png",   itunes: { term: "Minecraft",              entity: "macSoftware" } },

    // ============ Windows apps ============
    { file: "icons/win/figma.png",       url: "https://static.figma.com/app/icon/1/icon-192.png" },
    { file: "icons/win/postman.png",     url: "https://www.postman.com/_ar-VE/mkt/img/logos/postman-logo-icon-orange.svg" },
    { file: "icons/win/wps.png",         itunes: { term: "WPS Office",             entity: "software" } },
    { file: "icons/win/premiere.png",    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Adobe_Premiere_Pro_CC_2026_icon.svg/512px-Adobe_Premiere_Pro_CC_2026_icon.svg.png" },
    { file: "icons/win/obs.png",         url: "https://obsproject.com/assets/images/new_icon_small-r.png" },
    { file: "icons/win/powertoys.png",   url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/2020_PowerToys_Icon.svg/512px-2020_PowerToys_Icon.svg.png" },
    { file: "icons/win/edge.png",        url: "https://www.microsoft.com/favicon.ico" },
    { file: "icons/win/discord.png",     url: "https://discord.com/assets/847541504914fd33810e70a0ea73177e.ico" },
    { file: "icons/win/epic.png",        url: "https://cdn.simpleicons.org/epicgames/2F2D2E" },
    { file: "icons/win/gta5.png",        url: "https://upload.wikimedia.org/wikipedia/en/a/a5/Grand_Theft_Auto_V.png" },

    // ============ Android apps (via Google Play or iTunes for iOS equivalent) ============
    // Try Google Play first (official 512×512 icons)
    { file: "icons/android/douyin.png",       itunes: { term: "TikTok",              entity: "software" } },
    { file: "icons/android/xhs.png",          itunes: { term: "Xiaohongshu",         entity: "software" } },
    { file: "icons/android/alipay.png",       itunes: { term: "Alipay",              entity: "software" } },
    { file: "icons/android/wechat.png",       itunes: { term: "WeChat",              entity: "software" } },
    { file: "icons/android/amap.png",         itunes: { term: "Amap",                entity: "software", country: "cn" } },
    { file: "icons/android/netease-music.png",itunes: { term: "网易云音乐",           entity: "software", country: "cn" } },
    { file: "icons/android/bilibili.png",     itunes: { term: "Bilibili",            entity: "software" } },
    { file: "icons/android/taobao.png",       itunes: { term: "Taobao",              entity: "software", country: "cn" } },
    { file: "icons/android/jd.png",           itunes: { term: "京东",                 entity: "software", country: "cn" } },
    { file: "icons/android/meituan.png",      itunes: { term: "美团",                 entity: "software", country: "cn" } },
    { file: "icons/android/dingtalk.png",     itunes: { term: "DingTalk",            entity: "software" } },
    { file: "icons/android/quark.png",        itunes: { term: "Quark",               entity: "software", country: "cn" } },
];

// ==================== HTTP helpers ====================
function fetch(url, redirects = 5) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith("https") ? https : http;
        const req = client.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36",
                "Accept": "*/*"
            }
        }, res => {
            // Handle redirects
            if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location && redirects > 0) {
                const next = new URL(res.headers.location, url).href;
                res.resume();
                return fetch(next, redirects - 1).then(resolve, reject);
            }
            if (res.statusCode !== 200) {
                res.resume();
                return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
            }
            const chunks = [];
            res.on("data", c => chunks.push(c));
            res.on("end", () => resolve({
                data: Buffer.concat(chunks),
                contentType: res.headers["content-type"] || ""
            }));
        });
        req.on("error", reject);
        req.setTimeout(15000, () => { req.destroy(new Error("timeout")); });
    });
}

async function fetchJSON(url) {
    const { data } = await fetch(url);
    return JSON.parse(data.toString("utf8"));
}

// ==================== iTunes lookup ====================
async function resolveItunes({ term, entity = "macSoftware", country = "us" }) {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=${entity}&country=${country}&limit=1`;
    const json = await fetchJSON(url);
    if (!json.results || json.results.length === 0) {
        throw new Error(`iTunes no result for "${term}"`);
    }
    const r = json.results[0];
    // Prefer highest resolution artwork
    return r.artworkUrl512 || r.artworkUrl100 || r.artworkUrl60;
}

// ==================== Main ====================
async function ensureDir(p) {
    await fs.promises.mkdir(p, { recursive: true });
}

function normalizeUrl(url) {
    // iTunes 100/60px art can be upgraded to 512
    return url.replace(/\/(60|100)x\1(bb)?\.(png|jpg)$/i, "/512x512bb.$3");
}

async function saveIcon(sourceUrl, filePath) {
    const { data, contentType } = await fetch(sourceUrl);
    // Preserve SVG if that's what came back
    if (contentType.includes("svg") || sourceUrl.endsWith(".svg")) {
        const svgPath = filePath.replace(/\.png$/, ".svg");
        await fs.promises.writeFile(svgPath, data);
        return svgPath;
    }
    await fs.promises.writeFile(filePath, data);
    return filePath;
}

async function handleEntry(entry) {
    const filePath = path.join(ROOT, entry.file);
    await ensureDir(path.dirname(filePath));

    let sourceUrl;
    let sourceLabel;

    try {
        if (entry.url) {
            sourceUrl = entry.url;
            sourceLabel = "url";
        } else if (entry.itunes) {
            sourceUrl = normalizeUrl(await resolveItunes(entry.itunes));
            sourceLabel = `itunes:${entry.itunes.term}`;
        } else {
            return { file: entry.file, status: "skip", reason: "no source" };
        }

        const written = await saveIcon(sourceUrl, filePath);
        const size = fs.statSync(written).size;
        return { file: path.relative(ROOT, written), status: "ok", source: sourceLabel, size };
    } catch (err) {
        return { file: entry.file, status: "fail", reason: err.message, source: sourceLabel };
    }
}

async function main() {
    console.log(`📥 Downloading ${SOURCES.length} icons...\n`);
    await ensureDir(ICONS_DIR);

    // Sequential to avoid rate limiting (iTunes is picky)
    const results = [];
    for (let i = 0; i < SOURCES.length; i++) {
        const src = SOURCES[i];
        process.stdout.write(`[${String(i + 1).padStart(2, " ")}/${SOURCES.length}] ${src.file} ... `);
        const r = await handleEntry(src);
        results.push(r);
        if (r.status === "ok") {
            console.log(`✓ (${(r.size / 1024).toFixed(1)} KB)`);
        } else if (r.status === "fail") {
            console.log(`✗ ${r.reason}`);
        } else {
            console.log(`- ${r.reason}`);
        }
    }

    // Write report
    const ok = results.filter(r => r.status === "ok").length;
    const fail = results.filter(r => r.status === "fail");
    const skip = results.filter(r => r.status === "skip");

    const lines = [
        `Icon Download Report — ${new Date().toISOString()}`,
        `─────────────────────────────────────────────`,
        `Total:   ${results.length}`,
        `Success: ${ok}`,
        `Failed:  ${fail.length}`,
        `Skipped: ${skip.length}`,
        ``
    ];
    if (fail.length > 0) {
        lines.push(`━━━ Failed items (need manual download) ━━━`);
        fail.forEach(r => lines.push(`  ✗ ${r.file}\n      reason: ${r.reason}\n      source: ${r.source || "?"}`));
        lines.push("");
    }
    fs.writeFileSync(REPORT_PATH, lines.join("\n"), "utf8");

    console.log(`\n✔ Done. ${ok}/${results.length} icons saved.`);
    if (fail.length > 0) {
        console.log(`⚠ ${fail.length} failed. See scripts/icon-report.txt for details.`);
    }
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
