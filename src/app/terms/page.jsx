import Link from 'next/link'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Link href="/" className="text-blue-600 hover:text-blue-700 font-semibold">
            ← Back to Home
          </Link>
          <h1 className="mt-4 text-4xl font-bold text-gray-900">Terms of Service</h1>
          <p className="mt-2 text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Agreement to Terms</h2>
            <p className="text-gray-700">
              By accessing and using AI Resume Builder, you agree to be bound by these Terms of Service and all
              applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from
              using this service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Description of Service</h2>
            <p className="text-gray-700 mb-4">
              AI Resume Builder provides an AI-powered platform to help users create professional resumes. Our service includes:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>AI-powered resume generation and optimization</li>
              <li>Resume storage and management</li>
              <li>PDF and DOCX export capabilities</li>
              <li>Subscription-based premium features</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">User Accounts</h2>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Account Creation</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
              <li>You must provide accurate and complete information</li>
              <li>You are responsible for maintaining account security</li>
              <li>You must be at least 16 years old to use this service</li>
              <li>One person or entity may not maintain multiple accounts</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-2">Account Termination</h3>
            <p className="text-gray-700">
              We reserve the right to suspend or terminate your account if you violate these terms or engage in
              fraudulent, abusive, or illegal activity.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Subscription and Billing</h2>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Free Plan</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
              <li>Limited to 2 resume generations per month</li>
              <li>Maximum 5 saved resumes</li>
              <li>PDF export only</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-2">Paid Plans</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
              <li>Subscriptions are billed monthly or annually</li>
              <li>All payments are processed securely through Stripe</li>
              <li>You can cancel your subscription at any time</li>
              <li>Refunds are provided on a case-by-case basis</li>
              <li>We may change pricing with 30 days notice</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-2">Cancellation</h3>
            <p className="text-gray-700">
              You may cancel your subscription at any time. Upon cancellation, you will retain access to paid features
              until the end of your current billing period. No refunds will be provided for partial months.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Acceptable Use</h2>
            <p className="text-gray-700 mb-4">You agree NOT to:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Use the service for any illegal purpose</li>
              <li>Include false or misleading information in resumes</li>
              <li>Attempt to circumvent usage limits or payment requirements</li>
              <li>Reverse engineer or copy our AI algorithms</li>
              <li>Share your account credentials with others</li>
              <li>Use automated tools to access the service (bots, scrapers)</li>
              <li>Upload malicious content or viruses</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Intellectual Property</h2>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Your Content</h3>
            <p className="text-gray-700 mb-4">
              You retain all rights to the content you create using our service. By using AI Resume Builder, you grant
              us a license to process and store your content solely for the purpose of providing our services.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-2">Our Content</h3>
            <p className="text-gray-700">
              The AI Resume Builder platform, including all software, designs, and algorithms, is owned by us and
              protected by copyright and other intellectual property laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">AI-Generated Content</h2>
            <p className="text-gray-700">
              Our service uses AI (OpenAI) to generate resume content. While we strive for accuracy, AI-generated
              content may contain errors or inaccuracies. You are responsible for reviewing and verifying all content
              before use. We are not liable for any consequences resulting from AI-generated content.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Disclaimers</h2>
            <p className="text-gray-700 mb-4">
              THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. We do not guarantee that:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>The service will be uninterrupted or error-free</li>
              <li>AI-generated content will result in job offers</li>
              <li>Your resumes will pass through applicant tracking systems</li>
              <li>Data will never be lost (though we take reasonable precautions)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Limitation of Liability</h2>
            <p className="text-gray-700">
              To the maximum extent permitted by law, AI Resume Builder shall not be liable for any indirect,
              incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether
              incurred directly or indirectly.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Changes to Terms</h2>
            <p className="text-gray-700">
              We reserve the right to modify these terms at any time. We will notify users of material changes via
              email or through the service. Continued use after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Information</h2>
            <p className="text-gray-700">
              For questions about these Terms of Service, please contact us at:{' '}
              <a href="mailto:legal@airesumebuild er.com" className="text-blue-600 hover:text-blue-700">
                legal@airesumebuild er.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
