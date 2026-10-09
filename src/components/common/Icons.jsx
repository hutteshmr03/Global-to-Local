// Clean Goan Botanical & Coastal Motifs
export function GoaPalmBranchIcon({ className = 'h-[18px] w-[18px]' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
    >
      <path d="M4 20C9 17 15 13 20 4" />
      <path d="M20 4C18 7 15 9 12 10" />
      <path d="M20 4C19 8 18 11 15 13" />
      <path d="M16 7C13 9 10 10 7 10" />
      <path d="M14 10C11 13 8 15 5 16" />
      <path d="M17 9C17 13 15 16 12 18" />
    </svg>
  );
}

// Backward compatibility alias for section eyebrows
export function ShellCockleIcon(props) {
  return <GoaPalmBranchIcon {...props} />;
}

export function PalmLeafIcon({ className = 'h-auto w-full' }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
    >
      <path d="M6 42C14 38 24 30 36 10" />
      <path d="M36 10C33 16 28 20 22 22" />
      <path d="M36 10C38 18 36 24 30 28" />
      <path d="M30 14C24 18 18 20 14 20" />
      <path d="M26 18C20 24 16 28 12 30" />
      <path d="M22 22C16 30 12 34 8 36" />
      <path d="M32 18C34 26 32 32 26 36" />
      <path d="M28 24C28 32 24 38 18 42" />
    </svg>
  );
}

export function CoastalWaveIcon({ className = 'h-auto w-full' }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
    >
      <path d="M4 18C10 12 16 12 22 18C28 24 34 24 40 18C42 16 43 15 44 14" />
      <path d="M4 26C10 20 16 20 22 26C28 32 34 32 40 26C42 24 43 23 44 22" />
      <path d="M4 34C10 28 16 28 22 34C28 40 34 40 40 34C42 32 43 31 44 30" />
    </svg>
  );
}

export function TropicalSunIcon({ className = 'h-auto w-full' }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
    >
      <circle cx="24" cy="24" r="8" />
      <path d="M24 6V11M24 37V42M6 24H11M37 24H42M11.27 11.27L14.8 14.8M33.2 33.2L36.73 36.73M11.27 36.73L14.8 33.2M33.2 14.8L36.73 11.27" />
    </svg>
  );
}

export function GoaCashewIcon({ className = 'h-auto w-full' }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
    >
      <path d="M24 8C18 8 13 14 13 22C13 31 18 36 24 36C30 36 35 31 35 22C35 14 30 8 24 8Z" />
      <path d="M24 36C22 38 18 41 20 44C23 47 28 46 30 42C31 39 28 37 24 36Z" />
      <path d="M24 4V8" />
    </svg>
  );
}

export function ShellConchIcon(props) {
  return <PalmLeafIcon {...props} />;
}

export function ShellCowrieIcon(props) {
  return <CoastalWaveIcon {...props} />;
}

export function ShellFanIcon(props) {
  return <TropicalSunIcon {...props} />;
}

export function ScallopTrimPattern({ id = 'gtl-scallop-md', height = 26, width = 38, inverted = false }) {
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-x-0 z-20 ${inverted ? 'top-0 -scale-y-100' : 'bottom-0'} text-ground`}>
      <svg width="100%" height={height} className="block">
        <defs>
          <pattern id={id} width={width} height={height} patternUnits="userSpaceOnUse">
            <path d={`M0 ${height / 2}A${width / 2} ${height / 2 - 2} 0 0 1 ${width} ${height / 2}V${height}H0Z`} fill="currentColor" />
          </pattern>
        </defs>
        <rect width="100%" height={height} fill={`url(#${id})`} />
      </svg>
    </div>
  );
}
