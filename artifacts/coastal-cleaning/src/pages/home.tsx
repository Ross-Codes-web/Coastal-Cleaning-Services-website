import { useState, type FormEvent } from 'react';
import { useCreateLead } from '@workspace/api-client-react';
import { Link, useLocation } from 'wouter';
import {
  ArrowRight, ArrowUpRight, Check, Clock3, Home as HomeIcon,
  Leaf, ShieldCheck, Sparkles, Waves, Wind,
} from 'lucide-react';
import { SiteFooter, SiteHeader } from '@/components/site-shell';

type LeadFields = { fullName: string; email: string; phone: string; serviceAddress: string };

function validate(fields: LeadFields, checklist = false) {
  if (fields.fullName.trim().length < 2) return 'Please enter your full name.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())) return 'Enter a valid email address.';
  if (!checklist && fields.phone.replace(/\D/g, '').length < 7) return 'Enter a phone number we can reach you at.';
  if (!checklist && fields.serviceAddress.trim().length < 5) return 'Add the address you would like cleaned.';
  return '';
}

function Field({ label, name, value, onChange, placeholder, type = 'text', required = true, autoComplete }: {
  label: string; name: string; value: string; onChange: (value: string) => void;
  placeholder: string; type?: string; required?: boolean; autoComplete?: string;
}) {
  return (
    <div className="field">
      <label htmlFor={name}>{label}{required ? ' *' : ''}</label>
      <input id={name} name={name} type={type} value={value} placeholder={placeholder}
        autoComplete={autoComplete} required={required} onChange={(event) => onChange(event.target.value)}
        data-testid={`input-${name}`} />
    </div>
  );
}

function ChecklistSignup() {
  const [, setLocation] = useLocation();
  const createLead = useCreateLead();
  const [fields, setFields] = useState({ fullName: '', email: '' });
  const [error, setError] = useState('');
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const issue = validate({ ...fields, phone: '', serviceAddress: '' }, true);
    if (issue) { setError(issue); return; }
    setError('');
    createLead.mutate({ data: { leadType: 'checklist', fullName: fields.fullName.trim(), email: fields.email.trim() } }, {
      onSuccess: (lead) => {
        if (lead.checklistUrl) sessionStorage.setItem('coastalChecklistUrl', lead.checklistUrl);
        setLocation('/checklist');
      },
      onError: () => setError('We couldn’t send your guide just now. Please try again in a moment.'),
    });
  };
  return (
    <form className="lead-form" onSubmit={onSubmit} noValidate>
      <Field name="checklist-name" label="Your name" value={fields.fullName} placeholder="First and last name"
        autoComplete="name" onChange={(fullName) => setFields({ ...fields, fullName })} />
      <Field name="checklist-email" label="Email address" type="email" value={fields.email}
        placeholder="you@example.com" autoComplete="email" onChange={(email) => setFields({ ...fields, email })} />
      {error && <p className="form-error" role="alert" data-testid="status-checklist-error">{error}</p>}
      <button className="button-primary" type="submit" disabled={createLead.isPending} data-testid="button-get-checklist">
        {createLead.isPending ? 'Sending your guide…' : 'Send me the checklist'} <ArrowRight size={16} />
      </button>
      <span className="form-footnote">A useful guide for your home, sent straight to your inbox. No appointment required.</span>
    </form>
  );
}

