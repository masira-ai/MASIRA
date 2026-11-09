'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/auth-context';

interface Article {
  id: string;
  title: string;
  content: string;
  category: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

export default function KnowledgePage() {
  const { user } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    tags: '',
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchArticles();
  }, [user]);

  const fetchArticles = async () => {
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
      .from('knowledge_base')
      .select('*')
      .eq('company_id', cid)
      .order('created_at', { ascending: false });

    if (data) {
      setArticles(data as Article[]);
    }

    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) return;

    const tags = formData.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    if (isEditing && selectedArticle) {
      const { error } = await supabase
        .from('knowledge_base')
        .update({
          title: formData.title,
          content: formData.content,
          category: formData.category || null,
          tags: tags.length > 0 ? tags : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedArticle.id);

      if (!error) {
        resetForm();
        await fetchArticles();
      }
    } else {
      const { error } = await supabase.from('knowledge_base').insert({
        company_id: companyId,
        title: formData.title,
        content: formData.content,
        category: formData.category || null,
        tags: tags.length > 0 ? tags : null,
      });

      if (!error) {
        resetForm();
        await fetchArticles();
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      category: '',
      tags: '',
    });
    setShowForm(false);
    setIsEditing(false);
    setSelectedArticle(null);
  };

  const editArticle = (article: Article) => {
    setFormData({
      title: article.title,
      content: article.content,
      category: article.category || '',
      tags: article.tags?.join(', ') || '',
    });
    setSelectedArticle(article);
    setIsEditing(true);
    setShowForm(true);
  };

  const deleteArticle = async (id: string) => {
    await supabase.from('knowledge_base').delete().eq('id', id);
    if (selectedArticle?.id === id) {
      setSelectedArticle(null);
    }
    await fetchArticles();
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-slate-600">Laden...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="p-8 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Wissensdatenbank</h1>
            <p className="text-slate-600 mt-2">Verwalten Sie Ihre Artikel und Dokumentation</p>
          </div>
          <button
            onClick={() => {
              if (showForm && !isEditing) {
                resetForm();
              } else if (showForm && isEditing) {
                resetForm();
              } else {
                setShowForm(true);
              }
            }}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            {showForm ? 'Abbrechen' : '+ Neuer Artikel'}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-1/3 border-r border-slate-200 bg-white overflow-y-auto">
          {articles.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              Keine Artikel vorhanden
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {articles.map((article) => (
                <div
                  key={article.id}
                  onClick={() => setSelectedArticle(article)}
                  className={`p-6 cursor-pointer hover:bg-slate-50 transition-colors ${
                    selectedArticle?.id === article.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                  }`}
                >
                  <h3 className="font-semibold text-slate-900 mb-2">{article.title}</h3>
                  {article.category && (
                    <span className="inline-block px-2 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded mb-2">
                      {article.category}
                    </span>
                  )}
                  {article.tags && article.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {article.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-slate-500 mt-2">
                    {new Date(article.created_at).toLocaleDateString('de-DE')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 bg-slate-50 overflow-y-auto">
          {showForm ? (
            <div className="p-8">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
                <h2 className="text-xl font-bold text-slate-900 mb-6">
                  {isEditing ? 'Artikel bearbeiten' : 'Neuen Artikel erstellen'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Titel</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Inhalt</label>
                    <textarea
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={12}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Kategorie (optional)
                      </label>
                      <input
                        type="text"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Tags (kommagetrennt)
                      </label>
                      <input
                        type="text"
                        value={formData.tags}
                        onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="z.B. FAQ, Hilfe, Anleitungen"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                  >
                    {isEditing ? 'Änderungen speichern' : 'Artikel erstellen'}
                  </button>
                </form>
              </div>
            </div>
          ) : selectedArticle ? (
            <div className="p-8">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
                <div className="flex items-start justify-between mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">{selectedArticle.title}</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => editArticle(selectedArticle)}
                      className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium rounded-lg transition-colors"
                    >
                      Bearbeiten
                    </button>
                    <button
                      onClick={() => deleteArticle(selectedArticle.id)}
                      className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-medium rounded-lg transition-colors"
                    >
                      Löschen
                    </button>
                  </div>
                </div>

                {selectedArticle.category && (
                  <div className="mb-4">
                    <span className="inline-block px-3 py-1 bg-slate-100 text-slate-700 text-sm font-medium rounded">
                      {selectedArticle.category}
                    </span>
                  </div>
                )}

                {selectedArticle.tags && selectedArticle.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {selectedArticle.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="prose max-w-none mb-6">
                  <p className="text-slate-700 whitespace-pre-wrap">{selectedArticle.content}</p>
                </div>

                <div className="text-sm text-slate-500 pt-4 border-t border-slate-200">
                  <p>Erstellt am: {new Date(selectedArticle.created_at).toLocaleString('de-DE')}</p>
                  <p>Zuletzt aktualisiert: {new Date(selectedArticle.updated_at).toLocaleString('de-DE')}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500">
              Wählen Sie einen Artikel aus oder erstellen Sie einen neuen
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
