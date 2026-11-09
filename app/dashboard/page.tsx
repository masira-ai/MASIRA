'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/auth-context';

interface Stats {
  messages: number;
  reviews: number;
  offers: number;
  appointments: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({ messages: 0, reviews: 0, offers: 0, appointments: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile || !(profile as any).company_id) {
        setLoading(false);
        return;
      }

      const companyId = (profile as any).company_id;

      const [messages, reviews, offers, appointments] = await Promise.all([
        supabase.from('messages').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
        supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
        supabase.from('offers').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
        supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
      ]);

      setStats({
        messages: messages.count || 0,
        reviews: reviews.count || 0,
        offers: offers.count || 0,
        appointments: appointments.count || 0,
      });

      setLoading(false);
    }

    fetchStats();
  }, [user]);

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-slate-600">Laden...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600 mt-2">Willkommen zurück! Hier ist Ihre Übersicht.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Nachrichten</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{stats.messages}</p>
            </div>
            <div className="text-4xl">📨</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Bewertungen</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{stats.reviews}</p>
            </div>
            <div className="text-4xl">⭐</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Angebote</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{stats.offers}</p>
            </div>
            <div className="text-4xl">💼</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Termine</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{stats.appointments}</p>
            </div>
            <div className="text-4xl">📅</div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm p-6 border border-slate-200">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Schnellaktionen</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/inbox"
            className="flex items-center gap-3 p-4 rounded-lg border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-all"
          >
            <span className="text-2xl">📨</span>
            <div>
              <p className="font-medium text-slate-900">Posteingang</p>
              <p className="text-sm text-slate-600">Nachrichten verwalten</p>
            </div>
          </a>

          <a
            href="/reviews"
            className="flex items-center gap-3 p-4 rounded-lg border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-all"
          >
            <span className="text-2xl">⭐</span>
            <div>
              <p className="font-medium text-slate-900">Bewertungen</p>
              <p className="text-sm text-slate-600">Bewertungen ansehen</p>
            </div>
          </a>

          <a
            href="/knowledge"
            className="flex items-center gap-3 p-4 rounded-lg border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-all"
          >
            <span className="text-2xl">📚</span>
            <div>
              <p className="font-medium text-slate-900">Wissensdatenbank</p>
              <p className="text-sm text-slate-600">Artikel verwalten</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
