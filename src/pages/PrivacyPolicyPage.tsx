import SiteHeader from "@/components/SiteHeader";
import NavBar from "@/components/NavBar";
import SiteFooter from "@/components/SiteFooter";

const PrivacyPolicyPage = () => (
  <div className="min-h-screen bg-background">
    <SiteHeader />
    <NavBar />
    <main className="max-w-3xl mx-auto px-6 py-12 font-body animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
      <h1 className="text-3xl font-heading font-bold text-foreground mb-6">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: February 19, 2026</p>
      <div className="prose prose-lg text-muted-foreground space-y-6">
        <section>
          <h2 className="text-xl font-heading font-semibold text-foreground mb-2">1. Information We Collect</h2>
          <p>We may collect the following types of information when you visit our website:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Personal Information:</strong> Name and email address when you subscribe to our newsletter.</li>
            <li><strong>Usage Data:</strong> Pages viewed, time spent on our site, browser type, and device information collected through cookies and analytics tools.</li>
            <li><strong>Cookies:</strong> Small data files stored on your device to improve your browsing experience.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-heading font-semibold text-foreground mb-2">2. How We Use Your Information</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>To deliver news content and personalise your experience.</li>
            <li>To send newsletter updates if you have opted in.</li>
            <li>To analyse website traffic and improve our services.</li>
            <li>To comply with legal obligations.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-heading font-semibold text-foreground mb-2">3. Sharing of Information</h2>
          <p>We do not sell or rent your personal information to third parties. We may share data with trusted service providers who assist in operating our website, provided they agree to keep your information confidential.</p>
        </section>

        <section>
          <h2 className="text-xl font-heading font-semibold text-foreground mb-2">4. Data Security</h2>
          <p>We implement reasonable security measures to protect your information. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.</p>
        </section>

        <section>
          <h2 className="text-xl font-heading font-semibold text-foreground mb-2">5. Third-Party Links</h2>
          <p>Our website may contain links to external sites. We are not responsible for the privacy practices of those websites and encourage you to review their policies.</p>
        </section>

        <section>
          <h2 className="text-xl font-heading font-semibold text-foreground mb-2">6. Your Rights</h2>
          <p>You may request access to, correction of, or deletion of your personal data at any time by contacting us at <strong>info@dominicanews.dm</strong>.</p>
        </section>

        <section>
          <h2 className="text-xl font-heading font-semibold text-foreground mb-2">7. Changes to This Policy</h2>
          <p>We may update this Privacy Policy from time to time. Any changes will be posted on this page with the updated date.</p>
        </section>

        <section>
          <h2 className="text-xl font-heading font-semibold text-foreground mb-2">8. Contact Us</h2>
          <p>If you have any questions about this Privacy Policy, please contact us at <strong>info@dominicanews.dm</strong>.</p>
        </section>
      </div>
    </main>
    <SiteFooter />
  </div>
);

export default PrivacyPolicyPage;
