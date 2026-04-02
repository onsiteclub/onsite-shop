import { Navbar } from '@/components/shop/Navbar';
import { Footer } from '@/components/shop/Footer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for OnSite Club Shop. How we collect, use, and protect your personal information under PIPEDA.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-[72px]">
        <div className="max-w-3xl mx-auto px-6 py-16">
          <span className="font-display text-[11px] font-bold tracking-[0.2em] uppercase text-warm-400 block mb-3">Legal</span>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-text-primary mb-4">
            Privacy Policy
          </h1>
          <p className="font-body text-sm text-text-secondary mb-10">
            Last updated: April 2, 2026
          </p>

          <div className="prose-section">
            <p>
              OnSite Club (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) operates the online store at shop.onsiteclub.ca. This Privacy Policy explains how we collect, use, disclose, and protect your personal information in accordance with Canada&rsquo;s <strong>Personal Information Protection and Electronic Documents Act (PIPEDA)</strong> and applicable provincial privacy legislation.
            </p>

            <h2>1. Information We Collect</h2>
            <h3>Information You Provide</h3>
            <ul>
              <li><strong>Order information:</strong> Name, email address, shipping address, phone number (if provided)</li>
              <li><strong>Payment information:</strong> Processed securely by Stripe — we do not store credit card numbers</li>
              <li><strong>Account information:</strong> Email and password if you create an account</li>
              <li><strong>Communications:</strong> Emails or messages you send to us</li>
              <li><strong>Survey responses:</strong> Anonymous feedback submitted through our pre-checkout survey</li>
            </ul>

            <h3>Information Collected Automatically</h3>
            <ul>
              <li><strong>Device information:</strong> Browser type, operating system, screen resolution</li>
              <li><strong>Usage data:</strong> Pages visited, time spent, referring URL</li>
              <li><strong>Cookies:</strong> Essential cookies for cart functionality and session management</li>
            </ul>

            <h2>2. How We Use Your Information</h2>
            <ul>
              <li>Processing and fulfilling your orders</li>
              <li>Sending order confirmations and shipping updates</li>
              <li>Responding to your questions and support requests</li>
              <li>Sending promotional emails (only with your consent)</li>
              <li>Improving our products and website experience</li>
              <li>Complying with legal obligations</li>
            </ul>

            <h2>3. How We Share Your Information</h2>
            <p>We do not sell your personal information. We share information only with:</p>
            <ul>
              <li><strong>Stripe:</strong> Payment processing</li>
              <li><strong>Canada Post:</strong> Shipping and label generation</li>
              <li><strong>Supabase:</strong> Secure data storage and authentication</li>
              <li><strong>Resend:</strong> Transactional email delivery</li>
            </ul>
            <p>
              All third-party service providers are contractually obligated to protect your information and use it only for the purposes we specify.
            </p>

            <h2>4. Cookies</h2>
            <p>
              We use essential cookies to maintain your shopping cart and session. We do not use advertising or tracking cookies. Your cart data is stored locally in your browser using localStorage.
            </p>

            <h2>5. Data Retention</h2>
            <p>
              We retain order information for <strong>7 years</strong> to comply with Canadian tax regulations. Account information is retained until you request deletion. Anonymous survey responses are retained indefinitely for product improvement.
            </p>

            <h2>6. Your Rights Under PIPEDA</h2>
            <p>You have the right to:</p>
            <ul>
              <li><strong>Access</strong> your personal information we hold</li>
              <li><strong>Correct</strong> inaccurate personal information</li>
              <li><strong>Withdraw consent</strong> for marketing communications at any time</li>
              <li><strong>Request deletion</strong> of your personal information (subject to legal retention requirements)</li>
              <li><strong>File a complaint</strong> with the Office of the Privacy Commissioner of Canada</li>
            </ul>

            <h2>7. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your personal information, including encryption in transit (TLS/SSL), secure authentication, and access controls. However, no method of transmission over the Internet is 100% secure.
            </p>

            <h2>8. Children&rsquo;s Privacy</h2>
            <p>
              Our website is not directed to individuals under the age of 16. We do not knowingly collect personal information from children.
            </p>

            <h2>9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will post the updated version on this page with a revised &ldquo;Last updated&rdquo; date. Continued use of our website after changes constitutes acceptance of the updated policy.
            </p>

            <h2>10. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy or wish to exercise your privacy rights, contact us at:
            </p>
            <p>
              <strong>OnSite Club</strong><br />
              Email: <a href="mailto:contact@onsiteclub.ca">contact@onsiteclub.ca</a><br />
              Ontario, Canada
            </p>
            <p>
              You may also contact the <a href="https://www.priv.gc.ca/" target="_blank" rel="noopener noreferrer">Office of the Privacy Commissioner of Canada</a> if you have concerns about our privacy practices.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
