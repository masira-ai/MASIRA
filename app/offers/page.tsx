'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/auth-context';

interface Offer {
  id: string;
  title: string;
  description: string;
  price: number;
  valid_until: string | null;
  status: string;
  created_at: string;
}

export default function OffersPage() {
  const { user } = useAuth();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    valid_until: '',
    status: 'draft',
  });

  useEffect(() => {
    fetchOffers();
  }, [user]);

  const fetchOffers = async () => {
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

    const cid = (profile as any).company_id;
    setCompanyId(cid);

    const { data } = await supabase
      .from('offers')
      .select('*')
      .eq('company_id', cid)
      .order('created_at', { ascending: false });

    if (data) {
      setOffers(data as Offer[]);
    }

    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) return;

    const { error } = await supabase.from('offers').insert({
      company_id: companyId,
      title: formData.title,
      description: formData.description,
      price: parseFloat(formData.price),
      valid_until: formData.valid_until || null,
      status: formData.status,
    });

    if (!error) {
      setFormData({
        title: '',
        description: '',
        price: '',
        valid_until: '',
        status: 'draft',
      });
      setShowForm(false);
      await fetchOffers();
    }
  };

  const deleteOffer = async (id: string) => {
    await supabase.from('offers').delete().eq('id', id);
    await fetchOffers();
  };

  const toggleStatus = async (offer: Offer) => {
    const newStatus = offer.status === 'active' ? 'draft' : 'active';
    await supabase
      .from('offers')
      .update({ status: newStatus })
      .eq('id', offer.id);
    await fetchOffers();
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-slate-600">Laden...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Angebote</h1>
          <p className="text-slate-600 mt-2">Verwalten Sie Ihre Angebote und Preise</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          {showForm ? 'Abbrechen' : '+ Neues Angebot'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200 mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Neues Angebot erstellen</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Titel
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Beschreibung
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Preis (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Gültig bis (optional)
                </label>
                <input
                  type="date"
                  value={formData.valid_until}
                  onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="draft">Entwurf</option>
                <option value="active">Aktiv</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Angebot erstellen
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {offers.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-500">
            Keine Angebote vorhanden
          </div>
        ) : (
          offers.map((offer) => (
            <div
              key={offer.id}
              className="bg-white rounded-xl shadow-sm p-6 border border-slate-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-bold text-slate-900">{offer.title}</h3>
                <span
                  className={`px-3 py-1 text-xs font-medium rounded ${
                    offer.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : offer.status === 'expired'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {offer.status === 'active'
                    ? 'Aktiv'
                    : offer.status === 'expired'
                    ? 'Abgelaufen'
                    : 'Entwurf'}
                </span>
              </div>

              <p className="text-slate-600 mb-4 line-clamp-3">{offer.description}</p>

              <div className="mb-4">
                <div className="text-3xl font-bold text-blue-600">
                  €{offer.price.toFixed(2)}
                </div>
                {offer.valid_until && (
                  <div className="text-sm text-slate-500 mt-1">
                    Gültig bis: {new Date(offer.valid_until).toLocaleDateString('de-DE')}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => toggleStatus(offer)}
                  className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
                >
                  {offer.status === 'active' ? 'Deaktivieren' : 'Aktivieren'}
                </button>
                <button
                  onClick={() => deleteOffer(offer.id)}
                  className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-medium rounded-lg transition-colors"
                >
                  Löschen
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
