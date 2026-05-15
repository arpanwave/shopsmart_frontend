import type { CSSProperties } from "react";

type Props = {
  name: string;
  className?: string;
  filled?: boolean;
  style?: CSSProperties;
};

/** Material Symbols Outlined icon. */
export function Icon({ name, className, filled, style }: Props) {
  return (
    <span
      className={`material-symbols-outlined select-none${filled ? " icon-filled" : ""}${
        className ? ` ${className}` : ""
      }`}
      aria-hidden
      style={style}
    >
      {name}
    </span>
  );
}
