type NimlothMarkProps = {
  className?: string;
};

export function NimlothMark({ className = "" }: NimlothMarkProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M24 8v25" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M24 12c-5.5 1.2-8.7 4-10.5 8.2 4.6.2 8.1-1.3 10.5-4.5M24 17.2c5.5 1.2 8.7 4 10.5 8.2-4.6.2-8.1-1.3-10.5-4.5M24 21.5c-4.5 1-7.2 3.4-8.7 6.9 3.8.2 6.7-1.1 8.7-3.7M24 25.4c4.5 1 7.2 3.4 8.7 6.9-3.8.2-6.7-1.1-8.7-3.7"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.35"
      />
      <path
        d="M9 37.5c4.5-2 9.5-2 15 0s10.5 2 15 0M11.5 41c3.8-1.5 7.9-1.5 12.5.1 4.6 1.6 8.7 1.6 12.5 0"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.25"
      />
      <circle cx="24" cy="6" r="1.35" fill="currentColor" />
    </svg>
  );
}
