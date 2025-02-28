const fetch = require("node-fetch-commonjs");
const fs = require("fs");
const path = require("path");

const CACHE_TIMEOUT = 3600000; // 1 hour
const CACHE_FILE = "./cache.json";
const REPO_TEMPLATE_FILE = path.join(__dirname, "repo.svg");
const GIST_TEMPLATE_FILE = path.join(__dirname, "gist.svg");

async function get(url) {
    const now = Date.now();

    let cache = {};
    if (fs.existsSync(CACHE_FILE)) {
        cache = JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"));
    }

    if (cache[url] && Math.abs(now - cache[url].time) < CACHE_TIMEOUT) {
        return cache[url].data;
    }

    const resp = await fetch(url);
    if (!resp.ok) {
        throw new Error(`Failed to fetch ${url}: ${resp.status} ${resp.statusText}`);
    }

    const json = await resp.json();
    
    cache[url] = { time: now, data: json };
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));

    return json;
}

function formatNumber(num) {
    return new Intl.NumberFormat("en", { notation: "compact", compactDisplay: "short" }).format(num);
}

function formatDate(utcString) {
    return new Date(utcString).toLocaleDateString();
}

// Generate Repository Card
async function generateRepoCard(repoName, theme = {}) {
    const defaultTheme = {
        cardBackground: '#0d1117',
        cardBorder: '#3d444d',
        titleColor: '#4493f8',
        textColor: '#9198a1',
        codeBackground: '#151b23',
        codeColor: '#ffffff'
    };

    const finalTheme = { ...defaultTheme, ...theme };

    const colors = await get("https://raw.githubusercontent.com/ozh/github-colors/master/colors.json");
    const data = await get(`https://api.github.com/repos/${repoName}`);

    let svgTemplate = fs.readFileSync(REPO_TEMPLATE_FILE, "utf-8");

    svgTemplate = svgTemplate
        .replace("{{cardBackground}}", finalTheme.cardBackground)
        .replace("{{cardBorder}}", finalTheme.cardBorder)
        .replace("{{titleColor}}", finalTheme.titleColor)
        .replace("{{textColor}}", finalTheme.textColor)
        .replace("{{url}}", data.html_url)
        .replace("{{owner}}", data.owner.login)
        .replace("{{name}}", data.name)
        .replace("{{description}}", data.description || "No description")
        .replace("{{language}}", data.language || "Unknown")
        .replace("{{languageColor}}", data.language ? (colors[data.language]?.color || "#ffffff") : "#ffffff")
        .replace("{{stars}}", formatNumber(data.stargazers_count))
        .replace("{{forks}}", formatNumber(data.forks))
        .replace("{{updatedAt}}", formatDate(data.updated_at));

    return svgTemplate;
}

// Generate Gist Card
async function generateGistCard(gistId, theme = {}) {
    const defaultTheme = {
        cardBackground: '#0d1117',
        cardBorder: '#3d444d',
        titleColor: '#4493f8',
        textColor: '#9198a1',
        codeBackground: '#151b23',
        codeColor: '#ffffff'
    };

    const finalTheme = { ...defaultTheme, ...theme };

    const data = await get(`https://api.github.com/gists/${gistId}`);

    let svgTemplate = fs.readFileSync(GIST_TEMPLATE_FILE, "utf-8");

    svgTemplate = svgTemplate
        .replace("{{cardBackground}}", finalTheme.cardBackground)
        .replace("{{cardBorder}}", finalTheme.cardBorder)
        .replace("{{titleColor}}", finalTheme.titleColor)
        .replace("{{textColor}}", finalTheme.textColor)
        .replace("{{codeBackground}}", finalTheme.codeBackground)
        .replace("{{codeColor}}", finalTheme.codeColor)
        .replace("{{url}}", data.html_url)
        .replace("{{owner}}", data.owner.login)
        .replace("{{name}}", data.description || data.files[Object.keys(data.files)[0]].filename)
        .replace("{{content}}", data.files[Object.keys(data.files)[0]].content || "No content available");

    return svgTemplate;
}

module.exports = { generateRepoCard, generateGistCard };
