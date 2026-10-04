/**
 * Minimal RFC 4180 CSV reader. Handles quoted fields, escaped quotes,
 * commas and newlines inside quotes, CRLF, a UTF-8 BOM and a trailing
 * newline. Returns every physical record with its 1-based line number so
 * the importer can report malformed rows instead of silently dropping them.
 */
export interface CsvRecord {
  /** 1-based line number where the record starts (header = 1). */
  line: number;
  fields: string[];
  raw: string;
}

export function parseCsv(text: string): CsvRecord[] {
  const src = text.replace(/^﻿/, "");
  const out: CsvRecord[] = [];
  let fields: string[] = [];
  let field = "";
  let inQuotes = false;
  let line = 1;
  let recordStartLine = 1;
  let recordStart = 0;

  const endRecord = (i: number) => {
    fields.push(field);
    const raw = src.slice(recordStart, i);
    // A completely empty line is not a record.
    if (!(fields.length === 1 && fields[0] === "" && raw.trim() === "")) {
      out.push({ line: recordStartLine, fields, raw });
    }
    fields = [];
    field = "";
  };

  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else {
        if (c === "\n") line++;
        field += c;
      }
      continue;
    }
    if (c === '"' && field === "") inQuotes = true;
    else if (c === ",") {
      fields.push(field);
      field = "";
    } else if (c === "\r") {
      // swallow; \n ends the record
    } else if (c === "\n") {
      endRecord(i);
      line++;
      recordStartLine = line;
      recordStart = i + 1;
    } else field += c;
  }
  if (field !== "" || fields.length > 0) endRecord(src.length);
  return out;
}
