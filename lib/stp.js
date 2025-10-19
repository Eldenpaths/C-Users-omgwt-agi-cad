import { enqueueCommand, getAllCommands, clearCommands } from "./idb";

export async function createCommand(opType, payload) {
  const cmd = {
    commandId: crypto.randomUUID(),
    actorId: "local-user",
    baseVersion: 0,
    op: { type: opType, payload },
    ts: Date.now(),
    idempotencyKey: crypto.randomUUID(),
    processed: false
  };
  await enqueueCommand(cmd);
  return cmd;
}

export async function listQueuedCommands() {
  return await getAllCommands();
}

export async function flushQueuedCommands() {
  const queued = await getAllCommands();
  await clearCommands();
  return queued.map((c, i) => ({
    eventId: crypto.randomUUID(),
    commandId: c.commandId,
    prevVersion: i,
    nextVersion: i + 1,
    patch: { note: `Applied ${c.op.type}` },
    ts: Date.now()
  }));
}