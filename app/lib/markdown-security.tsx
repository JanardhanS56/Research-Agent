import type { Components } from "react-markdown";

/**
 * Hardened ReactMarkdown component mappings.
 * Neutralizes markdown-based SSRF/exfiltration vectors by disabling
 * automatic external image fetching and enforcing secure link attributes.
 */
export const safeMarkdownComponents: Components = {
  // Disable automatic external image fetching to prevent tracking pixels and data exfiltration
  img: ({ alt }) => (
    <span className="text-zinc-500 text-xs italic font-mono px-2 py-0.5 rounded bg-[#161820] border border-[#252835] inline-block my-1">
      [External Image: {alt || "image reference"}]
    </span>
  ),
  // Enforce strict noopener, noreferrer, and nofollow on all markdown hyperlinks
  a: ({ href, children, ...props }) => (
    <a
      {...props}
      href={href}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2 break-all"
    >
      {children}
    </a>
  ),
};
