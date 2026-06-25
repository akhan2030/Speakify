const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

function killPort(port) {
  try {
    if (process.platform === "win32") {
      const out = execSync(`netstat -ano | findstr :${port}`, {
        encoding: "utf8",
        stdio: ["pipe", "pipe", "ignore"],
      });
      const pids = new Set();
      for (const line of out.split("\n")) {
        const match = line.trim().match(/\s(\d+)\s*$/);
        if (match) pids.add(match[1]);
      }
      for (const pid of pids) {
        try {
          execSync(`taskkill /F /PID ${pid}`, { stdio: "ignore" });
          console.log(`Stopped process ${pid} on port ${port}`);
        } catch {
          /* ignore */
        }
      }
    }
  } catch {
    /* port not in use */
  }
}

for (const port of [3000, 3001]) killPort(port);

const dirs = [
  path.join(process.cwd(), ".next"),
  path.join(process.cwd(), "..", ".next-speakify"),
];

for (const dir of dirs) {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
    console.log("Removed:", dir);
  } catch (err) {
    console.warn("Skip:", dir, err.message);
  }
}
