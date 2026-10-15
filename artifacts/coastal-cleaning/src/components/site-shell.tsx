import { Link } from 'wouter';
import { ArrowUpRight, Waves } from 'lucide-react';

export function SiteHeader() {
  return (
    <>
      <div className="topline" data-testid="text-response-promise">
        A thoughtful clean for your coastal home · Replies within 24 business hours
      </div>
      <header className="nav-shell">
        <Link href="/" className="brand" data-testid="link-home">
          <span className="brand-mark"><Waves size={21} strokeWidth={1.5} /></span>
          <span className="brand-name">Coastal Cleaning<small>Services</small></span>
        </Link>
        <nav className="nav-links" aria-label="Main navigation">
          <a href="/#services" data-testid="link-services">Our services</a>
          <Link href="/checklist" data-testid="link-checklist">Free checklist</Link>
          <a href="/#how-it-works" data-testid="link-how-it-works">How it works</a>
          <a href="/#request-quote" className="nav-cta" data-testid="link-request-quote">Request a quote <ArrowUpRight size={15} /></a>
        </nav>
      </header>
    </>
  );
}

export function SiteFooter() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-top">
          <Link href="/" className="brand" data-testid="link-footer-home">
            <span className="brand-mark"><Waves size={21} strokeWidth={1.5} /></span>
            <span className="brand-name">Coastal Cleaning<small>Services</small></span>
          </Link>
          <p className="footer-note">Come home to a little more breathing room.</p>
          <Link href="/checklist" className="text-link" style={{ color: '#d7e4db' }} data-testid="link-footer-checklist">
            Get the free checklist <ArrowUpRight size={15} />
          </Link>
        </div>
        <div className="footer-bottom">
          <span>Coastal Cleaning Services</span>
          <span>Quote requests are not confirmed appointments.</span>
        </div>
      </div>
    </footer>
  );
}
