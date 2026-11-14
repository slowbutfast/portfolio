import { describe, expect, it } from 'vitest';
import { deriveSwellActive, deriveSwellRetrigger } from './audioSwell';

describe('deriveSwellActive', () => {
  const cases: Array<[boolean, boolean, boolean, boolean]> = [
    [false, false, false, false],
    [true, false, false, true],
    [false, true, false, true],
    [false, false, true, true],
    [true, true, false, true],
    [true, false, true, true],
    [false, true, true, true],
    [true, true, true, true],
  ];

  it.each(cases)(
    'hovered=%s selected=%s dragging=%s -> %s',
    (hovered, selected, dragging, expected) => {
      expect(deriveSwellActive(hovered, selected, dragging)).toBe(expected);
    },
  );

  it('keeps the swell active while an inspector stays open', () => {
    expect(deriveSwellActive(false, true, false)).toBe(true);
  });
});

describe('deriveSwellRetrigger', () => {
  const cases: Array<[boolean, boolean, boolean]> = [
    [false, false, false],
    [true, false, true],
    [true, true, false],
    [false, true, false],
  ];

  it.each(cases)(
    'selected=%s wasSelected=%s -> %s',
    (selected, wasSelected, expected) => {
      expect(deriveSwellRetrigger(selected, wasSelected)).toBe(expected);
    },
  );
});
