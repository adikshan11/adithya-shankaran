import ThemeToggle from './ThemeToggle';

export default function Navigation() {
  return (
    <header className="site-header">
      <a className="wordmark" href="#top" aria-label="Adithya Shankaran, back to top">as.</a>
      <nav aria-label="Main navigation">
        <a href="#experience">Experience</a>
        <a href="#projects">Projects</a>
        <a href="#contact">Contact</a>
      </nav>
      <ThemeToggle />
    </header>
  );
}