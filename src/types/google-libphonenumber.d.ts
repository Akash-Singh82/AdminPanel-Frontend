declare module 'google-libphonenumber' {
  export class PhoneNumberUtil {
    static getInstance(): PhoneNumberUtil;
    parse(number: string, region?: string): any;
    isValidNumber(num: any): boolean;
    format(num: any, format: any): string;
  }

  export enum PhoneNumberFormat {
    E164,
    INTERNATIONAL,
    NATIONAL,
    RFC3966,
  }
}
