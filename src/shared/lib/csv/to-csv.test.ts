import { describe, expect, it } from 'vitest';

import { toCsv } from './to-csv';

describe('toCsv', () => {
  it('starts with a BOM and ends lines with CRLF', () => {
    const csv = toCsv(['a', 'b'], [[1, 2]]);
    expect(csv.startsWith('﻿')).toBe(true);
    expect(csv.slice(1)).toBe('a,b\r\n1,2\r\n');
  });

  it('quotes commas, quotes and line breaks', () => {
    expect(toCsv(['x'], [['Côte, "d"'], ['a\nb']]).slice(1)).toBe(
      'x\r\n"Côte, ""d"""\r\n"a\nb"\r\n',
    );
  });

  it('a text that a spreadsheet would run as a formula is kept as text', () => {
    for (const text of ['=SUM(A1)', '+1', '-1', '@x']) {
      expect(toCsv(['x'], [[text]]).slice(1)).toBe(`x\r\n'${text}\r\n`);
    }
  });

  it('numbers stay plain (no locale), missing values are empty', () => {
    expect(toCsv(['n', 'm'], [[-1234.5, null]]).slice(1)).toBe('n,m\r\n-1234.5,\r\n');
  });
});
