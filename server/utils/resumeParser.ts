import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

export async function parseResume(input: Buffer | Uint8Array): Promise<string> {
  if (!input || input.length === 0) {
    throw new Error("Uploaded file is empty");
  }

  const uint8Array =
    input instanceof Buffer
      ? new Uint8Array(input.buffer, input.byteOffset, input.byteLength)
      : new Uint8Array(input);

  const headerStr = Buffer.from(uint8Array.slice(0, 5)).toString("utf-8");
  if (!headerStr.startsWith("%PDF")) {
    const textContent = Buffer.from(uint8Array).toString("utf-8").trim();
    if (textContent.length > 0) {
      return textContent;
    }
    throw new Error("Uploaded file is not a valid PDF document.");
  }

  try {
    const loadingTask = pdfjsLib.getDocument({
      data: uint8Array,
      useSystemFonts: true,
      disableFontFace: true,
    });

    const pdf = await loadingTask.promise;
    const pagesText: string[] = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageItems = textContent.items
        .map((item: unknown) => {
          if (item && typeof item === "object" && "str" in item) {
            return String((item as { str: string }).str);
          }
          return "";
        })
        .filter(Boolean);
      pagesText.push(pageItems.join(" "));
    }

    const fullText = pagesText.join("\n\n").trim();
    if (fullText.length > 0) {
      return fullText;
    }
  } catch (pdfErr) {
    const rawStr = Buffer.from(uint8Array).toString("latin1");
    const matches = rawStr.match(/\(([^()]+)\)\s*Tj/g);
    if (matches && matches.length > 0) {
      const extracted = matches
        .map((m) => m.replace(/^\(|\)\s*Tj$/g, ""))
        .join("\n")
        .trim();
      if (extracted.length > 0) return extracted;
    }
    throw new Error(
      `Failed to parse PDF content: ${
        pdfErr instanceof Error ? pdfErr.message : "Unknown PDF error"
      }`
    );
  }

  throw new Error("No readable text found in PDF. Make sure the PDF is not an unreadable image scan.");
}
