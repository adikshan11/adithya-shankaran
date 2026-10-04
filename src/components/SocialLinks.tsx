import { profile } from '../content';
import { CodeChefIcon, GitHubIcon, LeetCodeIcon, LinkedInIcon, MailIcon, XIcon } from './Icons';

export const icons = { mail: MailIcon, linkedin: LinkedInIcon, github: GitHubIcon, x: XIcon, leetcode: LeetCodeIcon, codechef: CodeChefIcon };

export default function SocialLinks() {
  return (
    <ul className="flex flex-wrap gap-2">
      {[...profile.socials, ...profile.coding].map((social) => {
        const Icon = icons[social.icon];
        const external = social.href.startsWith('http');
        return (
          <li key={social.label} className="group relative">
            <a
              href={social.href}
              aria-label={social.label}
              target={external ? '_blank' : undefined}
              rel={external ? 'noreferrer' : undefined}
              className="glass grid size-11 place-items-center rounded-full text-muted transition hover:-translate-y-0.5 hover:text-accent"
            >
              <Icon className="size-[18px]" />
            </a>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute top-full left-1/2 z-10 mt-1 -translate-x-1/2 -translate-y-1 rounded bg-ink px-1.5 py-0.5 text-[11px] font-medium whitespace-nowrap text-paper opacity-0 transition group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:translate-y-0 group-hover:opacity-100"
            >
              {social.label}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
