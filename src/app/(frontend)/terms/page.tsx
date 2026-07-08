import type { Metadata } from 'next'
import { LegalPage } from '@/components/site/LegalPage'

const UPDATED = 'June 5, 2026'
const CONTACT = 'hello@handistack.com'

export const metadata: Metadata = {
  title: 'Terms of Service — Handistack',
  description: 'The terms that govern your use of the Handistack website and services.',
}

export default function TermsOfServicePage() {
  return (
    <LegalPage eyebrow="Legal" title="Terms of Service" updated={UPDATED}>
      <p>
        These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of{' '}
        <a href="https://handistack.com">handistack.com</a> and any related services (collectively, the
        &ldquo;Services&rdquo;) provided by <strong>Handistack</strong> (&ldquo;Handistack,&rdquo;
        &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;). By using the Services, you agree to
        these Terms. If you do not agree, do not use the Services.
      </p>

      <h2>Who may use the Services</h2>
      <p>
        You must be at least 18 years old and able to form a binding contract. If you use the Services
        on behalf of a business, you represent that you are authorized to bind that business to these
        Terms.
      </p>

      <h2>The Services</h2>
      <p>
        The Site presents information about Handistack and lets you request a consultation and schedule
        a call. Submitting a form or booking a call is a request for services — it does not create a
        client engagement. Any engagement, deliverables, fees, and related terms will be set out in a
        separate written agreement.
      </p>

      <h2>Bookings and communications</h2>
      <p>
        When you book a call, you authorize us to contact you about it by email and to create a calendar
        invitation and video-conference link. Availability is not guaranteed, and we may reschedule or
        decline a booking. We provide no guarantee of specific results from any consultation.
      </p>

      <h2>Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use the Services in violation of any law or regulation.</li>
        <li>Submit false information or someone else&rsquo;s information without permission.</li>
        <li>Interfere with, disrupt, probe, or attempt to gain unauthorized access to the Services or their infrastructure.</li>
        <li>Use automated means to scrape, overload, or abuse the Site.</li>
        <li>Infringe our or any third party&rsquo;s intellectual property or other rights.</li>
      </ul>

      <h2>Intellectual property</h2>
      <p>
        The Site and its content — including text, graphics, logos, and the Handistack name and mark —
        are owned by Handistack or its licensors and are protected by intellectual-property laws. We
        grant you a limited, non-exclusive, non-transferable license to view the Site for its intended
        purpose. All rights not expressly granted are reserved.
      </p>

      <h2>Third-party links and services</h2>
      <p>
        The Services rely on and may link to third-party services (such as Google, Supabase, and
        Cloudflare). We are not responsible for third-party content, policies, or practices. Your use of
        those services is governed by their terms.
      </p>

      <h2>Disclaimer of warranties</h2>
      <p>
        The Services are provided &ldquo;as is&rdquo; and &ldquo;as available,&rdquo; without warranties
        of any kind, whether express or implied, including implied warranties of merchantability, fitness
        for a particular purpose, and non-infringement. We do not warrant that the Services will be
        uninterrupted, error-free, or secure.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the fullest extent permitted by law, Handistack and its owners, employees, and contractors
        will not be liable for any indirect, incidental, special, consequential, or punitive damages, or
        any loss of profits, data, or goodwill, arising from your use of the Services. Our total
        liability for any claim relating to the Services will not exceed one hundred U.S. dollars
        (USD&nbsp;$100).
      </p>

      <h2>Indemnification</h2>
      <p>
        You agree to indemnify and hold harmless Handistack from any claims, damages, or expenses arising
        out of your use of the Services or your violation of these Terms.
      </p>

      <h2>Governing law</h2>
      <p>
        These Terms are governed by the laws of the State of Florida, United States, without regard to
        its conflict-of-laws rules. You agree to the exclusive jurisdiction of the state and federal
        courts located in Florida for any dispute that is not subject to arbitration or small-claims
        resolution.
      </p>

      <h2>Changes to these Terms</h2>
      <p>
        We may update these Terms from time to time. The &ldquo;Last updated&rdquo; date above reflects
        the latest revision, and continued use of the Services after changes take effect constitutes
        acceptance.
      </p>

      <h2>Contact us</h2>
      <p>
        Questions about these Terms? Email <a href={`mailto:${CONTACT}`}>{CONTACT}</a>. Handistack is
        based in Florida, United States.
      </p>
    </LegalPage>
  )
}
