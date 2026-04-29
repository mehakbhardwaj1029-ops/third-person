type ParsedMessage = {
    sender : string,
    message: string,
    timestamp: string,
}

type ParsedResult = {
    rawText: string,
    parsedMessages: ParsedMessage[],
    participants: string[],
    messageCount: number,
}

export function parseChatFile(buffer: Buffer): ParsedResult {
    
  const rawText = buffer.toString("utf-8");

  const lines = rawText.split("\n");

  const messages: ParsedMessage[] = [];
  const participantsSet = new Set<string>();

  for (const line of lines) {
    // Basic WhatsApp regex
    const match = line.match(/^(.+?) - (.+?): (.+)$/);

    if (!match) continue;

    const [, timestamp, sender, message] = match;

    messages.push({
      sender: sender.trim(),
      message: message.trim(),
      timestamp: timestamp.trim(),
    });

    participantsSet.add(sender.trim());
  }

  return {
    rawText,
    parsedMessages: messages,
    participants: Array.from(participantsSet),
    messageCount: messages.length,
  };
}