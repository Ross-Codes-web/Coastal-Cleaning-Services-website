import { Link } from 'wouter';
import { ArrowLeft, ArrowRight, Printer, Waves } from 'lucide-react';
import { SiteFooter, SiteHeader } from '@/components/site-shell';

const groups = [
  { title: 'Entry & living spaces', items: ['Shake out entry mats and sweep tracked-in sand', 'Wipe door handles, switches, and high-touch spots', 'Dust shelves, lamps, frames, and reachable ledges', 'Vacuum rugs and upholstery; check beneath cushions', 'Sweep or vacuum floors, then damp mop as needed'] },
  { title: 'Kitchen', items: ['Wipe counters, backsplash, and cabinet pulls', 'Clean the sink and faucet; clear the drain area', 'Wipe appliance fronts and handles', 'Check the fridge for crumbs and expired items', 'Sweep beneath the table and around the island'] },
  { title: 'Bathrooms', items: ['Clean and polish sink, faucet, and mirror', 'Scrub shower walls, fixtures, and glass', 'Wipe high-touch surfaces and door handles', 'Refresh towels and empty the bin', 'Sweep and mop floors, especially behind the door'] },
  { title: 'Bedrooms & linens', items: ['Make beds and straighten bedside surfaces', 'Dust nightstands, lamps, and reachable trim', 'Change linens or set fresh towels aside', 'Vacuum rugs and the edges of the room', 'Open a window when the weather allows'] },
  { title: 'Coastal details', items: ['Rinse or wipe salt and sand from entry areas', 'Brush sand from porch or patio furniture', 'Check windowsills for salt spray and dust', 'Shake out beach bags, baskets, and soft throws', 'Give damp towels and swimsuits room to dry'] },
  { title: 'A seasonal reset', items: ['Clear one drawer or shelf that gathers clutter', 'Wash washable slipcovers or cushion covers', 'Dust fans, vents, and light fixtures within reach', 'Wipe window tracks and sliding-door thresholds', 'Make a short list of the spots needing extra care'] },
];

function Checklist() {
  return (
    <div className="checklist-page">
      <SiteHeader />
      <main>
        <section className="checklist-hero">
          <div className="checklist-hero-inner">
            <div>
              <Link href="/" className="text-link" data-testid="link-back-home"><ArrowLeft size={14} /> Back to Coastal Cleaning Services</Link>
              <div className="section-kicker" style={{ marginTop: 28 }}>Your printable guide</div>
              <h1>A calmer reset,<br />room by room.</h1>
              <p>Keep this practical coastal-home checklist close for everyday tidying or a deeper seasonal refresh. Choose the parts that fit your home and leave the rest for another day.</p>
              <button className="print-button" type="button" onClick={() => window.print()} data-testid="button-print-checklist">
                <Printer size={16} /> Print this checklist
              </button>
            </div>
            <div className="guide-cover" aria-label="Coastal home cleaning checklist cover">
              <div className="guide-content">
                <span className="guide-stamp">COASTAL CLEANING SERVICES · FIELD NOTES 01</span>
                <div><h3>The coastal-home cleaning checklist</h3><p>A thoughtful room-by-room reset for the home you love coming back to.</p></div>
                <div className="guide-lines"><div className="guide-line">ENTRY & LIVING SPACES</div><div className="guide-line">KITCHEN & BATH</div><div className="guide-line">SEASONAL DETAILS</div></div>
                <span className="guide-stamp">A FREE PRINTABLE GUIDE</span>
              </div>
            </div>
          </div>
        </section>
        <section className="print-sheet" aria-label="Printable coastal home cleaning checklist">
          <div className="print-head">
            <div><div className="section-kicker">Coastal Cleaning Services · Field notes 01</div><h2>The coastal-home reset</h2><p>A flexible cleaning checklist for the home you love coming back to.</p></div>
            <div style={{ textAlign: 'right', color: '#71817a', fontSize: 11 }}>DATE: __________________<br /><br />MY HOME: ______________</div>
          </div>
          <div className="check-columns">
            {groups.map((group) => (
              <div className="check-group" key={group.title} data-testid={`group-checklist-${group.title.toLowerCase().replaceAll(' ', '-')}`}>
                <h3>{group.title}</h3>
                {group.items.map((item) => <div className="check-row" key={item}><span className="check-box" aria-hidden="true" />{item}</div>)}
              </div>
            ))}
          </div>
          <div className="check-footer">A good home-care routine should work for you. Pick a few priorities, take a breath, and come back to the rest when you can.</div>
        </section>
        <div className="page-footer">
          <p>Want help with the bigger reset? <Link href="/#request-quote" className="text-link" data-testid="link-checklist-quote">Request a quote <ArrowRight size={13} /></Link></p>
          <p><Waves size={14} style={{ verticalAlign: 'middle', marginRight: 5 }} />Coastal Cleaning Services</p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

export default Checklist;
