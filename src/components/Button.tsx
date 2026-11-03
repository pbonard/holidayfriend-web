import * as stylex from "@stylexjs/stylex";
import type { StyleXStyles } from "@stylexjs/stylex";
import { auth } from "@/styles/tokens.stylex";

type ButtonProps = Omit<React.ComponentProps<"button">, "className" | "style"> & {
  variant?: "primary" | "secondary";
  // layout tweaks from the caller (margins and such), applied last
  xstyle?: StyleXStyles;
};

export default function Button({
  variant = "primary",
  type = "button",
  xstyle,
  ...props
}: ButtonProps) {
  return (
    <button type={type} {...props} {...stylex.props(styles.base, styles[variant], xstyle)} />
  );
}

const styles = stylex.create({
  base: {
    width: "100%",
    height: "52px",
    borderRadius: "10px",
    fontFamily: "inherit",
    fontSize: "16px",
    fontWeight: 700,
    color: auth.text,
    cursor: { default: "pointer", ":disabled": "not-allowed" },
    opacity: { default: 1, ":disabled": 0.6 },
    transition: "background-color 120ms ease, border-color 120ms ease",
    outline: {
      default: "none",
      ":focus-visible": `2px solid ${auth.link}`,
    },
    outlineOffset: "2px",
  },
  primary: {
    backgroundColor: { default: auth.accent, ":hover": auth.accentHover },
    borderWidth: 0,
  },
  secondary: {
    backgroundColor: auth.control,
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: { default: auth.border, ":hover": auth.muted },
  },
});
