#!/usr/bin/env node
// Offline JSON-in / JSON-out bridge for a publisher using connected GitHub tools.
// This command never contacts GitHub, Netlify, or an AI provider.
import { emptyStatus, manualRequest, scheduledRequest, decideClaim, heartbeat, assertOwnership, finishJob, validateStatus } from "./publisher-control.mjs";

try {
  let input = "";
  for await (const chunk of process.stdin) {
    input += chunk;
    if (input.length > 1024 * 1024) throw Object.assign(new Error("Input exceeds one megabyte."), { code: "INPUT_TOO_LARGE" });
  }
  const command = JSON.parse(input);
  let result;
  switch (command.operation) {
    case "empty": result = emptyStatus(); break;
    case "manual-request": result = manualRequest(command.event, command.options); break;
    case "scheduled-request": result = scheduledRequest(command.now); break;
    case "claim": result = decideClaim(command.status, command.request, command.options); break;
    case "heartbeat": result = heartbeat(command.status, command.jobId, command.options); break;
    case "assert-owner": result = { owned: assertOwnership(command.status, command.jobId, command.now) }; break;
    case "finish": result = finishJob(command.status, command.jobId, command.options); break;
    case "validate": result = validateStatus(command.status); break;
    default: throw Object.assign(new Error("Unsupported operation."), { code: "INVALID_OPERATION" });
  }
  process.stdout.write(`${JSON.stringify({ ok: true, result })}\n`);
} catch (error) {
  process.stdout.write(`${JSON.stringify({ ok: false, error: { code: error.code || "INVALID_INPUT", message: error.code ? error.message : "Invalid input or operation." } })}\n`);
  process.exitCode = 1;
}
