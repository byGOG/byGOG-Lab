const fs = require('fs');
const https = require('https');
const http = require('http');
const path = require('path');

const linksPath = path.join(__dirname, '../links.json');
let data;

try {
    data = JSON.parse(fs.readFileSync(linksPath, 'utf8'));
} catch (err) {
    console.error("links.json okunamadı:", err.message);
    process.exit(1);
}

const allLinks = [];
if (data.categories) {
    data.categories.forEach(c => {
        if (c.links) allLinks.push(...c.links);
        if (c.subcategories) c.subcategories.forEach(s => allLinks.push(...s.links));
    });
}

console.log(`Toplam ${allLinks.length} link kontrol edilecek...`);

function checkUrl(url) {
    return new Promise(resolve => {
        const client = url.startsWith('https') ? https : http;
        const req = client.request(url, { method: 'HEAD', timeout: 5000 }, res => {
            resolve({ url, status: res.statusCode, ok: res.statusCode >= 200 && res.statusCode < 400 });
        });
        req.on('error', err => resolve({ url, status: 0, ok: false, error: err.message }));
        req.on('timeout', () => { req.destroy(); resolve({ url, status: 0, ok: false, error: "Timeout" }); });
        req.end();
    });
}

async function run() {
    let broken = 0;
    // Process in chunks to avoid overwhelming network
    const chunk = 10;
    for (let i = 0; i < allLinks.length; i += chunk) {
        const batch = allLinks.slice(i, i + chunk).map(l => checkUrl(l.url));
        const results = await Promise.all(batch);
        results.forEach(r => {
            if (!r.ok) {
                broken++;
                console.log(`[HATA] ${r.status || 'ERR'} - ${r.url} (${r.error || ''})`);
            } else {
                // console.log(`[OK] ${r.url}`);
            }
        });
        process.stdout.write(`\rİlerleme: ${Math.min(i + chunk, allLinks.length)}/${allLinks.length}`);
    }
    console.log(`\n\nTamamlandı. ${broken} kırık link bulundu.`);
}

run();
