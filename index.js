const fetch = require("node-fetch-commonjs");
const fs = require("fs");
const path = require("path");
const escapeHtml = require('escape-html');

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
        .replace("{{owner}}", escapeHtml(data.owner.login))
        .replace("{{name}}", escapeHtml(data.name))
        .replace("{{description}}", escapeHtml(data.description))
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
        .replace("{{owner}}", escapeHtml(data.owner.login))
        .replace("{{name}}", escapeHtml(data.description) || escapeHtml(data.files[Object.keys(data.files)[0]].filename))
        .replace("{{content}}", escapeHtml(data.files[Object.keys(data.files)[0]].content))

    return svgTemplate;
}

module.exports = { generateRepoCard, generateGistCard };
