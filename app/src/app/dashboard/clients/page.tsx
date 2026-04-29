'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useApi } from '@/hooks/use-api';
import {
  Users,
  Search,
  ChevronRight,
  UserPlus,
  Hash,
  Calendar,
  Activity,
  X,
  RefreshCw,
} from 'lucide-react';

type SortOption = 'recent' | 'alpha' | 'sessions';
type ClientGender = '' | 'male' | 'female' | 'other';
type ClientAgeRange = '' | 'child' | 'adolescent' | 'young-adult' | 'adult' | 'middle-aged' | 'senior';

interface ClientInfo {
  clientCode: string;
  sessionCount: number;
  lastSessionDate: string;
  lastSessionTime: string;
  firstSessionDate: string;
  gender: string;
  ageRange: string;
  isConfirmed: boolean;
  presentingConcerns: string[];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function isActive(lastDate: string): boolean {
  const last = new Date(lastDate + 'T00:00:00');
  const now = new Date();
  const diffMs = now.getTime() - last.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays <= 30;
}

function generateClientCode(): string {
  return 'CL-' + (Math.floor(Math.random() * 9000) + 1000);
}

const AGE_RANGE_LABELS: Record<string, string> = {
  '': 'Not specified',
  child: '0–12 (Child)',
  adolescent: '13–17 (Adolescent)',
  'young-adult': '18–25 (Young Adult)',
  adult: '26–39 (Adult)',
  'middle-aged': '40–59 (Middle-aged)',
  senior: '60+ (Senior)',
};

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientInfo[]>([]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('recent');

  // Add Client modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newGender, setNewGender] = useState<ClientGender>('');
  const [newAgeRange, setNewAgeRange] = useState<ClientAgeRange>('');
  const [newNotes, setNewNotes] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newConcerns, setNewConcerns] = useState('');
  const [newGoals, setNewGoals] = useState('');
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [creating, setCreating] = useState(false);

  const searchParams = useSearchParams();
  const { data: clientsData, mutate: refreshClients } = useApi<{ clients: ClientInfo[] }>('/api/clients');

  useEffect(() => {
    if (clientsData?.clients) setClients(clientsData.clients);
  }, [clientsData]);

  // Auto-open modal if ?new=1 in URL (from dashboard "New Client" button)
  useEffect(() => {
    if (searchParams.get('new') === '1') {
      openAddModal();
    }
  }, [searchParams]);

  const openAddModal = () => {
    setNewCode(generateClientCode());
    setNewGender('');
    setNewAgeRange('');
    setNewNotes('');
    setNewEmail('');
    setNewConcerns('');
    setNewGoals('');
    setShowMoreDetails(false);
    setShowAddModal(true);
  };

