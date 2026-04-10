'use client';

import Link from 'next/link';
import { ArrowLeft, MessageSquare, BookOpen, ChevronDown } from 'lucide-react';
import { useState } from 'react';

export default function HelpPage() {
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(0);

  const faqs = [
    {
      question: 'How do I add a new session?',
      answer:
        'Navigate to the Dashboard and click the "New Session" button. Select an existing client or create a new one, then upload your session transcript or fill in the session notes manually. SessionLens will automatically analyze the content.',
    },
    {
      question: 'What is the learning mode and how does it help?',
      answer:
        'Learning Mode provides personalized insights on your clinical practice. It analyzes your sessions, identifies patterns, and compares your outcomes with anonymized peer data to help you continually improve your effectiveness.',
    },
    {
      question: 'Can I export my session data?',
      answer:
        'Yes. Go to Settings > Privacy & Security > "Export all my data". SessionLens will prepare a comprehensive export of all your session data in a standard format, and you\'ll receive it via email.',
    },
    {
      question: 'What EHR integrations are available?',
      answer:
        'The Professional and Organization plans include integrations with SimplePractice and Theranest. This allows you to sync client records and session notes directly from your existing EHR system.',
    },
    {
      question: 'How are my sessions encrypted and secured?',
      answer:
        'All sessions are encrypted with AES-256 at rest and TLS 1.3 in transit. Session data is stored securely and retained until you explicitly delete it. We comply with GDPR and HIPAA standards.',
    },
  ];

  const toggleFAQ = (index: number) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back Navigation */}
      <Link href="/dashboard" className="flex items-center gap-2 text-primary hover:text-primary-dark mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-medium">Home</span>
      </Link>

      <div className="mb-12">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Help & Support</h1>
        <p className="text-slate-600">Find answers to common questions and learn how to use SessionLens</p>
      </div>

      {/* Getting Started Card */}
      <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-8 mb-8">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Getting Started</h2>
            <p className="text-slate-700 mb-4">
              SessionLens helps you analyze your therapy sessions in minutes. Upload a session transcript, choose your analysis framework
              (SOAP, DAP), and get instant insights on clinical patterns, risk signals, and client outcomes. Use our Learning Mode to compare your
              practice with peers and identify growth areas. Start with the Dashboard and navigate to "New Session" to begin your first analysis.
            </p>
            <Link href="/dashboard/session/new" className="inline-flex items-center gap-2 text-primary hover:text-primary-dark font-semibold">
              Create your first session →
            </Link>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-8">
        <div className="px-8 py-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-slate-900">Frequently Asked Questions</h2>
        </div>

        <div className="divide-y divide-gray-200">
          {faqs.map((faq, index) => (
            <button
              key={index}
              onClick={() => toggleFAQ(index)}
              className="w-full px-8 py-6 text-left hover:bg-slate-50 transition-colors flex items-center justify-between group"
            >
              <h3 className="font-semibold text-slate-900 group-hover:text-primary transition-colors">{faq.question}</h3>
              <ChevronDown
                className={`w-5 h-5 text-slate-600 transition-transform flex-shrink-0 ${expandedFAQ === index ? 'rotate-180' : ''}`}
              />
            </button>
          ))}
        </div>

        {expandedFAQ !== null && (
          <div className="px-8 py-6 bg-slate-50 border-t border-gray-200">
            <p className="text-slate-700 leading-relaxed">{faqs[expandedFAQ].answer}</p>
          </div>
        )}
      </div>

      {/* Contact Support Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-8 mb-8">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <MessageSquare className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Contact Support</h2>
            <p className="text-slate-600 mb-4">
              Need help? Our support team is here to assist you with any questions about SessionLens.
            </p>
            <a
              href="mailto:support@sessionlens.app"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors"
            >
              Email Support
            </a>
          </div>
        </div>
      </div>

      {/* Documentation Link */}
      <div className="bg-slate-50 rounded-xl border border-gray-200 p-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Full Documentation</h3>
            <p className="text-slate-600">Explore detailed guides, API documentation, and best practices</p>
          </div>
          <Link
            href="#"
            onClick={(e) => {
              e.preventDefault();
              alert('Opening full documentation...');
            }}
            className="px-6 py-3 bg-white border border-gray-300 text-slate-900 font-semibold rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap"
          >
            View Docs
          </Link>
        </div>
      </div>
    </div>
  );
}
