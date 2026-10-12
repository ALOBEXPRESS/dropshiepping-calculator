import JSZip from 'jszip';

export interface ExtractedXmlFile {
  filename: string;
  content: string;
}

/**
 * Checks if a string contains valid NF-e XML content
 */
function isValidNFeXml(content: string): boolean {
  return (
    content.includes('<nfeProc') ||
    content.includes('<NFe') ||
    content.includes('<infNFe')
  );
}

/**
 * Extracts all NF-e XML files from a .zip file
 */
export async function extractXmlsFromZip(file: File | ArrayBuffer): Promise<ExtractedXmlFile[]> {
  const zip = await JSZip.loadAsync(file);
  const xmlFiles: ExtractedXmlFile[] = [];

  const entries: { name: string; async: (type: 'text') => Promise<string> }[] = [];
  zip.forEach((relativePath, zipEntry) => {
    if (
      !zipEntry.dir &&
      relativePath.toLowerCase().endsWith('.xml') &&
      !relativePath.includes('__MACOSX')
    ) {
      entries.push(zipEntry);
    }
  });

  for (const entry of entries) {
    const text = (await entry.async('text')).trim();
    if (isValidNFeXml(text)) {
      xmlFiles.push({ filename: entry.name, content: text });
    }
  }

  return xmlFiles;
}

/**
 * Extracts all NF-e XML files from a .rar file using node-unrar-js
 */
export async function extractXmlsFromRar(file: File | ArrayBuffer): Promise<ExtractedXmlFile[]> {
  const arrayBuffer = file instanceof File ? await file.arrayBuffer() : file;

  // Dynamically import node-unrar-js and its wasm binary to keep initial bundle light
  const [{ createExtractorFromData }, wasmUrlModule] = await Promise.all([
    import('node-unrar-js/esm'),
    import('node-unrar-js/esm/js/unrar.wasm?url'),
  ]);

  const wasmUrl: string =
    typeof wasmUrlModule === 'string'
      ? wasmUrlModule
      : (wasmUrlModule as { default: string }).default;
  const wasmResponse = await fetch(wasmUrl);
  const wasmBinary = await wasmResponse.arrayBuffer();

  const extractor = await createExtractorFromData({
    wasmBinary,
    data: arrayBuffer,
  });

  const extracted = extractor.extract();
  const xmlFiles: ExtractedXmlFile[] = [];

  for (const arcFile of extracted.files) {
    if (
      !arcFile.fileHeader.flags.directory &&
      arcFile.fileHeader.name.toLowerCase().endsWith('.xml') &&
      !arcFile.fileHeader.name.includes('__MACOSX') &&
      arcFile.extraction
    ) {
      const decoder = new TextDecoder('utf-8');
      const text = decoder.decode(arcFile.extraction).trim();
      if (isValidNFeXml(text)) {
        xmlFiles.push({ filename: arcFile.fileHeader.name, content: text });
      }
    }
  }

  return xmlFiles;
}

/**
 * Extracts XMLs from .xml, .zip, or .rar File
 */
export async function extractXmlsFromFile(file: File): Promise<ExtractedXmlFile[]> {
  const lowerName = file.name.toLowerCase();

  if (lowerName.endsWith('.xml')) {
    const text = (await file.text()).trim();
    if (!isValidNFeXml(text)) {
      throw new Error('Arquivo XML selecionado não parece ser uma NF-e válida.');
    }
    return [{ filename: file.name, content: text }];
  }

  if (lowerName.endsWith('.zip')) {
    const xmls = await extractXmlsFromZip(file);
    if (xmls.length === 0) {
      throw new Error('Nenhum arquivo XML de NF-e válido foi encontrado dentro do .zip.');
    }
    return xmls;
  }

  if (lowerName.endsWith('.rar')) {
    const xmls = await extractXmlsFromRar(file);
    if (xmls.length === 0) {
      throw new Error('Nenhum arquivo XML de NF-e válido foi encontrado dentro do .rar.');
    }
    return xmls;
  }

  throw new Error('Formato de arquivo não suportado. Por favor envie .xml, .zip ou .rar.');
}