  const handleCreateClient = async () => {
    const code = newCode.trim();
    if (!code) return;
    setCreating(true);
    try {
      const concerns = newConcerns.trim()
        ? newConcerns.split(',').map((c) => c.trim()).filter(Boolean)
        : [];
      const goals = newGoals.trim()
        ? newGoals.split(',').map((g) => g.trim()).filter(Boolean)
        : [];

      await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientCode: code,
          gender: newGender,
          ageRange: newAgeRange,
          clinicalNotes: newNotes.trim(),
          email: newEmail.trim() || undefined,
          presentingConcerns: concerns.length > 0 ? concerns : undefined,
          treatmentGoals: goals.length > 0 ? goals : undefined,
        }),
      });
      setShowAddModal(false);
      refreshClients();
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const filtered = useMemo(() => {
    let list = clients;

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) => c.clientCode.toLowerCase().includes(q));
    }

    switch (sort) {
      case 'alpha':
        list = [...list].sort((a, b) => a.clientCode.localeCompare(b.clientCode));
        break;
      case 'sessions':
        list = [...list].sort((a, b) => b.sessionCount - a.sessionCount);
        break;
      case 'recent':
      default:
        list = [...list].sort((a, b) => b.lastSessionDate.localeCompare(a.lastSessionDate));
        break;
    }

    return list;
  }, [clients, search, sort]);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header — eyebrow + serif headline + small meta. Same shape as the
          landing page sections to keep visual rhythm. */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-gray-500 mb-3">
            Caseload
          </p>
          <h1 className="font-playfair text-3xl font-semibold tracking-tight text-gray-900">
            My clients
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            {clients.length} client{clients.length !== 1 ? 's' : ''} ·{' '}
            {clients.reduce((s, c) => s + c.sessionCount, 0)} total sessions
          </p>
        </div>
      </div>

      {/* Search + Sort + New Client */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" strokeWidth={1.5} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search client code…"
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-md text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-900"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white border border-gray-300 rounded-md overflow-hidden">
            {([
              { value: 'recent', label: 'Recent' },
              { value: 'alpha', label: 'A–Z' },
              { value: 'sessions', label: 'Sessions' },
            ] as { value: SortOption; label: string }[]).map((opt, i) => (
              <button
                key={opt.value}
                onClick={() => setSort(opt.value)}
                className={`px-3 py-2 text-xs font-medium ${i > 0 ? 'border-l border-gray-300' : ''} ${
                  sort === opt.value
                    ? 'bg-primary-dark text-white'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 text-sm font-medium bg-primary-dark text-white px-4 py-2 rounded-md hover:bg-primary"
          >
            <UserPlus className="w-4 h-4" strokeWidth={1.5} />
            <span className="hidden sm:inline">New client</span>
          </button>
        </div>
      </div>

      {/* Client List — single border container with hairline rows inside.
          One bordered surface beats many bordered cards (less visual noise). */}
      {filtered.length > 0 ? (
        <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
          {filtered.map((client) => {
            const active = client.sessionCount > 0 && isActive(client.lastSessionDate);
            const genderLabel = client.gender === 'male' ? 'M' : client.gender === 'female' ? 'F' : client.gender === 'other' ? 'O' : '';

            return (
              <Link
                key={client.clientCode}
                href={`/dashboard/clients/${encodeURIComponent(client.clientCode)}`}
                className="flex items-center gap-4 px-6 py-5 border-b border-gray-100 last:border-b-0 hover:bg-bg-warm"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-mono font-semibold text-gray-900 text-base tracking-tight">
                      {client.clientCode}
                    </p>
                    {genderLabel && (
                      <span className="text-[11px] text-gray-600 border border-gray-200 px-1.5 py-0.5 rounded">
                        {genderLabel}
                      </span>
                    )}
                    {client.ageRange && (
                      <span className="text-[11px] text-gray-600 border border-gray-200 px-1.5 py-0.5 rounded">
                        {AGE_RANGE_LABELS[client.ageRange]?.split(' ')[0] || ''}
                      </span>
                    )}
                    {client.sessionCount > 0 ? (
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
                          active ? 'text-green-700' : 'text-gray-500'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-green-500' : 'bg-gray-400'}`} />
                        {active ? 'Active' : 'Inactive'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full text-primary-dark border border-primary-dark/30">
                        New
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-x-5 gap-y-1 flex-wrap text-xs text-gray-500">
                    {client.sessionCount > 0 ? (
                      <>
                        <span className="flex items-center gap-1.5">
                          <Hash className="w-3 h-3" strokeWidth={1.5} />
                          {client.sessionCount} session{client.sessionCount !== 1 ? 's' : ''}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3 h-3" strokeWidth={1.5} />
                          Last: {formatDate(client.lastSessionDate)}
                        </span>
                      </>
                    ) : (
                      <span className="text-gray-400">No sessions yet</span>
                    )}
                    {client.presentingConcerns && client.presentingConcerns.length > 0 && (
                      <span className="hidden md:flex items-center gap-1.5 text-gray-400">
                        <Activity className="w-3 h-3" strokeWidth={1.5} />
                        {client.presentingConcerns.slice(0, 2).join(', ')}
                        {client.presentingConcerns.length > 2 && ` +${client.presentingConcerns.length - 2}`}
                      </span>
                    )}
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" strokeWidth={1.5} />
              </Link>
            );
          })}

          {/* "Add client" sits at the bottom of the same hairline container. */}
          <button
            onClick={openAddModal}
            className="w-full flex items-center gap-3 px-6 py-5 border-t border-gray-200 hover:bg-bg-warm text-left"
          >
            <UserPlus className="w-4 h-4 text-primary-dark" strokeWidth={1.5} />
            <span className="text-sm font-medium text-primary-dark">Add new client</span>
          </button>
        </div>
      ) : clients.length === 0 ? (
        /* Empty state — no clients at all. Quiet, single bordered card. */
        <div className="text-center py-20 bg-white border border-gray-200 rounded-md">
          <p className="text-[11px] uppercase tracking-[0.18em] text-gray-500 mb-3">
            Empty caseload
          </p>
          <h3 className="font-playfair text-2xl font-semibold tracking-tight text-gray-900 mb-3">
            No clients yet.
          </h3>
          <p className="text-sm text-gray-600 mb-8 max-w-sm mx-auto leading-relaxed">
            Add your first client to get started. Each client gets a unique code — no real names needed.
          </p>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 text-sm font-medium bg-primary-dark text-white px-5 py-3 rounded-md hover:bg-primary"
          >
            <UserPlus className="w-4 h-4" strokeWidth={1.5} />
            Add your first client
          </button>
        </div>
      ) : (
        /* Empty state — search returned nothing */
        <div className="text-center py-12 bg-white border border-gray-200 rounded-md">
          <Search className="w-5 h-5 text-gray-300 mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-sm text-gray-500">
            No clients matching <span className="font-mono">&ldquo;{search}&rdquo;</span>
          </p>
        </div>
      )}

      {/* ─── Add Client Modal ─── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <div>
                <h2 className="text-lg font-bold text-gray-900">New Client</h2>
                <p className="text-xs text-gray-400 mt-0.5">All fields except client code are optional</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal body — scrollable */}
            <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1">
              {/* Client Code */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Client Code</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    placeholder="e.g. CL-0042"
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                  <button
                    onClick={() => setNewCode(generateClientCode())}
                    className="p-2.5 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-colors"
                    title="Generate new code"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600" />
                  </span>
                  Anonymous identifier — no real names stored
                </p>
              </div>

              {/* Gender + Age Range (side by side) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Gender <span className="font-normal text-gray-400">(optional)</span>
                  </label>
                  <select
                    value={newGender}
                    onChange={(e) => setNewGender(e.target.value as ClientGender)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-white"
                  >
                    <option value="">Not specified</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other / Non-binary</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Age Range <span className="font-normal text-gray-400">(optional)</span>
                  </label>
                  <select
                    value={newAgeRange}
                    onChange={(e) => setNewAgeRange(e.target.value as ClientAgeRange)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-white"
                  >
                    <option value="">Not specified</option>
                    <option value="child">0-12 (Child)</option>
                    <option value="adolescent">13-17 (Adolescent)</option>
                    <option value="young-adult">18-25 (Young Adult)</option>
                    <option value="adult">26-39 (Adult)</option>
                    <option value="middle-aged">40-59 (Middle-aged)</option>
                    <option value="senior">60+ (Senior)</option>
                  </select>
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Email <span className="font-normal text-gray-400">(optional — for your reference only)</span>
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="client@example.com"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>

              {/* Expandable: More Details */}
              <div>
                <button
                  onClick={() => setShowMoreDetails(!showMoreDetails)}
                  className="flex items-center gap-2 text-sm text-primary hover:text-primary-dark font-medium transition-colors"
                >
                  <ChevronRight className={`w-4 h-4 transition-transform ${showMoreDetails ? 'rotate-90' : ''}`} />
                  {showMoreDetails ? 'Less details' : 'More details'}
                </button>

                {showMoreDetails && (
                  <div className="mt-4 space-y-4">
                    {/* Presenting Concerns */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Presenting Concerns <span className="font-normal text-gray-400">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={newConcerns}
                        onChange={(e) => setNewConcerns(e.target.value)}
                        placeholder="e.g. anxiety, sleep issues, work stress"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      />
                      <p className="text-xs text-gray-400 mt-1">Separate with commas</p>
                    </div>

                    {/* Treatment Goals */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Treatment Goals <span className="font-normal text-gray-400">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={newGoals}
                        onChange={(e) => setNewGoals(e.target.value)}
                        placeholder="e.g. reduce anxiety, improve sleep, build coping skills"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      />
                      <p className="text-xs text-gray-400 mt-1">Separate with commas</p>
                    </div>

                    {/* Clinical Notes */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Clinical Notes <span className="font-normal text-gray-400">(optional)</span>
                      </label>
                      <textarea
                        value={newNotes}
                        onChange={(e) => setNewNotes(e.target.value)}
                        placeholder="Referral source, initial observations, anything to remember..."
                        rows={3}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Anonymous notice */}
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <p className="text-xs text-gray-500 leading-relaxed">
                  <span className="font-semibold text-gray-600">Fully anonymous by default.</span>{' '}
                  Only the client code is required. All other fields are optional and for your reference only.
                  No real names or identifying information is needed to use the platform.
                </p>
              </div>
            </div>

            {/* Modal footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3 flex-shrink-0">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateClient}
                disabled={!newCode.trim() || creating}
                className="flex-1 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-dark shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {creating && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                {creating ? 'Creating...' : 'Create Client'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
