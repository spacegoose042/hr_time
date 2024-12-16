declare module 'csv-writer' {
  export interface CsvHeader {
    id: string;
    title: string;
  }

  export interface CsvStringifierOptions {
    header: CsvHeader[];
    fieldDelimiter?: string;
    recordDelimiter?: string;
    alwaysQuote?: boolean;
  }

  export interface ObjectCsvStringifier {
    getHeaderString(): string;
    stringifyRecords(records: any[]): string;
  }

  export function createObjectCsvStringifier(options: CsvStringifierOptions): ObjectCsvStringifier;
}
