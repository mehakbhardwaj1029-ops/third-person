export async function chunkDocument(
  fileBuffer: Buffer,
  filename: string,
  ctx: { log: any }
) {
  const { log } = ctx;

  log.info({ filename, size: fileBuffer.length }, "Chunking started");

  const formData = new FormData();

  const uint8Array = new Uint8Array(fileBuffer);

  const blob = new Blob([uint8Array], {
    type: "text/plain",
  });

  formData.append(
    "file",
    blob,
    filename
  );

  log.info("Sending request to chunking service");

  const response = await fetch(
    "https://document-chunker.onrender.com/chat/chunk/message/api",
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    log.error(
      { status: response.status },
      "Chunking service failed"
    );
    throw new Error("Chunking service failed");
  }

  log.info("Chunking response received");

  const result = await response.json();

  log.info(
    { chunkCount: result?.chunks?.length },
    "Chunking completed"
  );

  return result;
}