'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Subscriber {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  created_at: string;
}

export default function CampaignsPage() {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Subscribers
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  // Composer
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number } | null>(null);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const supabase = createClient();

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setIsLoading(false); return; }
    setUser(user);

    const { data: admin } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', user.email)
      .single();

    if (admin) {
      setIsAdmin(true);
      await loadSubscribers();
    }
    setIsLoading(false);
  }

  async function loadSubscribers() {
    try {
      const res = await fetch('/api/admin/campaigns');
      const data = await res.json();
      if (data.subscribers) {
        setSubscribers(data.subscribers);
      }
    } catch {
      showToast('Failed to load subscribers', 'error');
    }
  }

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  // Selection helpers
  const toggleEmail = (email: string) => {
    const next = new Set(selectedEmails);
    if (next.has(email)) next.delete(email);
    else next.add(email);
    setSelectedEmails(next);
  };

  const selectAll = () => {
    setSelectedEmails(new Set(filteredSubscribers.map((s) => s.email)));
  };

  const deselectAll = () => {
    setSelectedEmails(new Set());
  };

  // Filter
  const filteredSubscribers = subscribers.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      s.email.toLowerCase().includes(q) ||
      s.first_name.toLowerCase().includes(q) ||
      s.last_name.toLowerCase().includes(q)
    );
  });

  // Send campaign
  async function handleSend() {
    if (!subject.trim() || !body.trim()) {
      showToast('Subject and body are required', 'error');
      return;
    }
    if (selectedEmails.size === 0) {
      showToast('Select at least one recipient', 'error');
      return;
    }

    const confirmed = confirm(
      `Send "${subject}" to ${selectedEmails.size} recipient(s)?`
    );
    if (!confirmed) return;

    setSending(true);
    setResult(null);

    try {
      const res = await fetch('/api/admin/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          htmlContent: body.replace(/\n/g, '<br/>'),
          recipients: Array.from(selectedEmails),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setResult({ sent: data.sent, failed: data.failed });
        showToast(`Campaign sent! ${data.sent} delivered, ${data.failed} failed.`, 'success');
      } else {
        showToast('Error: ' + (data.error || 'Unknown'), 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setSending(false);
    }
  }

  // Loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-amber border-t-transparent rounded-full animate-spin" />
          <p className="font-display text-text-primary/60 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="font-display text-text-primary/60 text-sm">Access denied</p>
      </div>
    );
  }

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg font-display text-sm flex items-center gap-2 ${
            toast.type === 'success'
              ? 'bg-charcoal-deep text-white'
              : 'bg-red-500 text-white'
          }`}
        >
          {toast.type === 'success' && <span className="text-amber">●</span>}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-text-primary">
          Campaigns
        </h1>
        <p className="font-body text-sm text-text-secondary mt-0.5">
          {subscribers.length} subscribers • {selectedEmails.size} selected
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* LEFT — Subscriber list */}
        <div className="bg-white rounded-2xl shadow-sm border border-warm-200/60 overflow-hidden">
          <div className="px-5 py-4 border-b border-warm-200/60">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-sm font-bold text-text-primary uppercase tracking-wide">
                Subscribers
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={selectAll}
                  className="font-display text-[11px] font-bold py-1.5 px-3 rounded-full bg-amber/10 text-amber-dark hover:bg-amber/20 transition-colors"
                >
                  Select All
                </button>
                <button
                  onClick={deselectAll}
                  className="font-display text-[11px] font-bold py-1.5 px-3 rounded-full bg-warm-100 text-warm-500 hover:bg-warm-200 transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input text-sm w-full"
            />
          </div>

          <div className="max-h-[500px] overflow-y-auto divide-y divide-warm-100">
            {filteredSubscribers.length === 0 ? (
              <p className="text-center py-8 text-warm-400 font-display text-sm">
                No subscribers found
              </p>
            ) : (
              filteredSubscribers.map((sub) => (
                <label
                  key={sub.id}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-warm-50 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedEmails.has(sub.email)}
                    onChange={() => toggleEmail(sub.email)}
                    className="w-4 h-4 rounded accent-amber"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-sm text-text-primary truncate">
                      {sub.first_name || sub.last_name
                        ? `${sub.first_name} ${sub.last_name}`.trim()
                        : sub.email}
                    </p>
                    {(sub.first_name || sub.last_name) && (
                      <p className="font-body text-xs text-text-secondary truncate">
                        {sub.email}
                      </p>
                    )}
                  </div>
                  <span className="font-body text-[10px] text-warm-400 whitespace-nowrap">
                    {new Date(sub.created_at).toLocaleDateString('en-CA')}
                  </span>
                </label>
              ))
            )}
          </div>
        </div>

        {/* RIGHT — Email composer */}
        <div className="bg-white rounded-2xl shadow-sm border border-warm-200/60 p-5">
          <h2 className="font-display text-sm font-bold text-text-primary uppercase tracking-wide mb-4">
            Compose Email
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block font-display text-xs font-bold tracking-wide uppercase text-text-secondary mb-2">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="input w-full"
                placeholder="e.g. New Drop — Spring Collection"
              />
            </div>

            <div>
              <label className="block font-display text-xs font-bold tracking-wide uppercase text-text-secondary mb-2">
                Body
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="input w-full min-h-[250px] font-body text-sm leading-relaxed"
                placeholder="Write your email content here...&#10;&#10;Line breaks will be preserved.&#10;&#10;The email will be wrapped in the OnSite Club branded template automatically."
              />
              <p className="font-display text-[10px] text-warm-400 mt-1">
                Plain text. Line breaks become &lt;br/&gt;. Wrapped in branded template.
              </p>
            </div>

            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={sending || selectedEmails.size === 0 || !subject.trim() || !body.trim()}
              className="w-full py-3.5 bg-amber hover:bg-amber-dark text-charcoal-deep font-display text-sm font-bold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {sending
                ? 'Sending...'
                : `Send to ${selectedEmails.size} recipient${selectedEmails.size !== 1 ? 's' : ''}`}
            </button>

            {/* Result */}
            {result && (
              <div className="bg-warm-100 rounded-xl p-4 text-center">
                <p className="font-display text-sm text-text-primary">
                  <span className="text-green-600 font-bold">{result.sent} sent</span>
                  {result.failed > 0 && (
                    <span className="text-red-500 font-bold ml-3">{result.failed} failed</span>
                  )}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
