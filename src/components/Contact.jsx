import { useState } from "react";

export function Contact() {
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <section id="contact" className="section" aria-labelledby="contact-title">
      <div className="container contact__layout">
        <header className="section-header section-header--compact">
          <p className="section-label">Contact</p>
          <h2 id="contact-title" className="section-title">
            Inquiry
          </h2>
          <p className="section-lead">
            For research dialogue and institutional correspondence.
          </p>
          <p className="contact-email">
            <a href="mailto:contact@bowersfrontierinstitute.com">
              contact@bowersfrontierinstitute.com
            </a>
          </p>
        </header>

        <div className="contact__form-wrap">
          {sent ? (
            <p className="contact-success" role="status">
              Your inquiry was captured locally only. No message was sent.
            </p>
          ) : (
            <form className="contact-form" onSubmit={handleSubmit} noValidate>
              <div>
                <label htmlFor="name">Name</label>
                <input id="name" name="name" type="text" autoComplete="name" required />
              </div>
              <div>
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                />
              </div>
              <div>
                <label htmlFor="message">Message</label>
                <textarea id="message" name="message" required />
              </div>
              <button type="submit" className="btn btn--primary">
                Prepare inquiry
              </button>
              <p className="contact-note">UI only — no backend connected.</p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
