const fetch = require("node-fetch-commonjs");
const fs = require("fs");
const path = require("path");
const escapeHtml = require('escape-html');

const REPO_TEMPLATE_FILE = path.join(__dirname, "repo.svg");
const GIST_TEMPLATE_FILE = path.join(__dirname, "gist.svg");

const cache = {};
const CACHE_TIMEOUT = 3600000; // 1 hour

async function get(url) {
    const now = Date.now();

    if (cache[url] && Math.abs(now - cache[url].time) < CACHE_TIMEOUT) {
        return cache[url].data;
    }

    const resp = await fetch(url);
    if (!resp.ok) {
        throw new Error(`Failed to fetch ${url}: ${resp.status} ${resp.statusText}`);
    }

    const json = await resp.json();

    cache[url] = { time: now, data: json };

    return json;
}

function formatNumber(num) {
    return new Intl.NumberFormat("en", { notation: "compact", compactDisplay: "short" }).format(num);
}

function formatDate(utcString) {
    return new Date(utcString).toLocaleDateString();
}

// Generate Repository Card
async function generateRepoCard(repoOwner, repoName, theme = {}) {
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
    const data = await get(`https://api.github.com/repos/${repoOwner}/${repoName}`);

    let svgTemplate = fs.readFileSync(REPO_TEMPLATE_FILE, "utf-8");

    svgTemplate = svgTemplate
        .replaceAll("{{cardBackground}}", finalTheme.cardBackground)
        .replaceAll("{{cardBorder}}", finalTheme.cardBorder)
        .replaceAll("{{titleColor}}", finalTheme.titleColor)
        .replaceAll("{{textColor}}", finalTheme.textColor)
        .replaceAll("{{url}}", data.html_url)
        .replaceAll("{{owner}}", escapeHtml(data.owner.login))
        .replaceAll("{{name}}", escapeHtml(data.name))
        .replaceAll("{{description}}", escapeHtml(data.description))
        .replaceAll("{{language}}", data.language || "Unknown")
        .replaceAll("{{languageColor}}", data.language ? (colors[data.language]?.color || "#ffffff") : "#ffffff")
        .replaceAll("{{stars}}", formatNumber(data.stargazers_count))
        .replaceAll("{{forks}}", formatNumber(data.forks))
        .replaceAll("{{updatedAt}}", formatDate(data.updated_at));

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
        .replaceAll("{{cardBackground}}", finalTheme.cardBackground)
        .replaceAll("{{cardBorder}}", finalTheme.cardBorder)
        .replaceAll("{{titleColor}}", finalTheme.titleColor)
        .replaceAll("{{textColor}}", finalTheme.textColor)
        .replaceAll("{{codeBackground}}", finalTheme.codeBackground)
        .replaceAll("{{codeColor}}", finalTheme.codeColor)
        .replaceAll("{{url}}", data.html_url)
        .replaceAll("{{owner}}", escapeHtml(data.owner.login))
        .replaceAll("{{name}}", escapeHtml(data.description) || escapeHtml(data.files[Object.keys(data.files)[0]].filename))
        .replaceAll("{{content}}", escapeHtml(data.files[Object.keys(data.files)[0]].content))

    return svgTemplate;
}

module.exports = { generateRepoCard, generateGistCard };
