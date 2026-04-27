const fs = require("fs");

const file = process.argv[2];

if (!file) {
  console.error("Usage: node validator.js <file>");
  process.exit(1);
}

const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);

let buffer = "";
let start = 0;
let inEntry = false;
let errors = [];

const keyRegex = /^[a-zA-Z0-9_.-]+=.+/;

function isKey(line) {
  return /^[a-zA-Z0-9_.-]+=/.test(line);
}

lines.forEach((line, i) => {
  const t = line.trim();
  if (!t) return;

  if (!inEntry) {
    if (!isKey(t)) {
      errors.push(`Line ${i + 1}: invalid start -> ${line}`);
      return;
    }
    inEntry = true;
    start = i + 1;
  }

  if (inEntry && isKey(t) && !buffer.endsWith(";") && buffer.length > 0) {
    errors.push(`Lines ${start}-${i + 1}: missing ';' before new key`);
    buffer = "";
    inEntry = false;
  }

  buffer += line + "\n";

  if (t.endsWith(";")) {
    const entry = buffer.trim();

    const eqIndex = entry.indexOf("=");
    if (eqIndex === -1) {
      errors.push(`Lines ${start}-${i + 1}: missing '='`);
    }

    if (!entry.endsWith(";")) {
      errors.push(`Lines ${start}-${i + 1}: missing ';'`);
    }

    buffer = "";
    inEntry = false;
  }
});

if (buffer.trim()) {
  errors.push(`EOF: unclosed entry starting at line ${start}`);
}

if (errors.length) {
  console.log("Found issues:");
  errors.forEach(e => console.log(" - " + e));
  process.exit(1);
}

console.log("OK:", file);