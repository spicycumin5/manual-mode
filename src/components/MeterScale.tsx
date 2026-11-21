/** Viewfinder-style exposure meter from −3 to +3 stops. */
export function MeterScale({ value, warn }: { value: number; warn?: boolean }) {
  const clamped = Math.max(-3.2, Math.min(3.2, value));
  const pct = ((clamped + 3.2) / 6.4) * 100;
  const ticks = [];
  for (let i = -9; i <= 9; i++) {
    const v = i / 3;
    ticks.push(
      <span key={i} className={`tick ${i % 3 === 0 ? 'major' : ''}`} style={{ left: `${((v + 3.2) / 6.4) * 100}%` }} />,
    );
  }
  return (
    <span className="meter" aria-label={`Meter ${value.toFixed(1)} stops`}>
      <span>−</span>
      <span className="meter-scale">
        {ticks}
        <span className={`needle ${warn || Math.abs(value) > 3 ? 'off' : ''}`} style={{ left: `${pct}%` }} />
      </span>
      <span>+</span>
    </span>
  );
}
