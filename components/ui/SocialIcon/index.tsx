import { AtSign, Facebook, Github, Globe, Instagram, Linkedin, Send, Youtube } from 'lucide-react';
import { type SocialLink } from '@/utils/socialLinks';

// lucide has no X or Bluesky marks.
const XMark = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const BlueskyMark = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
    <path d="M5.2 3.3C7.9 5.3 10.8 9.4 12 11.8c1.2-2.4 4.1-6.5 6.8-8.5 1.9-1.4 5.1-2.6 5.1 1 0 .7-.4 6-.7 6.8-.8 3-3.9 3.8-6.6 3.3 4.7.8 5.9 3.5 3.3 6.1-4.9 5-7-1.3-7.6-2.9l-.3-.7-.3.7c-.6 1.6-2.7 7.9-7.6 2.9-2.6-2.6-1.4-5.3 3.3-6.1-2.7.5-5.8-.3-6.6-3.3C.5 10.3.1 5 .1 4.3c0-3.6 3.2-2.4 5.1-1z" />
  </svg>
);

export default function SocialIcon({ platform, className }: { platform: SocialLink['platform']; className?: string }) {
  switch (platform) {
    case 'x':
      return <XMark className={className} />;
    case 'bluesky':
      return <BlueskyMark className={className} />;
    case 'github':
      return <Github className={className} />;
    case 'linkedin':
      return <Linkedin className={className} />;
    case 'youtube':
      return <Youtube className={className} />;
    case 'instagram':
      return <Instagram className={className} />;
    case 'facebook':
      return <Facebook className={className} />;
    case 'telegram':
      return <Send className={className} />;
    case 'website':
      return <Globe className={className} />;
    default:
      return <AtSign className={className} />;
  }
}