function QuoteRequestForm() {
  const createLead = useCreateLead();
  const [fields, setFields] = useState<LeadFields>({ fullName: '', email: '', phone: '', serviceAddress: '' });
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const issue = validate(fields);
    if (issue) { setError(issue); return; }
    setError('');
    createLead.mutate({
      data: {
        leadType: 'quote',
        fullName: fields.fullName.trim(),
        email: fields.email.trim(),
        phone: fields.phone.trim(),
        serviceAddress: fields.serviceAddress.trim(),
      },
    }, {
      onSuccess: () => setSent(true),
      onError: () => setError('Your request didn’t go through. Please check your connection and try again.'),
    });
  };
  return (
    <div className="quote-form-card">
      {sent ? (
        <div className="form-success" role="status" data-testid="status-quote-success">
          <strong>Thank you — your request is on its way.</strong><br />
          This is a quote request, not a confirmed appointment. Our team will reply within 24 business hours.
          <button type="button" className="text-link" style={{ border: 0, background: 'transparent', padding: '13px 0 0', cursor: 'pointer' }}
            onClick={() => { setSent(false); setFields({ fullName: '', email: '', phone: '', serviceAddress: '' }); }}
            data-testid="button-send-another">Send another request <ArrowRight size={14} /></button>
        </div>
      ) : (
        <>
          <h3>Tell us what you need</h3>
          <p>Share a few details and we’ll be in touch with next steps.</p>
          <form className="lead-form" onSubmit={submit} noValidate>
            <Field name="quote-name" label="Full name" value={fields.fullName} placeholder="First and last name"
              autoComplete="name" onChange={(fullName) => setFields({ ...fields, fullName })} />
            <div className="form-row">
              <Field name="quote-phone" label="Phone number" type="tel" value={fields.phone} placeholder="(555) 555-0123"
                autoComplete="tel" onChange={(phone) => setFields({ ...fields, phone })} />
              <Field name="quote-email" label="Email address" type="email" value={fields.email} placeholder="you@example.com"
                autoComplete="email" onChange={(email) => setFields({ ...fields, email })} />
            </div>
            <Field name="quote-address" label="Service address" value={fields.serviceAddress}
              placeholder="Street, town, and ZIP code" autoComplete="street-address"
              onChange={(serviceAddress) => setFields({ ...fields, serviceAddress })} />
            {error && <p className="form-error" role="alert" data-testid="status-quote-error">{error}</p>}
            <button className="button-primary" type="submit" disabled={createLead.isPending} data-testid="button-submit-quote">
              {createLead.isPending ? 'Sending your request…' : 'Request my quote'} <ArrowRight size={16} />
            </button>
            <span className="form-footnote">A request is not a confirmed appointment. We’ll reply within 24 business hours.</span>
          </form>
        </>
      )}
    </div>
  );
}

