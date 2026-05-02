type ParsedMessage = {
   sender: string;
   message: string;
   timestamp: string;
};

export function parseChunkContent(
   content: string
): ParsedMessage[] {

   const lines = content.split("\n");

   const messages: ParsedMessage[] = [];

   for (const line of lines) {

      const match = line.match(
         /^(.+?) - (.+?): (.+)$/
      );

      if (!match) continue;

      const [, timestamp, sender, message] = match;

      messages.push({
         timestamp: timestamp.trim(),
         sender: sender.trim(),
         message: message.trim(),
      });
   }

   return messages;
}