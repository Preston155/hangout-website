const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname);
const DIST = path.join(ROOT, "dist");
const OUT = path.join(__dirname, "..", "httpdocs-ready", "downloads");
const BAT = path.join(ROOT, "launcher.bat");
const EXE_NAME = "Discord-Remake-Setup.exe";

function buildSed(targetExe) {
  const sourceDir = ROOT.endsWith("\\") ? ROOT : ROOT + "\\";
  const target = targetExe;
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
TargetName=${target}
FriendlyName=Discord Remake
AppLaunched=launcher.bat
PostInstallCmd=<None>
AdminQuietInstCmd=
UserQuietInstCmd=
SourceFiles=SourceFiles

[Strings]

[SourceFiles]
SourceFiles0=${sourceDir}

[SourceFiles0]
launcher.bat=
`;
}

function main() {
  if (!fs.existsSync(BAT)) {
    console.error("Missing launcher.bat");
    process.exit(1);
  }

  fs.mkdirSync(DIST, { recursive: true });
  const targetExe = path.join(DIST, EXE_NAME);
  if (fs.existsSync(targetExe)) fs.unlinkSync(targetExe);
  const sedPath = path.join(ROOT, "launcher.sed");
  fs.writeFileSync(sedPath, buildSed(targetExe));

  console.log("Building lightweight desktop launcher...");
  try {
    execSync(`cd /d "${ROOT}" && iexpress /N /Q launcher.sed`, { stdio: "pipe", shell: true });
  } catch {
    // IExpress sometimes returns non-zero even when the package was created.
  } finally {
    if (fs.existsSync(sedPath)) fs.unlinkSync(sedPath);
  }

  if (!fs.existsSync(targetExe)) {
    console.error("Build failed — no exe output.");
    process.exit(1);
  }

  const kb = (fs.statSync(targetExe).size / 1024).toFixed(1);
  console.log(`Built ${EXE_NAME} (${kb} KB)`);

  fs.mkdirSync(OUT, { recursive: true });
  fs.copyFileSync(targetExe, path.join(OUT, EXE_NAME));
  fs.copyFileSync(targetExe, path.join(OUT, "Discord-Remake-Portable.exe"));
  console.log(`Copied → httpdocs-ready/downloads/`);
}

main();
