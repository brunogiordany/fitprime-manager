'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Copy, Check, Loader } from 'lucide-react';

export function GeneralInviteLink() {
  const [copied, setCopied] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const { data, isLoading, error } = trpc.student.getOrCreateGeneralInvite.useQuery(
    undefined,
    {
      enabled: showModal,
    }
  );

  const handleCopyLink = async () => {
    if (data?.fullInviteLink) {
      await navigator.clipboard.writeText(data.fullInviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      {/* Button to open modal */}
      <button
        onClick={() => setShowModal(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.658 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
          />
        </svg>
        Link de Convite Geral
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900">
                Link de Convite Geral
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-500 hover:text-slate-700"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Content */}
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="w-6 h-6 text-orange-500 animate-spin" />
              </div>
            ) : error ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">
                  Erro ao carregar link de convite. Tente novamente.
                </p>
              </div>
            ) : data ? (
              <div className="space-y-4">
                {/* Description */}
                <p className="text-slate-600 text-sm">
                  Compartilhe este link com seus alunos. Eles poderão se registrar
                  diretamente sem precisar de um convite individual.
                </p>

                {/* Link Display */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <p className="text-xs text-slate-500 mb-2">Link de Convite:</p>
                  <p className="text-sm font-mono text-slate-900 break-all">
                    {data.fullInviteLink}
                  </p>
                </div>

                {/* Expiry Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-700">
                    <strong>Válido até:</strong>{' '}
                    {new Date(data.expiresAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>

                {/* Copy Button */}
                <button
                  onClick={handleCopyLink}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                    copied
                      ? 'bg-green-500 text-white'
                      : 'bg-orange-500 hover:bg-orange-600 text-white'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-5 h-5" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5" />
                      Copiar Link
                    </>
                  )}
                </button>

                {/* Share Instructions */}
                <div className="bg-slate-50 rounded-lg p-4 mt-4">
                  <p className="text-xs font-semibold text-slate-700 mb-2">
                    Como compartilhar:
                  </p>
                  <ul className="text-xs text-slate-600 space-y-1">
                    <li>✓ Copie o link acima</li>
                    <li>✓ Compartilhe via WhatsApp, email ou redes sociais</li>
                    <li>✓ Seus alunos acessarão o link e se registrarão</li>
                    <li>✓ Você receberá notificação de cada novo cadastro</li>
                  </ul>
                </div>
              </div>
            ) : null}

            {/* Close Button */}
            <button
              onClick={() => setShowModal(false)}
              className="w-full mt-6 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
