'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
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

  const { data: clientsData, mutate: refreshClients } = useApi<{ clients: ClientInfo[] }>('/api/clients');

  useEffect(() => {
    if (clientsData?.clients) setClients(clientsData.clients);
  }, [clientsData]);

  const openAddModal = () => {
    setNewCode(generateClientCode());
    setNewGender('');
    setNewAgeRange('');
    setNewNotes('');
    setShowAddModal(true);
  };

  const handleCreateClient = async () => {
    const code = newCode.trim();
    if (!code) return;
    try {
      await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientCode: code, gender: newGender, ageRange: newAgeRange, clinicalNotes: newNotes.trim() }),
      });
      setShowAddModal(false);
      refreshClients();
    } catch (err) {
      console.error(err);
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Users className="w-7 h-7 text-primary" />
            <h1 className="text-3xl font-bold text-gray-900">My Clients</h1>
          </div>
          <p className="text-gray-500 text-sm">
            {clients.length} client{clients.length !== 1 ? 's' : ''} &middot;{' '}
            {clients.reduce((s, c) => s + c.sessionCount, 0)} total sessions
          </p>
        </div>
      </div>

      {/* Search + Sort */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search client code..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1">
          {([
            { value: 'recent', label: 'Recent' },
            { value: 'alpha', label: 'A-Z' },
            { value: 'sessions', label: 'Sessions' },
          ] as { value: SortOption; label: string }[]).map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSort(opt.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                sort === opt.value
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Client List */}
      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((client) => {
            const active = client.sessionCount > 0 && isActive(client.lastSessionDate);
            const genderLabel = client.gender === 'male' ? 'M' : client.gender === 'female' ? 'F' : client.gender === 'other' ? 'O' : '';

            return (
              <Link
                key={client.clientCode}
                href={`/dashboard/clients/${encodeURIComponent(client.clientCode)}`}
                className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-gray-200 hover:border-primary/30 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group"
              >
                {/* Avatar */}
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="font-mono text-sm font-bold text-primary">
                    {client.clientCode.slice(0, 2).toUpperCase()}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-mono font-bold text-gray-900 text-base">{client.clientCode}</p>
                    {genderLabel && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{genderLabel}</span>
                    )}
                    {client.ageRange && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                        {AGE_RANGE_LABELS[client.ageRange]?.split(' ')[0] || ''}
                      </span>
                    )}
                    {client.sessionCount > 0 ? (
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                          active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-green-500' : 'bg-gray-400'}`} />
                        {active ? 'Active' : 'Inactive'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                        New
                      </span>
                    )}
                  </div>

                  {/* Stats row */}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    {client.sessionCount > 0 ? (
                      <>
                        <span className="flex items-center gap-1">
                          <Hash className="w-3 h-3" />
                          {client.sessionCount} session{client.sessionCount !== 1 ? 's' : ''}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Last: {formatDate(client.lastSessionDate)}
                        </span>
                      </>
                    ) : (
                      <span className="text-gray-400">No sessions yet</span>
                    )}
                    {client.presentingConcerns && client.presentingConcerns.length > 0 && (
                      <span className="hidden md:flex items-center gap-1 text-gray-400">
                        <Activity className="w-3 h-3" />
                        {client.presentingConcerns.slice(0, 2).join(', ')}
                        {client.presentingConcerns.length > 2 && ` +${client.presentingConcerns.length - 2}`}
                      </span>
                    )}
                  </div>
                </div>

                {/* Arrow */}
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
              </Link>
            );
          })}

          {/* Add client card at bottom of list */}
          <button
            onClick={openAddModal}
            className="w-full flex items-center gap-4 p-5 bg-white rounded-2xl border-2 border-dashed border-gray-200 hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 group"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center flex-shrink-0 transition-colors">
              <UserPlus className="w-5 h-5 text-primary" />
            </div>
            <p className="text-sm font-semibold text-gray-500 group-hover:text-primary transition-colors">
              Add New Client
            </p>
          </button>
        </div>
      ) : clients.length === 0 ? (
        /* Empty state — no clients at all */
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
            <UserPlus className="w-8 h-8 text-primary/50" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">No clients yet</h3>
          <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
            Add your first client to get started. Each client gets a unique code — no real names needed.
          </p>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark shadow-md transition-all"
          >
            <UserPlus className="w-4 h-4" />
            Add Your First Client
          </button>
        </div>
      ) : (
        /* Empty state — search returned nothing */
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
          <Search className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">
            No clients matching &ldquo;{search}&rdquo;
          </p>
        </div>
      )}

      {/* ─── Add Client Modal ─── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Add New Client</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-5 space-y-5">
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
                  This is the only identifier stored. No real names.
                </p>
              </div>

              {/* Gender + Age Range (side by side) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Gender</label>
                  <select
                    value={newGender}
                    onChange={(e) => setNewGender(e.target.value as ClientGender)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-white"
                  >
                    <option value="">Not specified</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Age Range</label>
                  <select
                    value={newAgeRange}
                    onChange={(e) => setNewAgeRange(e.target.value as ClientAgeRange)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-white"
                  >
                    <option value="">Not specified</option>
                    <option value="child">0–12 (Child)</option>
                    <option value="adolescent">13–17 (Adolescent)</option>
                    <option value="young-adult">18–25 (Young Adult)</option>
                    <option value="adult">26–39 (Adult)</option>
                    <option value="middle-aged">40–59 (Middle-aged)</option>
                    <option value="senior">60+ (Senior)</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Initial Notes <span className="font-normal text-gray-400">(optional)</span>
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

            {/* Modal footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateClient}
                disabled={!newCode.trim()}
                className="flex-1 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-dark shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Client
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
