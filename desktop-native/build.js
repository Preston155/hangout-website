const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname);
const DIST = path.join(ROOT, "dist");
const PUBLISH = path.join(ROOT, "bin", "Release", "net8.0-windows", "win-x64", "publish");
const OUT = path.join(__dirname, "..", "httpdocs-ready", "downloads");
const PACKAGE_NAME = "Discord-Remake-Setup.exe";

function run(cmd, cwd = ROOT) {
  console.log(`> ${cmd}`);
  execSync(cmd, { cwd, stdio: "inherit", shell: true });
}

function rimraf(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) rimraf(full);
    else fs.unlinkSync(full);
  }
  fs.rmdirSync(dir);
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(from, to);
    else fs.copyFileSync(from, to);
  }
}

function collectPackageFiles() {
  if (!fs.existsSync(PUBLISH)) return [];

  const files = [];
  for (const entry of fs.readdirSync(PUBLISH, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    const ext = path.extname(entry.name).toLowerCase();
    if (ext === ".pdb" || ext === ".xml") continue;
    if ([".exe", ".dll", ".json"].includes(ext)) {
      files.push(path.join(PUBLISH, entry.name));
    }
  }
  return files;
}

function buildSed(targetExe, stagingDir, fileNames) {
  const sourceDir = stagingDir.endsWith("\\") ? stagingDir : `${stagingDir}\\`;
  const filesBlock = fileNames.map((name) => `${name}=`).join("\n");
  return `[Version]
Class=IEXPRESS
SEDVersion=3
[Options]
PackagePurpose=InstallApp
ShowInstallProgramWindow=0
HideExtractAnimation=1
UseLongFileName=1
InsideCompress=1
CAB_FixedSize=0
CAB_ResvCodeSigning=0
RebootMode=N
InstallPrompt=
DisplayLicense=
FinishMessage=
TargetName=${targetExe}
FriendlyName=Discord Remake
AppLaunched=Discord Remake.exe
PostInstallCmd=<None>
AdminQuietInstCmd=
UserQuietInstCmd=
SourceFiles=SourceFiles

[Strings]

[SourceFiles]
SourceFiles0=${sourceDir}

[SourceFiles0]
${filesBlock}
`;
}

function packageWithIExpress(stagingDir, targetExe) {
  const names = fs.readdirSync(stagingDir).filter((f) => !fs.statSync(path.join(stagingDir, f)).isDirectory());
  const sedPath = path.join(ROOT, "package.sed");
  fs.writeFileSync(sedPath, buildSed(targetExe, stagingDir, names));
  try {
    execSync(`cd /d "${ROOT}" && iexpress /N /Q package.sed`, { stdio: "pipe", shell: true });
  } catch {
    // IExpress may return non-zero even when successful.
  } finally {
    if (fs.existsSync(sedPath)) fs.unlinkSync(sedPath);
  }
}

function main() {
  console.log("Building native Windows app (WebView2, no Electron)...\n");

  run("dotnet restore");
  run("dotnet publish -c Release -r win-x64 -p:PublishSingleFile=false -p:SelfContained=false");

  const packageFiles = collectPackageFiles();
  const exe = packageFiles.find((f) => f.endsWith(".exe"));
  if (!exe) {
    console.error("Publish failed — no exe found.");
    process.exit(1);
  }

  const staging = path.join(ROOT, "package-staging");
  rimraf(staging);
  fs.mkdirSync(staging, { recursive: true });

  for (const file of packageFiles) {
    fs.copyFileSync(file, path.join(staging, path.basename(file)));
  }

  fs.mkdirSync(DIST, { recursive: true });
  const distPackage = path.join(DIST, PACKAGE_NAME);
  if (fs.existsSync(distPackage)) fs.unlinkSync(distPackage);
  packageWithIExpress(staging, distPackage);
  rimraf(staging);

  if (!fs.existsSync(distPackage)) {
    console.error("Packaging failed — falling back to copying publish folder.");
    fs.mkdirSync(path.join(DIST, "app"), { recursive: true });
    copyDir(PUBLISH, path.join(DIST, "app"));
    process.exit(1);
  }

  fs.mkdirSync(OUT, { recursive: true });
  fs.copyFileSync(distPackage, path.join(OUT, PACKAGE_NAME));
  fs.copyFileSync(distPackage, path.join(OUT, "Discord-Remake-Portable.exe"));

  const mb = (fs.statSync(distPackage).size / 1024 / 1024).toFixed(2);
  console.log(`\nBuilt native app package: ${PACKAGE_NAME} (${mb} MB)`);
  console.log("Includes WebView2Loader.dll — no separate install needed.");
  console.log(`Copied → httpdocs-ready/downloads/`);
}

main();
