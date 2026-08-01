/** White “L” on blue square — matches favicon.svg */
export default function LootzLogo({ className = 'w-10 h-10', rounded = 'rounded-xl' }) {
  return (
    <img
      src="/favicon.svg"
      alt=""
      className={`${className} ${rounded} shrink-0 select-none`}
      draggable={false}
      aria-hidden
    />
  );
}
