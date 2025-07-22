import { defineManifest } from "@crxjs/vite-plugin";
import packageJson from "../package.json";
import { env } from "process";

const { version } = packageJson;

// Convert from Semver (example: 0.1.0-beta6)
const [major, minor, patch] = version
  // can only contain digits, dots, or dash
  .replace(/[^\d.-]+/g, "")
  // split into version parts
  .split(/[.-]/);

export default defineManifest(async () => ({
  manifest_version: 3,
  name:
    env.mode === "development" ? `DEV: ${packageJson.name}` : packageJson.name,
  description: packageJson.description,
  version: `${major}.${minor}.${patch}`,
  version_name: version,
  icons: {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png",
  },
  side_panel: {
    default_path: "index.html",
  },
  host_permissions: ["<all_urls>"],
  content_scripts: [
    {
      // matches: ["https://*/*", "http://*/*"],
      matches: ["<all_urls>"],
      js: ["src/content/index.ts"],
    },
  ],
  background: {
    service_worker: "src/background/index.ts",
  },
  // options_ui: {
  //     page: "src/options/options.html",
  //     open_in_tab: false,
  // },
  action: {
    default_popup: "src/pages/popup/index.html",
    default_icon: {
      "128": "icons/icon128.png",
    },
  },
  permissions: [
    "storage",
    "sidePanel",
    "activeTab",
    "bookmarks",
    "cookies",
    "scripting",
  ] as chrome.runtime.ManifestPermissions[],
}));
