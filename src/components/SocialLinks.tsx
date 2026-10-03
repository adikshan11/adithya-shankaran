import { profile } from '../content';
import { GitHubIcon, LinkedInIcon, MailIcon, XIcon } from './Icons';

const icons = { mail: MailIcon, linkedin: LinkedInIcon, github: GitHubIcon, x: XIcon };

export default function SocialLinks() {
  return (
    <ul className="flex flex-wrap gap-2">
      {profile.socials.map((social) => {
        const Icon = icons[social.icon];
        const external = social.href.startsWith('http');
        return (
          <li key={social.label} className="group relative">
            <a
              href={social.href}
              aria-label={social.label}
              target={external ? '_blank' : undefined}
              rel={external ? 'noreferrer' : undefined}
              className="grid size-11 place-items-center rounded-full border border-line bg-card text-muted transition hover:border-accent hover:text-accent"
            >
              <Icon className="size-[18px]" />
            </a>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute top-full left-1/2 mt-2 -translate-x-1/2 translate-y-1 rounded-md bg-ink px-2 py-1 text-xs font-medium whitespace-nowrap text-paper opacity-0 transition group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:translate-y-0 group-hover:opacity-100"
            >
              {social.label}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
