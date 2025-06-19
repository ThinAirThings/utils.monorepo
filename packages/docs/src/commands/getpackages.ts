import { Command } from "commander";
import { cosmiconfigSync } from "cosmiconfig";
import { extname } from "path";

import fs from "fs";
import path from "path";
import fetch from "node-fetch";

type PackageInfo = {
  name: string;
  version: string;
};

function readPackageJson(pkgPath: string): PackageInfo[] {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  return Object.entries(deps).map(([name, version]) => ({
    name,
    version: String(version),
  }));
}

function readYarnLock(lockPath: string): PackageInfo[] {
  const content = fs.readFileSync(lockPath, "utf-8");
  const regex = /^"?(@?[^@:\s]+)@[^:]+:\n\s+version "(.*?)"/gm;
  const pkgs: PackageInfo[] = [];
  let match;
  while ((match = regex.exec(content))) {
    pkgs.push({ name: match[1], version: match[2] });
  }
  return pkgs;
}

function readPnpmLock(lockPath: string): PackageInfo[] {
  const content = fs.readFileSync(lockPath, "utf-8");
  const regex = /^ {2}([^:]+):\n {4}version: (.*)$/gm;
  const pkgs: PackageInfo[] = [];
  let match;
  while ((match = regex.exec(content))) {
    pkgs.push({ name: match[1], version: match[2] });
  }
  return pkgs;
}

type PackageDocInfo = {
  name: string;
  version: string;
  docsUrl: string | null;
};

async function getNpmDocsUrl(pkgName: string): Promise<string | null> {
  try {
    const res = await fetch(`https://registry.npmjs.org/${pkgName}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.homepage) return data.homepage;
    if (data.repository && data.repository.url) {
      // Try to convert git+https://github.com/foo/bar.git to https://github.com/foo/bar
      const repoUrl = String(data.repository.url)
        .replace(/^git\+/, "")
        .replace(/\.git$/, "");
      return repoUrl;
    }
    return null;
  } catch {
    return null;
  }
}

async function getDocsPagesForPackages(
  packages: PackageInfo[]
): Promise<PackageDocInfo[]> {
  const results: PackageDocInfo[] = [];
  for (const pkg of packages) {
    const docsUrl = await getNpmDocsUrl(pkg.name);
    results.push({ ...pkg, docsUrl });
  }
  return results;
}

function findPackageFiles(dir: string) {
  const files = fs.readdirSync(dir);
  const found = {
    packageJson: files.includes("package.json")
      ? path.join(dir, "package.json")
      : null,
    yarnLock: files.includes("yarn.lock") ? path.join(dir, "yarn.lock") : null,
    pnpmLock: files.includes("pnpm-lock.yaml")
      ? path.join(dir, "pnpm-lock.yaml")
      : null,
  };
  return found;
}

async function githubDocsUrlToReadme(docsUrl: string): Promise<string | null> {
  // Convert GitHub URLs to a more readable format
  // Convert to direct link to README.md in the default branch
  // Remove any fragment/hash from the URL before matching
  const cleanUrl = docsUrl.split("#")[0];
  const match = cleanUrl.match(
    /^https:\/\/github\.com\/([^\/]+)\/([^\/]+)(?:\/|$)/
  );
  if (match) {
    const [_, owner, repo] = match;
    // Try common README filename variants
    const readmeVariants = [
      "README.md",
      "Readme.md",
      "readme.md",
      "README.MD",
      "ReadMe.md",
      "readMe.md",
    ];

    // Check which README variant exists via a HEAD request
    const baseUrl = `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/`;
    for (const variant of readmeVariants) {
      try {
        const res = await fetch(baseUrl + variant, { method: "HEAD" });
        if (res.ok) {
          return baseUrl + variant;
        }
      } catch {
        // ignore errors and try next variant
      }
    }
    // Fallback to the first variant if none found
    return baseUrl + readmeVariants[0];
  }
  return docsUrl;
}

const getPackagesCommand = new Command("get-packages")
  .description(
    "Get package names and versions from package.json, yarn.lock, or pnpm-lock.yaml"
  )
  .option(
    "--dir <path>",
    "Directory to search for package files (default: current directory)"
  )
  .action((options) => {
    const dir = options.dir || process.cwd();
    const files = findPackageFiles(dir);

    let packages: PackageInfo[] = [];

    if (files.packageJson) {
      packages = readPackageJson(files.packageJson);
    } else if (files.yarnLock) {
      packages = readYarnLock(files.yarnLock);
    } else if (files.pnpmLock) {
      packages = readPnpmLock(files.pnpmLock);
    } else {
      console.error("No package files found in the specified directory.");
      process.exit(1);
    }

    const searchPlaces = [
      options.config,
      "thinair.docs.config.ts",
      "thinair.docs.config.js",
    ].filter(Boolean);

    const explorer = cosmiconfigSync("thinair", {
      searchPlaces,
    });

    const configFile = explorer.search();
    if (!configFile) {
      console.error("Configuration file not found.");
      process.exit(1);
    }

    let existingPackages: PackageInfo[] = [];
    if (configFile.config && Array.isArray(configFile.config.docsLinks)) {
        // Try to extract package names from existing docsLinks if possible
        // This assumes docsLinks are URLs, so we try to extract package names from them
        const urlRegex = /\/package\/([^\/@]+)(?:@([^\/]+))?/;
        existingPackages = configFile.config.docsLinks
            .map((url: string) => {
                // Try to extract npm package name from URL
                const match = url.match(urlRegex);
                if (match) {
                    return { name: match[1], version: match[2] || "latest" };
                }
                return null;
            })
            .filter(Boolean) as PackageInfo[];
    }

    getDocsPagesForPackages(packages).then(async (docsInfos) => {
      const docsLinksArray = await Promise.all(
        docsInfos.map(async (info) => {
          if (info.docsUrl && info.docsUrl.includes("github.com")) {
            // Convert GitHub URLs to README links
            info.docsUrl = await githubDocsUrlToReadme(info.docsUrl);
          }
          return info.docsUrl;
        })
      );

    const uniqueDocsLinksArray = Array.from(new Set(docsLinksArray.filter(Boolean)));
    const docsLinksString = JSON.stringify(uniqueDocsLinksArray, null, 2);

      const ext = extname(configFile.filepath);
      if (ext === ".js" || ext === ".ts") {
        // Read the original config file as text
        let configText = fs.readFileSync(configFile.filepath, "utf-8");

        // Replace the docsLinks assignment (handles both export default and module.exports)
        configText = configText.replace(
          /(docsLinks\s*:\s*)(\[.*?\]|undefined|null)/s,
          `$1${docsLinksString}`
        );

        // If docsLinks doesn't exist, add it (simple heuristic)
        if (!/docsLinks\s*:/.test(configText)) {
          configText = configText.replace(
            /({[\s\S]*?)(\n})/,
            `$1,\n  docsLinks: ${docsLinksString}$2`
          );
        }

        fs.writeFileSync(configFile.filepath, configText, "utf-8");
      } else {
        // Fallback to JSON for .json files
        const config = configFile.config;
        config.docsLinks = docsInfos
          .map((info) => info.docsUrl)
          .filter(Boolean);
        fs.writeFileSync(
          configFile.filepath,
          JSON.stringify(config, null, 2),
          "utf-8"
        );
      }
      console.log(`Updated ${configFile.filepath} with docs URLs.`);
    });
  });

export default getPackagesCommand;
