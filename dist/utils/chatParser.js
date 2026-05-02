"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseChatFile = parseChatFile;
function parseChatFile(buffer) {
    const rawText = buffer.toString("utf-8");
    const lines = rawText.split("\n");
    const messages = [];
    const participantsSet = new Set();
    for (const line of lines) {
        // Basic WhatsApp regex
        const match = line.match(/^(.+?) - (.+?): (.+)$/);
        if (!match)
            continue;
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
