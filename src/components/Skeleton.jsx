export function SkeletonLine({ width = '100%', height = 14, style = {} }) {
  return <div className="skeleton-line" style={{ width, height, ...style }} />;
}

export function SkeletonCircle({ size = 40 }) {
  return <div className="skeleton-circle" style={{ width: size, height: size }} />;
}

export function SkeletonRow({ withBar = true }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 0' }}>
      {withBar && <div className="skeleton-line" style={{ width: 3, height: 32, borderRadius: 2, flexShrink: 0 }} />}
      <div style={{ flex: 1 }}>
        <SkeletonLine width="55%" height={13} style={{ marginBottom: 8 }} />
        <SkeletonLine width="35%" height={11} />
      </div>
    </div>
  );
}

export function SkeletonPackageCard() {
  return (
    <div style={{ padding: '13px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        <SkeletonLine width="45%" height={13} />
        <SkeletonLine width={30} height={12} />
      </div>
      <SkeletonLine width="100%" height={6} style={{ borderRadius: 4 }} />
    </div>
  );
}
