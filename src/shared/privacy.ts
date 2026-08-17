const EMAIL = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const PHONE = /(?:\+?\d[\d .()-]{7,}\d)/;
const ACCOUNT_ID =
  /\b(?:aws[- ]?account|account[- ]?(?:id|number)|mrn|nhs|ssn)\s*[:#-]?\s*[A-Z0-9-]{4,}\b/i;
const LONG_IDENTIFIER = /\b\d{9,16}\b/;
const PROHIBITED_CONTEXT =
  /\b(?:real patient|patient name|date of birth|medical record|employee id|actual incident|real hospital)\b/i;

export function containsLikelyPersonalData(value: string): boolean {
  return [EMAIL, PHONE, ACCOUNT_ID, LONG_IDENTIFIER, PROHIBITED_CONTEXT].some(
    (pattern) => pattern.test(value),
  );
}
