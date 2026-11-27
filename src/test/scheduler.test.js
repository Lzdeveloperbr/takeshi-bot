/**
 * Testes: horário automático dos grupos, aniversários e boas-vindas com foto.
 */
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { after, before, describe, it } from "node:test";
import { daysUntil } from "../commands/member/aniversariantes.js";
import { getProfilePhotoUrl } from "../middlewares/onGroupParticipantsUpdate.js";
import { getGroupSchedules, setBirthday, setGroupSchedule } from "../utils/database.js";
import {
  birthdaysToday,
  isDue,
  nowInTimezone,
  runBirthdays,
  runGroupSchedules,
  toMinutes,
} from "../utils/scheduler.js";

const dbDir = path.resolve(import.meta.dirname, "..", "..", "database");
const files = ["group-schedule.json", "birthdays.json"];
const backups = {};

before(() => {
  for (const name of files) {
    const file = path.join(dbDir, name);
    backups[name] = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : undefined;
  }
});

after(() => {
  for (const name of files) {
    const file = path.join(dbDir, name);
    if (backups[name] === undefined) fs.rmSync(file, { force: true });
    else fs.writeFileSync(file, backups[name]);
  }
});

function fakeSocket() {
  const calls = [];
  return {
    calls,
    groupSettingUpdate: async (jid, setting) => calls.push(["setting", jid, setting]),
    sendMessage: async (jid, content) => calls.push(["message", jid, content]),
  };
}

describe("horários", () => {
  it("lê horários e janela de execução", () => {
    assert.strictEqual(toMinutes("22:00"), 1320);
    assert.strictEqual(toMinutes("8h"), 480);
    assert.strictEqual(toMinutes("24:00"), null);
    assert.strictEqual(isDue(1320, 1322), true);
    assert.strictEqual(isDue(1320, 1330), false);
    assert.strictEqual(isDue(1438, 2), true);
  });

  it("usa o horário de Brasília", () => {
    const now = nowInTimezone(new Date("2026-11-27T01:30:00Z"));
    assert.deepStrictEqual(now, { date: "2026-11-26", day: 26, month: 11, minutes: 22 * 60 + 30 });
  });

  it("fecha o grupo no horário e não repete", async () => {
    const group = "horario-teste@g.us";
    setGroupSchedule(group, { close: "22:00", open: "08:00" });
    const socket = fakeSocket();
    const now = { date: "2026-11-26", day: 26, month: 11, minutes: 22 * 60 + 1 };

    await runGroupSchedules(socket, now);
    await runGroupSchedules(socket, now);

    const settings = socket.calls.filter(([kind, jid]) => kind === "setting" && jid === group);
    assert.deepStrictEqual(settings, [["setting", group, "announcement"]]);
    assert.ok(getGroupSchedules()[group].lastClose > 0);

    setGroupSchedule(group, null);
  });
});

describe("aniversários", () => {
  it("acha os aniversariantes do dia", () => {
    const members = { "a@lid": { day: 25, month: 12 }, "b@lid": { day: 1, month: 1 } };
    assert.deepStrictEqual(birthdaysToday(members, { day: 25, month: 12 }), ["a@lid"]);
  });

  it("conta dias até o próximo aniversário (virando o ano)", () => {
    assert.strictEqual(daysUntil(25, 12, { day: 25, month: 12 }), 0);
    assert.strictEqual(daysUntil(1, 1, { day: 31, month: 12 }), 1);
  });

  it("parabeniza uma vez por dia, só depois das 9h", async () => {
    const group = "niver-teste@g.us";
    setBirthday(group, "a@lid", { day: 25, month: 12 });
    const socket = fakeSocket();

    await runBirthdays(socket, { date: "2026-12-25", day: 25, month: 12, minutes: 8 * 60 });
    assert.strictEqual(socket.calls.filter(([, jid]) => jid === group).length, 0);

    const at10 = { date: "2026-12-25", day: 25, month: 12, minutes: 10 * 60 };
    await runBirthdays(socket, at10);
    await runBirthdays(socket, at10);

    const messages = socket.calls.filter(([, jid]) => jid === group);
    assert.strictEqual(messages.length, 1);
    assert.deepStrictEqual(messages[0][2].mentions, ["a@lid"]);
  });
});

describe("boas-vindas com foto", () => {
  it("retorna a foto ou null quando é privada", async () => {
    assert.strictEqual(await getProfilePhotoUrl({ profilePictureUrl: async () => "https://foto" }, "x"), "https://foto");
    assert.strictEqual(
      await getProfilePhotoUrl({ profilePictureUrl: async () => { throw new Error("item-not-found"); } }, "x"),
      null,
    );
  });
});
