export interface ParsedDescription {
  title: string;
  tag: string | null;
  raw: string;
}

function toTitleCase(s: string): string {
  return s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export function parseDescription(raw: string): ParsedDescription {
  const s = (raw ?? '').trim();
  if (!s) return { title: 'No description', tag: null, raw: s };

  let m: RegExpMatchArray | null;

  // UPI Credit:  UPI/CR/123456/MERCHANT NAME/BANK/vpa/ref
  m = s.match(/^UPI[/\-]CR[/\-]\d+[/\-]([^/\-]+)/i);
  if (m) return { title: toTitleCase(m[1].trim()), tag: 'UPI Credit', raw: s };

  // UPI Debit:  UPI/DR/123456/MERCHANT NAME/...
  m = s.match(/^UPI[/\-]DR[/\-]\d+[/\-]([^/\-]+)/i);
  if (m) return { title: toTitleCase(m[1].trim()), tag: 'UPI Debit', raw: s };

  // Generic UPI with ref number then name
  m = s.match(/^UPI[/\-](?:P2P|COLLECT|PAY|AUTO)?[/\-]?\d+[/\-]([A-Za-z][^/\-]{1,})/i);
  if (m) return { title: toTitleCase(m[1].trim()), tag: 'UPI', raw: s };

  // Simple UPI/Name (two segments)
  m = s.match(/^UPI[/\-]([A-Za-z].+)/i);
  if (m) return { title: toTitleCase(m[1].split(/[/\-]/)[0].trim()), tag: 'UPI', raw: s };

  // NEFT:  NEFT/AXISBANKREF/JOHN DOE/...
  m = s.match(/^NEFT[/\-][\w\d]+[/\-]([^/\-]+)/i);
  if (m) return { title: toTitleCase(m[1].trim()), tag: 'NEFT', raw: s };

  // IMPS:  IMPS/123456/NAME
  m = s.match(/^IMPS[/\-]\d+[/\-]([^/\-]+)/i);
  if (m) return { title: toTitleCase(m[1].trim()), tag: 'IMPS', raw: s };

  // RTGS
  m = s.match(/^RTGS[/\-][\w\d]+[/\-]([^/\-]+)/i);
  if (m) return { title: toTitleCase(m[1].trim()), tag: 'RTGS', raw: s };

  // ATM withdrawal
  if (/^(ATW|ATM)/i.test(s)) return { title: 'ATM Withdrawal', tag: 'ATM', raw: s };

  // Debit card POS:  PCD/123456/MERCHANT  or  POS/123456/MERCHANT
  m = s.match(/^(?:PCD|POS)[/\-][\w\d]+[/\-]([^/\-]+)/i);
  if (m) return { title: toTitleCase(m[1].trim()), tag: 'Debit Card', raw: s };

  // Card Debit Transaction:  CDT/123456/MERCHANT
  m = s.match(/^CDT[/\-][\w\d]+[/\-]([^/\-]+)/i);
  if (m) return { title: toTitleCase(m[1].trim()), tag: 'Debit Card', raw: s };

  // Credit card:  CCR/123456/MERCHANT  or  CC/123456/MERCHANT
  m = s.match(/^(?:CCR|CC)[/\-][\w\d]+[/\-]([^/\-]+)/i);
  if (m) return { title: toTitleCase(m[1].trim()), tag: 'Credit Card', raw: s };

  // Cheque:  CLG/123456/NAME  or  CHQ/123456/NAME
  m = s.match(/^(?:CLG|CHQ|CHEQUE)[/\-][\w\d]+[/\-]([^/\-]+)/i);
  if (m) return { title: toTitleCase(m[1].trim()), tag: 'Cheque', raw: s };

  // ECS / auto-debit:  ECS/123456/NAME
  m = s.match(/^ECS[/\-][\w\d]+[/\-]([^/\-]+)/i);
  if (m) return { title: toTitleCase(m[1].trim()), tag: 'Auto Debit', raw: s };

  // EMI:  EMI/123456/LENDER NAME
  m = s.match(/^EMI[/\-][\w\d]*[/\-]?([A-Za-z][^/\-]*)/i);
  if (m) return { title: toTitleCase(m[1].trim()), tag: 'EMI', raw: s };

  // Plain description — return as-is
  return { title: s, tag: null, raw: s };
}
