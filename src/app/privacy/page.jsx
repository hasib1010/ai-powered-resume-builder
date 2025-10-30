import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Link href="/" className="text-blue-600 hover:text-blue-700 font-semibold">
            ← Back to Home
          </Link>
          <h1 className="mt-4 text-4xl font-bold text-gray-900">Privacy Policy</h1>
          <p className="mt-2 text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Introduction</h2>
            <p className="text-gray-700">
              AI Resume Builder ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy
              explains how we collect, use, disclose, and safeguard your information when you use our resume building service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Information We Collect</h2>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Personal Information</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
              <li>Name and email address (when you create an account)</li>
              <li>Resume content and career information you provide</li>
              <li>Payment information (processed securely through Stripe)</li>
              <li>Profile information if you sign in with Google OAuth</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-2">Usage Information</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>How you interact with our service</li>
              <li>Number of resumes generated</li>
              <li>Feature usage patterns</li>
              <li>Device and browser information</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">How We Use Your Information</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>To provide and maintain our resume building service</li>
              <li>To process your payments and manage subscriptions</li>
              <li>To generate AI-powered resume content using OpenAI's services</li>
              <li>To send you important updates about your account</li>
              <li>To improve our service and develop new features</li>
              <li>To detect and prevent fraud or abuse</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Storage and Security</h2>
            <p className="text-gray-700 mb-4">
              We use industry-standard security measures to protect your data:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>All data is encrypted in transit using HTTPS/TLS</li>
              <li>Passwords are hashed using bcrypt</li>
              <li>Resume data is stored securely in MongoDB databases</li>
              <li>Payment information is handled exclusively by Stripe (PCI-compliant)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Third-Party Services</h2>
            <p className="text-gray-700 mb-4">We use the following third-party services:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li><strong>OpenAI:</strong> For AI-powered resume generation</li>
              <li><strong>Stripe:</strong> For payment processing</li>
              <li><strong>Google OAuth:</strong> For optional Google sign-in</li>
              <li><strong>MongoDB:</strong> For secure data storage</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Rights</h2>
            <p className="text-gray-700 mb-4">You have the right to:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Delete your account and associated data</li>
              <li>Export your resume data</li>
              <li>Opt out of marketing communications</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Retention</h2>
            <p className="text-gray-700">
              We retain your personal information for as long as your account is active or as needed to provide services.
              You can request account deletion at any time, and we will delete your data within 30 days, except where
              required by law to retain certain information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-gray-700">
              If you have questions about this Privacy Policy, please contact us at:{' '}
              <a href="mailto:privacy@airesumebuild er.com" className="text-blue-600 hover:text-blue-700">
                privacy@airesumebuild er.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
