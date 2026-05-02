export async function chunkDocument(
  fileBuffer: Buffer,
  filename: string
) {

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

  const response = await fetch(
    "https://document-chunker.onrender.com/chat/chunk/api",
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error("Chunking service failed");
  }

  const result = await response.json();

  return result;
}