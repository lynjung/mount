export function Logo({ dark = false }) {
  const fill = dark ? '#52B788' : '#1A3D30'
  return (
    <svg width="22" height="22" viewBox="0 0 26 26" fill="none">
      <polygon points="13,4 22,20 4,20"  fill={fill} opacity="0.15" />
      <polygon points="13,4 22,20 13,20" fill={fill} opacity="0.35" />
      <polygon points="7,13 16,20 4,20"  fill={fill} opacity="0.6"  />
      <polygon points="7,13 16,20 7,20"  fill={fill} />
    </svg>
  )
}
