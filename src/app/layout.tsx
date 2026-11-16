import type { Metadata, Viewport } from "next";
import { Geist_Mono, Google_Sans } from "next/font/google";
import * as stylex from "@stylexjs/stylex";
import {
  auth,
  breakpoints,
  fillHeightMarker,
  fonts,
  rootMarker,
  surfaceMarker,
} from "@/styles/tokens.stylex";
import Providers from "@/components/Providers";
import { SIDEBAR_SCRIPT } from "@/utils/sidebar";
import "@/styles/globals.css";
import "@/styles/stylex.css";

// the font of google's sign in button, so the page's text matches it
const googleSans = Google_Sans({
  variable: "--font-google-sans",
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

// the browser's own bars (android chrome, older safari) in the page's color. auth.page, written out: metadata can't
// read a stylex variable
export const viewport: Viewport = {
  themeColor: "#1f1e1c",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const html = stylex.props(rootMarker, styles.html);
  return (
    // the script below may add data-sidebar before react hydrates, which isn't a mismatch to warn about
    <html
      lang="en"
      {...html}
      className={`${googleSans.variable} ${geistMono.variable} ${html.className ?? ""}`}
      suppressHydrationWarning
    >
      <head>
        {/* before the first paint, so a collapsed sidebar doesn't show open on a reload */}
        <script dangerouslySetInnerHTML={{ __html: SIDEBAR_SCRIPT }} />
      </head>
      <body {...stylex.props(styles.body)}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

const styles = stylex.create({
  // what safari shows past the page's top and bottom when it bounces or pulls to refresh, and behind its floating
  // bars: <html>'s own color, so it's the pages' and not black or grey. the login pages' lighter one while they're
  // open. color-scheme tells safari the page is dark, for its own fallbacks and controls
  // a phone's page bounces past its top and bottom (rubber banding), as phones' pages do, and pulls to refresh. a
  // desktop's doesn't: it stretched the whole page, the sticky sidebar with it, so the sidebar looked like it scrolled
  html: {
    colorScheme: "dark",
    overscrollBehaviorY: { default: "auto", [breakpoints.desktop]: "none" },
    backgroundColor: {
      default: auth.page,
      [stylex.when.descendant('[data-page-background="surface"]', surfaceMarker)]:
        auth.surface,
    },
    // the chats screen (ChatFrame): a page that doesn't scroll, only its lists inside it do, as telegram web's. so
    // there's no page to drag away from the input, and with a phone's keyboard open ios only slides the view up to
    // show the input, and back down as it closes
    position: {
      default: "static",
      [stylex.when.descendant("[data-fill-height]", fillHeightMarker)]: "fixed",
    },
    inset: {
      default: null,
      [stylex.when.descendant("[data-fill-height]", fillHeightMarker)]: 0,
    },
    overflow: {
      default: null,
      [stylex.when.descendant("[data-fill-height]", fillHeightMarker)]:
        "hidden",
    },
  },
  // every page is dark. 100dvh, not 100vh: on ios safari 100vh is the window with its bars hidden, so a body that tall
  // let the chats screen (Tab, 100dvh) scroll up by the difference, a gap under its input
  body: {
    minHeight: "100dvh",
    backgroundColor: auth.page,
    color: auth.text,
    fontFamily: fonts.sans,
  },
});
