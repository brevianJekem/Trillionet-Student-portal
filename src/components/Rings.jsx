export default function Rings({ outer, inner, centerValue, centerLabel }) {
  const ring = (radius, pct, color) => {
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - pct / 100);
    return (
      <>
        <circle cx="66" cy="66" r={radius} fill="none" stroke="var(--bg)" strokeWidth="10" />
        <circle
          cx="66" cy="66" r={radius} fill="none" stroke={color} strokeWidth="10"
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
        />
      </>
    );
  };

  return (
    <div style={{ position: 'relative', width: 132, height: 132, flexShrink: 0 }}>
      <svg width="132" height="132" viewBox="0 0 132 132" style={{ transform: 'rotate(-90deg)' }}>
        {ring(52, outer, 'var(--navy)')}
        {ring(36, inner, 'var(--blue)')}
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div className="heading" style={{ fontSize: 20, fontWeight: 600 }}>{centerValue}</div>
        <div style={{ fontSize: 9.5, color: 'var(--text-muted)', marginTop: 1 }}>{centerLabel}</div>
      </div>
    </div>
  );
}
