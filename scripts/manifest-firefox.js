import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';

const src = join(process.cwd(), 'manifest.json');
const dest = join(process.cwd(), 'dist/manifest.json');

// Remove old manifest if it exists
if (existsSync(dest)) {
    unlinkSync(dest);
}

const manifest = JSON.parse(readFileSync(src, 'utf8'));

// Remove unsupported Chrome-only properties
delete manifest.side_panel;
if (manifest.permissions) {
    manifest.permissions = manifest.permissions.filter((perm) => perm !== 'sidePanel');
}

// Add Firefox sidebar_action
manifest.sidebar_action = {
    default_title: manifest.name,
    default_panel: "index.html",
    default_icon: manifest.icons
};

// Append '-firefox' to the extension name
manifest.name = `${manifest.name} - Firefox`;

manifest.browser_specific_settings = {
    gecko: {
        id: "your-extension-id@mozilla.org",
        strict_min_version: "109.0"
    }
};

writeFileSync(dest, JSON.stringify(manifest, null, 2));
console.log('Firefox manifest with sidebar_action copied to dist/manifest.json'); 