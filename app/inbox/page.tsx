'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/auth-context';

interface Message {
  id: string;
  sender_name: string;
  sender_email: string;
  subject: string;
  content: string;
  status: string;
  created_at: string;
}

interface AIReply {
  id: string;
  reply_content: string;
  status: string;
  created_at: string;
}

export default function InboxPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [aiReply, setAiReply] = useState<AIReply | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingReply, setGeneratingReply] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMessages() {
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
        .from('messages')
        .select('*')
        .eq('company_id', cid)
        .order('created_at', { ascending: false });

      if (data) {
        setMessages(data as Message[]);
      }

      setLoading(false);
    }

    fetchMessages();
  }, [user]);

  const fetchAIReply = async (messageId: string) => {
    if (!companyId) return;

    const { data } = await supabase
      .from('ai_replies')
      .select('*')
      .eq('message_id', messageId)
      .eq('company_id', companyId)
      .maybeSingle();

    setAiReply(data as AIReply);
  };

  const handleSelectMessage = async (message: Message) => {
    setSelectedMessage(message);
    await fetchAIReply(message.id);

    if (message.status === 'new') {
      await supabase
        .from('messages')
        .update({ status: 'read' })
        .eq('id', message.id);

      setMessages(messages.map(m => m.id === message.id ? { ...m, status: 'read' } : m));
    }
  };

  const generateAIReply = async () => {
    if (!selectedMessage || !companyId) return;

    setGeneratingReply(true);

    try {
      const response = await fetch('/api/ai/reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messageId: selectedMessage.id,
          messageContent: selectedMessage.content,
          senderName: selectedMessage.sender_name,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const { data: newReply } = await supabase
          .from('ai_replies')
          .insert({
            message_id: selectedMessage.id,
            company_id: companyId,
            reply_content: data.reply,
            status: 'draft',
          })
          .select()
          .single();

        if (newReply) {
          setAiReply(newReply as AIReply);
        }
      }
    } catch (error) {
      console.error('Error generating AI reply:', error);
    } finally {
      setGeneratingReply(false);
    }
  };

  const sendReply = async () => {
    if (!aiReply) return;

    await supabase
      .from('ai_replies')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', aiReply.id);

    setAiReply({ ...aiReply, status: 'sent' });
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
        <h1 className="text-3xl font-bold text-slate-900">Posteingang</h1>
        <p className="text-slate-600 mt-2">Verwalten Sie Ihre Nachrichten und KI-Antworten</p>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-1/3 border-r border-slate-200 bg-white overflow-y-auto">
          {messages.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              Keine Nachrichten vorhanden
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {messages.map((message) => (
                <div
                  key={message.id}
                  onClick={() => handleSelectMessage(message)}
                  className={`p-6 cursor-pointer hover:bg-slate-50 transition-colors ${
                    selectedMessage?.id === message.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-slate-900">{message.sender_name}</h3>
                    {message.status === 'new' && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                        Neu
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 mb-1">{message.subject}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(message.created_at).toLocaleDateString('de-DE')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 bg-slate-50 overflow-y-auto">
          {selectedMessage ? (
            <div className="p-8">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200 mb-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">{selectedMessage.subject}</h2>
                <div className="flex items-center gap-4 mb-4 pb-4 border-b border-slate-200">
                  <div>
                    <p className="font-medium text-slate-900">{selectedMessage.sender_name}</p>
                    <p className="text-sm text-slate-600">{selectedMessage.sender_email}</p>
                  </div>
                  <div className="ml-auto text-sm text-slate-500">
                    {new Date(selectedMessage.created_at).toLocaleString('de-DE')}
                  </div>
                </div>
                <div className="prose max-w-none">
                  <p className="text-slate-700 whitespace-pre-wrap">{selectedMessage.content}</p>
                </div>
              </div>

              {aiReply ? (
                <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-slate-900">KI-Antwort</h3>
                    <span className={`px-3 py-1 text-xs font-medium rounded ${
                      aiReply.status === 'sent'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {aiReply.status === 'sent' ? 'Gesendet' : 'Entwurf'}
                    </span>
                  </div>
                  <p className="text-slate-700 whitespace-pre-wrap mb-4">{aiReply.reply_content}</p>
                  {aiReply.status === 'draft' && (
                    <button
                      onClick={sendReply}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                    >
                      Antwort senden
                    </button>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200 text-center">
                  <p className="text-slate-600 mb-4">Noch keine KI-Antwort generiert</p>
                  <button
                    onClick={generateAIReply}
                    disabled={generatingReply}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    {generatingReply ? 'Generiere Antwort...' : 'KI-Antwort generieren'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500">
              Wählen Sie eine Nachricht aus
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
