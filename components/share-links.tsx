import { ShareActions } from "@/components/share-actions";
import { EmailIcon, FacebookIcon, LinkedInIcon, XIcon } from "@/components/share-icons";
import { articleUrl } from "@/lib/site";

type ShareLinksProps = {
  slug: string;
  title: string;
  summary: string;
  className?: string;
};

/**
 * Plain links to each network's own share page, so no third-party script or tracker loads on the
 * site. Each network builds its preview from the post's Open Graph tags and card image.
 */
export function ShareLinks({ slug, title, summary, className = "" }: ShareLinksProps) {
  const url = articleUrl(slug);
  const u = encodeURIComponent(url);
  const links = [
    { label: "LinkedIn", Icon: LinkedInIcon, href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}` },
    { label: "X", Icon: XIcon, href: `https://x.com/intent/post?url=${u}&text=${encodeURIComponent(title)}` },
    { label: "Facebook", Icon: FacebookIcon, href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    {
      label: "Email",
      Icon: EmailIcon,
      href: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${summary}\n\n${url}`)}`,
    },
  ];

  return (
    <nav className={`share-links ${className}`.trim()} aria-label="Share this post">
      <span className="share-links__label">Share</span>
      <ul>
        {links.map((link) => (
          <li key={link.label}>
            <a
              className="share-links__icon"
              href={link.href}
              aria-label={link.label === "Email" ? "Share by email" : `Share on ${link.label}`}
              title={link.label === "Email" ? "Email" : `Share on ${link.label}`}
              {...(link.label === "Email" ? {} : { target: "_blank", rel: "noopener noreferrer" })}
            >
              <link.Icon />
            </a>
          </li>
        ))}
        <ShareActions url={url} title={title} />
      </ul>
    </nav>
  );
}
