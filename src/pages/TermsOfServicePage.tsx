import SiteHeader from "@/components/SiteHeader";
import NavBar from "@/components/NavBar";
import SiteFooter from "@/components/SiteFooter";

const TermsOfServicePage = () => (
  <div className="min-h-screen bg-background">
    <SiteHeader />
    <NavBar />
    <main className="max-w-3xl mx-auto px-6 py-12 font-body">
      <h1 className="text-3xl font-heading font-bold text-foreground mb-6">Terms of Service</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: February 19, 2026</p>
      <div className="prose prose-lg text-muted-foreground space-y-6">
        <section>
          <h2 className="text-xl font-heading font-semibold text-foreground mb-2">1. Acceptance of Terms</h2>
          <p>By accessing and using the Dominica News website (dominicanews.dm), you agree to be bound by these Terms of Service. If you do not agree, please do not use our website.</p>
        </section>

        <section>
          <h2 className="text-xl font-heading font-semibold text-foreground mb-2">2. Use of Content</h2>
          <p>All content published on Dominica News, including articles, images, videos, and graphics, is the property of Dominica News or its content suppliers and is protected by copyright laws. You may not reproduce, distribute, or republish any content without prior written permission.</p>
        </section>

        <section>
          <h2 className="text-xl font-heading font-semibold text-foreground mb-2">3. User Conduct</h2>
          <p>When using our website, you agree not to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Post or transmit any defamatory, abusive, or unlawful content.</li>
            <li>Attempt to gain unauthorised access to our systems.</li>
            <li>Use automated tools to scrape or download content without permission.</li>
            <li>Engage in any activity that disrupts the functioning of the website.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-heading font-semibold text-foreground mb-2">4. Newsletter &amp; Communications</h2>
          <p>By subscribing to our newsletter, you consent to receiving periodic email updates. You may unsubscribe at any time using the link provided in each email.</p>
        </section>

        <section>
          <h2 className="text-xl font-heading font-semibold text-foreground mb-2">5. Disclaimer</h2>
          <p>Dominica News strives for accuracy in all reporting. However, we do not warrant that all information is complete, accurate, or current. News content is provided "as is" without any guarantees.</p>
        </section>

        <section>
          <h2 className="text-xl font-heading font-semibold text-foreground mb-2">6. Limitation of Liability</h2>
          <p>Dominica News shall not be liable for any direct, indirect, incidental, or consequential damages resulting from the use or inability to use our website or reliance on any information provided.</p>
        </section>

        <section>
          <h2 className="text-xl font-heading font-semibold text-foreground mb-2">7. External Links</h2>
          <p>Our website may link to third-party websites. These links are provided for convenience only, and we do not endorse or assume responsibility for the content of external sites.</p>
        </section>

        <section>
          <h2 className="text-xl font-heading font-semibold text-foreground mb-2">8. Modifications</h2>
          <p>We reserve the right to modify these Terms of Service at any time. Continued use of the website after changes constitutes acceptance of the revised terms.</p>
        </section>

        <section>
          <h2 className="text-xl font-heading font-semibold text-foreground mb-2">9. Governing Law</h2>
          <p>These terms are governed by the laws of the Commonwealth of Dominica. Any disputes shall be resolved in the courts of Dominica.</p>
        </section>

        <section>
          <h2 className="text-xl font-heading font-semibold text-foreground mb-2">10. Contact</h2>
          <p>For questions about these Terms of Service, contact us at <strong>info@dominicanews.dm</strong>.</p>
        </section>
      </div>
    </main>
    <SiteFooter />
  </div>
);

export default TermsOfServicePage;
