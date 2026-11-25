/**
 * Testes de resiliência do database.js
 * (recuperação de JSON corrompido).
 */
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { after, before, describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { activateGroup, isActiveGroup } from "../utils/database.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const databasePath = path.resolve(__dirname, "..", "..", "database");
const filePath = path.resolve(databasePath, "inactive-groups.json");

function listBackups() {
  return fs
    .readdirSync(databasePath)
    .filter((file) => file.startsWith("inactive-groups.json.corrupted-"));
}

describe("Database recovery", () => {
  let originalContent;
  let backupsBefore;

  before(() => {
    originalContent = fs.existsSync(filePath)
      ? fs.readFileSync(filePath, "utf8")
      : undefined;
    backupsBefore = new Set(listBackups());
  });

  after(() => {
    for (const backup of listBackups()) {
      if (!backupsBefore.has(backup)) {
        fs.unlinkSync(path.resolve(databasePath, backup));
      }
    }

    if (originalContent !== undefined) {
      fs.writeFileSync(filePath, originalContent);
    } else if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  });

  it("recria o arquivo e faz backup quando o JSON está corrompido", () => {
    fs.writeFileSync(filePath, '["123@g.us",');

    assert.strictEqual(isActiveGroup("123@g.us"), true);
    assert.deepStrictEqual(JSON.parse(fs.readFileSync(filePath, "utf8")), []);
    assert.strictEqual(listBackups().length, backupsBefore.size + 1);
  });

  it("continua gravando normalmente após a recuperação", () => {
    activateGroup("123@g.us");
    assert.strictEqual(isActiveGroup("123@g.us"), true);
    assert.ok(!fs.readdirSync(databasePath).some((f) => f.endsWith(".tmp")));
  });
});
