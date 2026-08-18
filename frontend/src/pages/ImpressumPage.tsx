import { PublicLayout } from "../components/layout/PublicLayout";

export function ImpressumPage() {
  return <PublicLayout><main className="impressumPage">
    <h1>Impressum</h1>
    <section>
      <h2>Legal Notice (Imprint according to § 5 TMG)</h2>
      <p><strong>Smoke420</strong><br />Owner: Ronald Sokoli<br />Business Address:</p>
      <address>Heinrich-Nordhoff-Straße 59<br />38440 Wolfsburg<br />Germany</address>
    </section>
    <section>
      <h2>Contact</h2>
      <p>Phone: <a href="tel:+4917676715679">+49 176 76715679</a><br />Email: <a href="mailto:info.smoke420@google.com">info.smoke420@google.com</a></p>
    </section>
    <section>
      <h2>VAT Information</h2>
      <p>VAT Identification Number: <em>not applicable</em></p>
      <p>Small business according to § 19 UStG – no VAT charged.</p>
    </section>
  </main></PublicLayout>;
}
