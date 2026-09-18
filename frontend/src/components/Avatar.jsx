/**
 * Reusable avatar. Shows the uploaded image if avatarUrl is present,
 * otherwise renders initials on a solid background.
 */
export default function Avatar({ src, name = '', size = 40, className = '', rounded = 'rounded-full' }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const dimension = { width: size, height: size };
  const fontSize = Math.max(12, Math.round(size * 0.4));

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        style={dimension}
        className={`${rounded} object-cover bg-grey-1 ${className}`}
      />
    );
  }

  return (
    <div
      style={{ ...dimension, fontSize }}
      className={`${rounded} bg-brand-primary text-white font-semibold flex items-center justify-center shrink-0 ${className}`}
    >
      {initials || '?'}
    </div>
  );
}
