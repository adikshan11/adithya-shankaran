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
          <li key={social.label}>
            <a
              href={social.href}
              aria-label={social.label}
              title={social.label}
              target={external ? '_blank' : undefined}
              rel={external ? 'noreferrer' : undefined}
              className="grid size-11 place-items-center rounded-full border border-line bg-card text-muted transition hover:border-accent hover:text-accent"
            >
              <Icon className="size-[18px]" />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
