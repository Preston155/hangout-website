export type TireSizeResult = {
  ok: boolean;
  value: string;
  width?: number;
  aspectRatio?: number;
  rim?: number;
  error?: string;
};

const TIRE_SIZE_RE = /^(\d{3})\s*\/?\s*(\d{2})\s*[Rr]?\s*(\d{2})$/;

export function normalizeTireSize(input: string): TireSizeResult {
  const compact = input.trim().replace(/\s+/g, '').toUpperCase();
  const match = compact.match(TIRE_SIZE_RE);
  if (!match) {
    return { ok: false, value: input, error: 'Use tire size format like 215/65R17' };
  }

  const width = Number(match[1]);
  const aspectRatio = Number(match[2]);
  const rim = Number(match[3]);

  if (width < 100 || width > 455) return { ok: false, value: input, error: 'Tire width is outside the supported range' };
  if (aspectRatio < 20 || aspectRatio > 95) return { ok: false, value: input, error: 'Aspect ratio is outside the supported range' };
  if (rim < 10 || rim > 30) return { ok: false, value: input, error: 'Rim size is outside the supported range' };

  return {
    ok: true,
    value: `${width}/${aspectRatio}R${rim}`,
    width,
    aspectRatio,
    rim,
  };
}
