'use client';

import Link from 'next/link';
import { ArrowLeft, Key, Shield, Sparkles, Upload, FileText } from 'lucide-react';
import { useState, useRef } from 'react';

export default function SettingsPage() {
  const [name, setName] = useState('Dr. Demo');
  const [email, setEmail] = useState('demo@sessionlens.app');
  const [specialization, setSpecialization] = useState('CBT');
  const [noteFormat, setNoteFormat] = useState('SOAP');
  const [enablePHQ9, setEnablePHQ9] = useState(true);
  const [enableGAD7, setEnableGAD7] = useState(true);
  const [enableLearningMode, setEnableLearningMode] = useState(true);
  const [showPeerComparison, setShowPeerComparison] = useState(true);
  const [openAPIKey, setOpenAPIKey] = useState('');
  const [supabaseURL, setSupabaseURL] = useState('');
  const [expandedAPI, setExpandedAPI] = useState(false);

  // Doctor-tone mimicry stub state
  const [toneSampleCount, setToneSampleCount] = useState(0);
  const [useToneForEmails, setUseToneForEmails] = useState(false);
  const [uploadingSample, setUploadingSample] = useState(false);
  const [toneError, setToneError] = useState<string | null>(null);
  const toneFileInputRef = useRef<HTMLInputElement | null>(null);

  const handleToneFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingSample(true);
    setToneError(null);
    try {
      let added = 0;
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/settings/tone-samples', {
          method: 'POST',
          body: formData,
        });
        if (res.ok) added += 1;
      }
      setToneSampleCount((c) => Math.min(3, c + added));
    } catch {
      setToneError('Upload failed. Please try again.');
    } finally {
      setUploadingSample(false);
      if (toneFileInputRef.current) toneFileInputRef.current.value = '';
    }
  };

  const handleSaveProfile = () => {
    alert('Settings saved');
  };

  const handleSaveAPIKeys = () => {
    alert('API Keys saved');
  };

  const handleExportData = () => {
    alert('Data export initiated. You will receive an email with your data shortly.');
  };

  const handleDeleteAccount = () => {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      alert('Account deletion request submitted. We will process this within 24 hours.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back Navigation */}
      <Link href="/dashboard" className="flex items-center gap-2 text-primary hover:text-primary-dark mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-medium">Home</span>
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Settings</h1>
        <p className="text-slate-600">Manage your profile, integrations, and preferences</p>
      </div>

      {/* Profile Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-8 mb-6">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Profile</h2>

        <div className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center">
              <span className="text-2xl font-bold text-slate-400">D</span>
            </div>
            <button className="px-4 py-2 bg-slate-100 text-slate-900 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium">
              Change Avatar
            </button>
          </div>

          {/* Name Field */}
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          {/* Specialization */}
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">Specialization</label>
            <select
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            >
              <option>CBT</option>
              <option>Psychodynamic</option>
              <option>Integrative</option>
              <option>Trauma-Focused</option>
              <option>Person-Centered</option>
              <option>Acceptance & Commitment Therapy</option>
              <option>Dialectical Behavior Therapy</option>
            </select>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSaveProfile}
            className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>

      {/* Integrations Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-8 mb-6">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Integrations</h2>

        <div className="space-y-4">
          {/* Google Calendar */}
          <div className="border border-gray-200 rounded-lg p-6 flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900 mb-1">Google Calendar</h3>
              <p className="text-slate-600 text-sm mb-3">Sync your appointments to see upcoming sessions</p>
              <div className="bg-slate-50 rounded p-3 text-xs text-slate-600 border border-slate-200">
                💡 Add your client code (e.g CL-0042) to calendar event titles for automatic matching.
              </div>
            </div>
            <button className="ml-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm font-medium whitespace-nowrap">
              Connect
            </button>
          </div>

          {/* SimplePractice */}
          <div className="border border-gray-200 rounded-lg p-6 flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900 mb-1">SimplePractice</h3>
              <p className="text-slate-600 text-sm">Import/export session notes</p>
            </div>
            <div className="ml-4 px-3 py-1 bg-slate-200 text-slate-700 text-xs font-semibold rounded whitespace-nowrap">
              Coming Soon
            </div>
          </div>

          {/* Theranest */}
          <div className="border border-gray-200 rounded-lg p-6 flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900 mb-1">Theranest</h3>
              <p className="text-slate-600 text-sm">Sync client records</p>
            </div>
            <div className="ml-4 px-3 py-1 bg-slate-200 text-slate-700 text-xs font-semibold rounded whitespace-nowrap">
              Coming Soon
            </div>
          </div>
        </div>
      </div>

      {/* Analysis Preferences Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-8 mb-6">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Analysis Preferences</h2>

        <div className="space-y-6">
          {/* Default Note Format */}
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-3">Default Note Format</label>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="SOAP"
                  checked={noteFormat === 'SOAP'}
                  onChange={(e) => setNoteFormat(e.target.value)}
                  className="w-4 h-4 accent-primary"
                />
                <span className="text-slate-900">SOAP (Subjective, Objective, Assessment, Plan)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="DAP"
                  checked={noteFormat === 'DAP'}
                  onChange={(e) => setNoteFormat(e.target.value)}
                  className="w-4 h-4 accent-primary"
                />
                <span className="text-slate-900">DAP (Data, Assessment, Plan)</span>
              </label>
            </div>
          </div>

          {/* Default Outcome Measure */}
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-3">Default Outcome Measures</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enablePHQ9}
                  onChange={(e) => setEnablePHQ9(e.target.checked)}
                  className="w-4 h-4 accent-primary"
                />
                <span className="text-slate-900">PHQ-9 (Depression)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableGAD7}
                  onChange={(e) => setEnableGAD7(e.target.checked)}
                  className="w-4 h-4 accent-primary"
                />
                <span className="text-slate-900">GAD-7 (Anxiety)</span>
              </label>
            </div>
          </div>

          {/* Learning Mode */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div>
              <h3 className="font-medium text-slate-900">Enable Learning Mode feedback</h3>
              <p className="text-sm text-slate-600">Get personalized insights on your clinical practice</p>
            </div>
            <input
              type="checkbox"
              checked={enableLearningMode}
              onChange={(e) => setEnableLearningMode(e.target.checked)}
              className="w-5 h-5 accent-primary"
            />
          </div>

          {/* Peer Comparison */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div>
              <h3 className="font-medium text-slate-900">Show peer comparison data</h3>
              <p className="text-sm text-slate-600">Compare your outcomes with anonymized peer data</p>
            </div>
            <input
              type="checkbox"
              checked={showPeerComparison}
              onChange={(e) => setShowPeerComparison(e.target.checked)}
              className="w-5 h-5 accent-primary"
            />
          </div>
        </div>
      </div>

      {/* Personalize Your Reports — Doctor-tone mimicry stub */}
      <div className="bg-white rounded-xl border border-gray-200 p-8 mb-6">
        <h2 className="text-xl font-bold text-slate-900 mb-1 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Personalize your reports
        </h2>
        <p className="text-sm text-slate-600 mb-6">
          Match your voice and style on patient emails
        </p>

        <div className="space-y-5">
          {/* Upload zone */}
          <div
            className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-primary/40 transition-colors cursor-pointer bg-slate-50/50"
            onClick={() => toneFileInputRef.current?.click()}
          >
            <Upload className="w-7 h-7 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-900 mb-1">
              Upload 1-3 of your past reports
            </p>
            <p className="text-xs text-slate-500 mb-3">
              The AI will learn your tone. Accepted formats: .pdf, .docx, .txt
            </p>
            <button
              type="button"
              disabled={uploadingSample}
              className="px-4 py-2 bg-white border border-gray-200 text-slate-900 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium disabled:opacity-50"
            >
              {uploadingSample ? 'Uploading...' : 'Choose files'}
            </button>
            <input
              ref={toneFileInputRef}
              type="file"
              accept=".pdf,.docx,.txt"
              multiple
              className="hidden"
              onChange={handleToneFileSelect}
            />
            {toneError && (
              <p className="text-xs text-red-600 mt-2">{toneError}</p>
            )}
          </div>

          {/* Status */}
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <FileText className="w-5 h-5 text-slate-400" />
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-900">
                {toneSampleCount === 0
                  ? 'Tone profile not yet created'
                  : `Tone profile active (${toneSampleCount} ${toneSampleCount === 1 ? 'sample' : 'samples'})`}
              </p>
              <p className="text-xs text-slate-500">
                {toneSampleCount === 0
                  ? 'Upload at least one report to begin training your style.'
                  : 'Your tone profile is being learned from the samples above.'}
              </p>
            </div>
          </div>

          {/* Toggle */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div>
              <h3 className="font-medium text-slate-900">Use my tone for patient emails</h3>
              <p className="text-sm text-slate-600">
                Apply your learned voice when generating patient-facing recaps
              </p>
            </div>
            <input
              type="checkbox"
              checked={useToneForEmails}
              onChange={(e) => setUseToneForEmails(e.target.checked)}
              className="w-5 h-5 accent-primary"
            />
          </div>

          <div className="flex items-start gap-2 px-1">
            <Sparkles className="w-3.5 h-3.5 text-primary/70 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-slate-500 italic">
              Currently in beta. We&apos;re learning your style from each report you generate.
            </p>
          </div>
        </div>
      </div>

      {/* Privacy & Security Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-8 mb-6">
        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          Privacy & Security
        </h2>

        <div className="space-y-4 mb-6">
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-900 mb-1">Data Encryption</h3>
            <p className="text-sm text-slate-600">AES-256 at rest, TLS 1.3 in transit</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-900 mb-1">Session Data Retention</h3>
            <p className="text-sm text-slate-600">Until you delete it</p>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleExportData}
            className="w-full px-4 py-3 bg-slate-100 text-slate-900 rounded-lg hover:bg-slate-200 transition-colors font-medium"
          >
            Export all my data
          </button>
          <button
            onClick={handleDeleteAccount}
            className="w-full px-4 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium border border-red-200"
          >
            Delete my account
          </button>
        </div>
      </div>

      {/* API Keys Section */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <button
          onClick={() => setExpandedAPI(!expandedAPI)}
          className="w-full px-8 py-6 flex items-center justify-between hover:bg-slate-50 transition-colors"
        >
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Key className="w-5 h-5 text-primary" />
            API Keys
          </h2>
          <span className="text-slate-600">{expandedAPI ? '−' : '+'}</span>
        </button>

        {expandedAPI && (
          <div className="border-t border-gray-200 px-8 py-6 space-y-6 bg-slate-50">
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">OpenAI API Key</label>
              <input
                type="password"
                value={openAPIKey}
                onChange={(e) => setOpenAPIKey(e.target.value)}
                placeholder="sk-..."
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">Supabase URL</label>
              <input
                type="text"
                value={supabaseURL}
                onChange={(e) => setSupabaseURL(e.target.value)}
                placeholder="https://your-project.supabase.co"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>

            <button
              onClick={handleSaveAPIKeys}
              className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-lg transition-colors"
            >
              Save API Keys
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
