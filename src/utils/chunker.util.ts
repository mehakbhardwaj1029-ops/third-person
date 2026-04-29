import crypto from "crypto";

type ParsedMessage = {
  sender: string;
  message: string;
  timestamp: string;
};

export function buildChunksWithHash(messages: ParsedMessage[]) {
  const chunkSize = 50; // number of messages per chunk
  const overlap = 10;

  const chunks = [];

  for (let i = 0; i < messages.length; i += chunkSize - overlap) {
    const slice = messages.slice(i, i + chunkSize);

    const hash = crypto
      .createHash("sha256")
      .update(JSON.stringify(slice))
      .digest("hex");

    chunks.push({
      messages: slice,
      hash,
    });
  }

  return chunks;
}