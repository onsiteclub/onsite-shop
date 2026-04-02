import { Navbar } from '@/components/shop/Navbar';
import { Footer } from '@/components/shop/Footer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of Service for OnSite Club Shop. Read our terms and conditions for using our website and purchasing products.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-[72px]">
        <div className="max-w-3xl mx-auto px-6 py-16">
          <span className="font-display text-[11px] font-bold tracking-[0.2em] uppercase text-warm-400 block mb-3">Legal</span>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-text-primary mb-4">
            Terms of Service
          </h1>
          <p className="font-body text-sm text-text-secondary mb-10">
            Last updated: April 2, 2026
          </p>

          <div className="prose-section">
            <p>
              These Terms of Service (&ldquo;Terms&rdquo;) govern your use of the OnSite Club online store at shop.onsiteclub.ca (the &ldquo;Website&rdquo;) operated by OnSite Club (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;). By accessing or using the Website, you agree to be bound by these Terms.
            </p>

            <h2>1. Eligibility</h2>
            <p>
              You must be at least 16 years of age and reside in Canada to make purchases on our Website. By placing an order, you represent that you meet these requirements.
            </p>

            <h2>2. Products &amp; Pricing</h2>
            <ul>
              <li>All prices are displayed in <strong>Canadian Dollars (CAD)</strong> and include applicable product costs.</li>
              <li>Prices are subject to change without notice.</li>
              <li>We make every effort to display product colors and images accurately, but we cannot guarantee that your screen&rsquo;s display will be exact.</li>
              <li>We reserve the right to limit quantities or refuse any order at our discretion.</li>
            </ul>

            <h2>3. Orders &amp; Payment</h2>
            <ul>
              <li>By placing an order, you make an offer to purchase. We may accept or decline this offer.</li>
              <li>Payment is processed securely through <strong>Stripe</strong>. We do not store your payment card details.</li>
              <li>Orders are confirmed upon successful payment. You will receive an email confirmation.</li>
              <li>Applicable taxes (HST/GST/PST) are calculated and applied at checkout based on your shipping province.</li>
            </ul>

            <h2>4. Shipping</h2>
            <p>
              We ship to all Canadian provinces and territories via Canada Post. Shipping costs and estimated delivery times are displayed at checkout. For full details, see our <a href="/shipping-returns">Shipping &amp; Returns</a> page.
            </p>

            <h2>5. Returns &amp; Refunds</h2>
            <p>
              Returns are accepted within 30 days of delivery for eligible items. For full return conditions and process, see our <a href="/shipping-returns">Shipping &amp; Returns</a> page.
            </p>

            <h2>6. Promotional Codes</h2>
            <ul>
              <li>Promotional codes are single-use unless otherwise stated.</li>
              <li>Codes cannot be combined with other offers.</li>
              <li>We reserve the right to revoke promotional codes at any time.</li>
              <li>Codes may have expiration dates and specific conditions attached.</li>
            </ul>

            <h2>7. Intellectual Property</h2>
            <p>
              All content on the Website — including designs, logos, text, images, and product graphics — is the property of OnSite Club and is protected by Canadian and international copyright and trademark laws. You may not reproduce, distribute, or use any content without our written permission.
            </p>

            <h2>8. User Accounts</h2>
            <p>
              If you create an account, you are responsible for maintaining the confidentiality of your login credentials. You agree to notify us immediately of any unauthorized use of your account.
            </p>

            <h2>9. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, OnSite Club shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Website or purchase of products. Our total liability shall not exceed the amount you paid for the specific product giving rise to the claim.
            </p>

            <h2>10. Disclaimer of Warranties</h2>
            <p>
              Products are provided &ldquo;as is.&rdquo; While we stand behind the quality of our products, we make no express or implied warranties beyond what is required by applicable Canadian consumer protection legislation, including the <strong>Ontario Consumer Protection Act, 2002</strong>.
            </p>

            <h2>11. Governing Law</h2>
            <p>
              These Terms are governed by and construed in accordance with the laws of the <strong>Province of Ontario</strong> and the federal laws of Canada applicable therein. Any disputes shall be resolved in the courts of Ontario, Canada.
            </p>

            <h2>12. Changes to These Terms</h2>
            <p>
              We may update these Terms from time to time. The updated version will be posted on this page with a revised date. Continued use of the Website after changes constitutes acceptance of the updated Terms.
            </p>

            <h2>13. Severability</h2>
            <p>
              If any provision of these Terms is found to be unenforceable, the remaining provisions shall remain in full force and effect.
            </p>

            <h2>14. Contact</h2>
            <p>
              For questions about these Terms, contact us at:
            </p>
            <p>
              <strong>OnSite Club</strong><br />
              Email: <a href="mailto:contact@onsiteclub.ca">contact@onsiteclub.ca</a><br />
              Ontario, Canada
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