function Home() {
  return (
    <div className="site-wrap">
      <SiteHeader />
      <main>
        <section className="hero">
          <div className="hero-image" role="img" aria-label="Sunlit, freshly cared-for coastal home" />
          <div className="hero-inner">
            <div className="hero-copy">
              <div className="eyebrow">A calmer kind of clean</div>
              <h1>Make room for <em>the good</em> stuff.</h1>
              <p>More sea air. Less to-do list. Thoughtful cleaning for coastal homes, with a simple way to get started.</p>
              <div className="hero-actions">
                <a className="button-primary" href="#request-quote" data-testid="button-hero-quote">Request a quote <ArrowUpRight size={16} /></a>
                <Link className="text-link" href="/checklist" data-testid="link-hero-checklist">Get the free home checklist <ArrowRight size={15} /></Link>
              </div>
              <div className="hero-note"><Clock3 size={15} /> We reply to quote requests within 24 business hours.</div>
            </div>
          </div>
        </section>
        <div className="trust-strip" aria-label="What to expect">
          <div className="trust-item"><Check size={16} /> Easy, no-pressure quote request</div>
          <div className="trust-item"><Clock3 size={16} /> Reply within 24 business hours</div>
          <div className="trust-item"><HomeIcon size={16} /> Made for coastal homes</div>
          <div className="trust-item"><Waves size={16} /> Your home, your pace</div>
        </div>

        <section className="section services" id="services">
          <div className="section-inner">
            <div className="services-head">
              <div><div className="section-kicker">Good care, right where you live</div><h2 className="section-title">A little help goes<br />a long way.</h2></div>
              <p className="section-intro">From the weekly reset to a fresh start before guests arrive, tell us what would make home feel easier. We’ll help you find the right next step.</p>
            </div>
            <div className="service-grid">
              <article className="service-card">
                <span className="service-number">01 / YOUR ROUTINE</span><Sparkles className="service-icon" size={25} strokeWidth={1.4} />
                <div><h3>Start with the everyday</h3><p>Tell us which rooms and routines would make the biggest difference at home.</p></div>
              </article>
              <article className="service-card">
                <span className="service-number">02 / A FRESH START</span><Wind className="service-icon" size={24} strokeWidth={1.4} />
                <div><h3>Focus on the details</h3><p>Point out the areas you would like the team to know about when they follow up.</p></div>
              </article>
              <article className="service-card">
                <span className="service-number">03 / COMPANY COMING</span><Leaf className="service-icon" size={24} strokeWidth={1.4} />
                <div><h3>Plan for what’s next</h3><p>Share what is coming up and what matters most in your home.</p></div>
              </article>
            </div>
          </div>
        </section>

        <section className="section" id="how-it-works">
          <div className="section-inner process">
            <div className="process-aside">
              <div className="section-kicker">Simple from the start</div>
              <h2>Good help shouldn’t take a lot of homework.</h2>
              <p>Start with a few details. We’ll take it from there, with clear expectations and a real reply from our team.</p>
              <a href="#request-quote" className="text-link" style={{ color: '#e7eee6', marginTop: 16 }} data-testid="link-process-quote">Start a quote request <ArrowRight size={15} /></a>
            </div>
            <div className="process-list">
              <div className="process-step"><span className="step-no">01</span><div><h3>Tell us a little about your home</h3><p>Send your name, contact details, and the service address using our short form.</p></div></div>
              <div className="process-step"><span className="step-no">02</span><div><h3>We’ll get back to you</h3><p>Our team replies within 24 business hours to talk through your request.</p></div></div>
              <div className="process-step"><span className="step-no">03</span><div><h3>Decide what works for you</h3><p>A quote request starts a conversation. It does not book or confirm an appointment.</p></div></div>
            </div>
          </div>
        </section>

        <section className="section checklist-band" id="free-checklist">
          <div className="section-inner checklist-layout">
            <div className="guide-cover" aria-label="Preview of the coastal home cleaning checklist">
              <div className="guide-content">
                <span className="guide-stamp">COASTAL CLEANING SERVICES · FIELD NOTES 01</span>
                <div><h3>The coastal-home cleaning checklist</h3><p>A thoughtful room-by-room reset for the home you love coming back to.</p></div>
                <div className="guide-lines"><div className="guide-line">ENTRY & LIVING SPACES</div><div className="guide-line">KITCHEN & BATH</div><div className="guide-line">SEASONAL DETAILS</div></div>
                <span className="guide-stamp">A FREE PRINTABLE GUIDE</span>
              </div>
            </div>
            <div className="guide-signup">
              <div className="section-kicker">A small gift for your home</div>
              <h2 className="section-title">The coastal-home reset, made simple.</h2>
              <p>Get a practical printable checklist for the spots coastal living keeps busy. A few thoughtful reminders, room by room.</p>
              <ChecklistSignup />
              <p style={{ fontSize: 11, marginTop: 16, marginBottom: 0 }}>Already have the guide? <Link href="/checklist" className="text-link" data-testid="link-open-checklist">Open the printable checklist <ArrowUpRight size={13} /></Link></p>
            </div>
          </div>
        </section>

        <section className="section story">
          <div className="section-inner story-layout">
            <div className="story-visual" role="img" aria-label="A welcoming coastal living room in soft morning light" />
            <div className="story-copy">
              <div className="section-kicker">The feeling we’re here for</div>
              <h2 className="section-title">Home should feel like exhaling.</h2>
              <blockquote>“The point isn’t a perfect house. It’s having a little more time to enjoy the one you have.”</blockquote>
              <p>Coastal living brings its own kind of everyday mess. Our goal is to make asking for help feel easy, and coming home feel even better.</p>
              <a className="text-link" href="#request-quote" data-testid="link-story-quote">Let’s talk about your home <ArrowRight size={15} /></a>
            </div>
          </div>
        </section>

        <section className="section quote-section" id="request-quote">
          <div className="section-inner quote-layout">
            <div className="quote-side">
              <div className="section-kicker">Your next easy step</div>
              <h2 className="section-title">Let’s make home feel lighter.</h2>
              <p>Tell us where to reach you and which home needs a hand. Our team will reply within 24 business hours.</p>
              <div className="quote-promise"><ShieldCheck size={19} /><span>Your request is just a conversation starter—not an appointment confirmation. There’s no pressure to book.</span></div>
            </div>
            <QuoteRequestForm />
          </div>
        </section>

        <section className="section">
          <div className="section-inner faq-grid">
            <div><div className="section-kicker">Before you reach out</div><h2 className="section-title">Good to know.</h2><p className="section-intro">A few quick answers, so you can send your request with confidence.</p></div>
            <div className="faq-list">
              <div className="faq-item"><h3>Does sending this form book a cleaning?</h3><p>No. It sends a quote request to the team. Your appointment is not confirmed by submitting the form.</p></div>
              <div className="faq-item"><h3>When will someone get back to me?</h3><p>The team replies within 24 business hours after receiving your request.</p></div>
              <div className="faq-item"><h3>What should I include?</h3><p>Your name, phone number, email address, and service address help the team follow up about the right home.</p></div>
              <div className="faq-item"><h3>Can I get the checklist without requesting a quote?</h3><p>Absolutely. The free printable coastal-home checklist has its own simple sign-up and doesn’t book a service.</p></div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

export default Home;
