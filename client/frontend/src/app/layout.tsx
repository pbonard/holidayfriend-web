import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import * as stylex from "@stylexjs/stylex";
import { colors, fonts } from "@/styles/tokens.stylex";
import Providers from "@/components/providers";
import "@/styles/globals.css";
import "@/styles/stylex.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Holiday Friend",
  description: "Holiday Friend",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body {...stylex.props(styles.body)}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

const styles = stylex.create({
  body: {
    minHeight: "100vh",
    backgroundColor: colors.background,
    color: colors.foreground,
    fontFamily: fonts.sans,
  },
});
