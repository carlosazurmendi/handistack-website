import type { Metadata } from 'next'
import { LegalPage } from '@/components/site/LegalPage'

const UPDATED = 'June 5, 2026'
const CONTACT = 'hello@handistack.com'

export const metadata: Metadata = {
  title: 'Privacy Policy — Handistack',
  description: 'How Handistack collects, uses, and protects the information you provide.',
}

export default function PrivacyPolicyPage() {
  return (
    <LegalPage eyebrow="Legal" title="Privacy Policy" updated={UPDATED}>
      <p>
        This Privacy Policy explains how <strong>Handistack</strong> (&ldquo;Handistack,&rdquo;
        &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) collects, uses, and shares
        information when you visit <a href="https://trades.handistack.com">trades.handistack.com</a> (the
        &ldquo;Site&rdquo;) or request a consultation. By using the Site, you agree to this Policy.
      </p>

      <h2>Information we collect</h2>
      <h3>Information you provide</h3>
      <p>
        When you submit our booking or qualification form, we collect the details you enter — your
        name, email address, phone number (optional), company website or domain, a description of the
        operational bottleneck you want to solve, and your timeline. If you book a call, we also store
        the meeting details (date, time, and video-conference link).
      </p>
      <h3>Information collected automatically</h3>
      <p>
        Our hosting and content-delivery providers may log standard technical data such as your IP
        address, browser type, device information, and pages viewed, for security, abuse prevention,
        and performance. We use only the cookies necessary to operate the Site and its administrative
        area; we do not use third-party advertising cookies.
      </p>

      <h2>How we use your information</h2>
      <ul>
        <li>To respond to your inquiry and qualify whether we&rsquo;re a fit for your needs.</li>
        <li>To schedule, host, and follow up on consultation calls.</li>
        <li>To operate, secure, and improve the Site.</li>
        <li>To comply with legal obligations and enforce our terms.</li>
      </ul>
      <p>
        Part of our qualification step uses automated workflows to research the public information
        associated with the company domain you submit. This helps us prepare for your call. We do not
        use this to make legally significant automated decisions about you.
      </p>

      <h2>How we share your information</h2>
      <p>We do not sell your personal information. We share it only with service providers that help us run the Site and our booking process, including:</p>
      <ul>
        <li><strong>Supabase</strong> — database and file storage.</li>
        <li><strong>Google</strong> (Calendar, Meet, Gmail) — scheduling, video calls, and email.</li>
        <li><strong>n8n</strong> — our workflow-automation layer used for lead qualification.</li>
        <li><strong>Cloudflare</strong> — DNS, security, and content delivery.</li>
      </ul>
      <p>
        These providers process data on our behalf under their own terms and security controls. We may
        also disclose information if required by law or to protect our rights, users, or the public.
      </p>

      <h2>Data retention</h2>
      <p>
        We keep the information you submit for as long as needed to respond to your inquiry, provide
        services, and meet legal and record-keeping requirements. You can ask us to delete your
        information at any time (see below).
      </p>

      <h2>Your choices and rights</h2>
      <p>
        Depending on where you live, you may have the right to access, correct, delete, or restrict the
        use of your personal information, and to object to certain processing. To exercise any of these
        rights, email us at <a href={`mailto:${CONTACT}`}>{CONTACT}</a> and we&rsquo;ll respond within a
        reasonable timeframe.
      </p>

      <h2>Security</h2>
      <p>
        We use reasonable technical and organizational measures — including encrypted connections and
        access controls — to protect your information. No method of transmission or storage is
        completely secure, so we cannot guarantee absolute security.
      </p>

      <h2>Children&rsquo;s privacy</h2>
      <p>
        The Site is intended for businesses and is not directed to children under 16. We do not
        knowingly collect information from children. If you believe a child has provided us
        information, contact us and we will delete it.
      </p>

      <h2>International visitors</h2>
      <p>
        We are based in the United States and process data here. If you access the Site from outside
        the U.S., you understand your information will be transferred to and processed in the U.S.
      </p>

      <h2>Changes to this Policy</h2>
      <p>
        We may update this Policy from time to time. The &ldquo;Last updated&rdquo; date above reflects
        the latest revision. Material changes will be posted on this page.
      </p>

      <h2>Contact us</h2>
      <p>
        Questions about this Policy or your data? Email{' '}
        <a href={`mailto:${CONTACT}`}>{CONTACT}</a>. Handistack is based in Florida, United States.
      </p>
    </LegalPage>
  )
}
