import crypto from "crypto";
type ParsedMessage = {
  sender: string;
  message: string;
  timestamp: string;
};

export function hashChunk(messages: ParsedMessage[]): string {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(messages))
    .digest("hex");
}

