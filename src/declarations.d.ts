declare module 'xlsx' {
  export interface WorkSheet {}
  export interface WorkBook {
    SheetNames: string[];
    Sheets: { [sheet: string]: WorkSheet };
  }

  export namespace utils {
    export function sheet_to_json<T>(worksheet: WorkSheet, opts?: any): T[];
  }

  export function read(data: any, opts?: any): WorkBook;
}

declare module '*.json' {
  const value: any;
  export default value;
}