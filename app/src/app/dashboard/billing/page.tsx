'use client';

import Link from 'next/link';
import { ArrowLeft, Check, Zap } from 'lucide-react';
import { useState } from 'react';

export default function BillingPage() {
  const handleUpgrade = (plan: string) => {
    alert(`Redirecting to checkout for ${plan} plan...`);
  };

  const handleContactSales = () => {
    alert('Opening contact form to speak with sales team...');
  };

  const handleAddPayment = () => {
    alert('Opening payment method form...');
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Back Navigation */}
      <Link href="/dashboard" className="flex items-center gap-2 text-primary hover:text-primary-dark mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-medium">Home</span>
      </Link>

      <div className="mb-12">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Billing & Plans</h1>
        <p className="text-slate-600">Manage your subscription and payment methods</p>
      </div>

      {/* Current Plan Card */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-8 mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-slate-900">Current Plan</h2>
          <span className="px-4 py-1.5 bg-primary text-white text-xs font-semibold rounded-full">Free Trial</span>
        </div>
        <p className="text-slate-600 mb-6">You're currently on the free trial. <strong>14 days remaining.</strong></p>
        <button
          onClick={() => handleUpgrade('Professional')}
          className="px-6 py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition-colors"
        >
          Upgrade Now
        </button>
      </div>

      {/* Pricing Tiers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {/* Starter Plan */}
        <div className="bg-white border border-gray-200 rounded-xl p-8 flex flex-col">
          <h3 className="text-2xl font-bold text-slate-900 mb-2">Starter</h3>
          <div className="mb-1">
            <span className="text-4xl font-bold text-slate-900">£79</span>
            <span className="text-slate-600">/month</span>
          </div>
          <p className="text-slate-600 text-sm mb-8 pb-8 border-b border-gray-200">
            For individual therapists
          </p>

          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
              <span className="text-slate-700 text-sm">50 session analyses/month</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
              <span className="text-slate-700 text-sm">Similar case matching</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
              <span className="text-slate-700 text-sm">Clinical + patient reports</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
              <span className="text-slate-700 text-sm">Risk signal detection</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
              <span className="text-slate-700 text-sm">PHQ-9 & GAD-7 tracking</span>
            </li>
          </ul>

          <button
            onClick={() => handleUpgrade('Starter')}
            className="w-full px-6 py-3 bg-slate-100 text-slate-900 font-semibold rounded-lg hover:bg-slate-200 transition-colors"
          >
            Choose Starter
          </button>
        </div>

        {/* Professional Plan - Highlighted */}
        <div className="bg-white border-2 border-primary rounded-xl p-8 flex flex-col relative md:scale-105 md:z-10 shadow-sm">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-white text-xs font-bold rounded-full">
            RECOMMENDED
          </div>

          <h3 className="text-2xl font-bold text-slate-900 mb-2">Professional</h3>
          <div className="mb-1">
            <span className="text-4xl font-bold text-slate-900">£179</span>
            <span className="text-slate-600">/month</span>
          </div>
          <p className="text-slate-600 text-sm mb-8 pb-8 border-b border-gray-200">
            For serious practitioners
          </p>

          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-slate-700 text-sm">Unlimited session analyses</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-slate-700 text-sm">Everything in Starter</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-slate-700 text-sm">EHR integrations (SimplePractice, Theranest)</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-slate-700 text-sm">Longitudinal tracking dashboard</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-slate-700 text-sm">Learning mode with peer comparison</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-slate-700 text-sm">Custom coding frameworks</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-slate-700 text-sm">Priority support</span>
            </li>
          </ul>

          <button
            onClick={() => handleUpgrade('Professional')}
            className="w-full px-6 py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition-colors"
          >
            Choose Professional
          </button>
        </div>

        {/* Organization Plan */}
        <div className="bg-white border border-gray-200 rounded-xl p-8 flex flex-col">
          <h3 className="text-2xl font-bold text-slate-900 mb-2">Organization</h3>
          <div className="mb-1">
            <span className="text-4xl font-bold text-slate-900">£35</span>
            <span className="text-slate-600">/user/month</span>
          </div>
          <p className="text-slate-600 text-sm mb-8 pb-8 border-b border-gray-200">
            For teams & clinics
          </p>

          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
              <span className="text-slate-700 text-sm">Everything in Professional</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
              <span className="text-slate-700 text-sm">Bulk session processing</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
              <span className="text-slate-700 text-sm">Auto note generation (SOAP/DAP)</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
              <span className="text-slate-700 text-sm">Team management dashboard</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
              <span className="text-slate-700 text-sm">Admin analytics</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
              <span className="text-slate-700 text-sm">Dedicated support</span>
            </li>
          </ul>

          <button
            onClick={handleContactSales}
            className="w-full px-6 py-3 bg-slate-100 text-slate-900 font-semibold rounded-lg hover:bg-slate-200 transition-colors"
          >
            Contact Sales
          </button>
        </div>
      </div>

      {/* Billing History */}
      <div className="bg-white rounded-xl border border-gray-200 p-8 mb-6">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Billing History</h2>
        <div className="text-center py-12">
          <p className="text-slate-600">No billing history yet</p>
        </div>
      </div>

      {/* Payment Method */}
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Payment Method</h2>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex gap-2">
              <div className="w-12 h-8 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">
                Visa
              </div>
              <div className="w-12 h-8 bg-red-600 rounded flex items-center justify-center text-white text-xs font-bold">
                MC
              </div>
            </div>
            <span className="text-slate-600">Visa, Mastercard & American Express</span>
          </div>
          <button
            onClick={handleAddPayment}
            className="px-6 py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition-colors"
          >
            Add Payment Method
          </button>
        </div>
      </div>
    </div>
  );
}
