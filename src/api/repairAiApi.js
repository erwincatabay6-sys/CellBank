import { apiRequest } from "./http.js";

const AI_SEND_TIMEOUT_MS = 180_000;

export function getRepairAiMessages(repairId, { signal } = {}) {
  return apiRequest(
    `/api/repairs/${encodeURIComponent(repairId)}/ai/messages`,
    { signal },
  );
}

export function getRepairAiContext(repairId, { signal } = {}) {
  return apiRequest(
    `/api/repairs/${encodeURIComponent(repairId)}/ai/context`,
    { signal },
  );
}

export function sendRepairAiMessage(
  repairId,
  { messageText, expectedUpdatedAt, attachments = [] },
  { signal } = {},
) {
  const formData = new FormData();

  const request = {
    messageText: messageText?.trim() || null,
    expectedUpdatedAt,
  };

  formData.append(
    "request",
    new Blob([JSON.stringify(request)], {
      type: "application/json",
    }),
    "request.json",
  );

  for (const file of attachments) {
    formData.append("attachments", file, file.name);
  }

  return apiRequest(
    `/api/repairs/${encodeURIComponent(repairId)}/ai/messages`,
    {
      method: "POST",
      body: formData,
      signal,
      timeoutMs: AI_SEND_TIMEOUT_MS,
    },
  );
}