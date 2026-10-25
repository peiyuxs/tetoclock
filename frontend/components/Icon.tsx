type IconName =
  | "arrow-right"
  | "arrow-up"
  | "arrow-up-right"
  | "check"
  | "chevron-down"
  | "info"
  | "music"
  | "sparkle";

type IconProps = {
  name: IconName;
  className?: string;
};

const iconPaths: Record<IconName, string> = {
  "arrow-right": "M5 12h14m-6-6 6 6-6 6",
  "arrow-up": "M12 19V5m-6 6 6-6 6 6",
  "arrow-up-right": "M7 17 17 7M7 7h10v10",
  check: "m5 12 4 4L19 6",
  "chevron-down": "m6 9 6 6 6-6",
  info: "M12 16v-4m0-4h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z",
  music: "M9 18V5l12-2v13M9 18a3 2 0 1 1-6 0 3 2 0 0 1 6 0Zm12-2a3 2 0 1 1-6 0 3 2 0 0 1 6 0Z",
  sparkle: "M12 2 14.4 9.6 22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4L12 2Z",
};

export default function Icon({ name, className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill={name === "sparkle" ? "currentColor" : "none"}
      focusable="false"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d={iconPaths[name]}
        stroke={name === "sparkle" ? "none" : "currentColor"}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}
