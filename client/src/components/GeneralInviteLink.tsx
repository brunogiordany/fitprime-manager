'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Copy, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function GeneralInviteLink() {
  const [copied, setCopied] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const utils = trpc.useUtils();

  const { data, isLoading, error, refetch } = trpc.students.getOrCreateGeneralInvite.useQuery(
    undefined,
    {
      enabled: showModal,
    }
  );

  const cancelMutation = trpc.students.cancelGeneralInvite.useMutation({
    onSuccess: () => {
      toast.success('Link de convite cancelado com sucesso!');
      setShowCancelConfirm(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao cancelar link');
    },
  });

  const regenerateMutation = trpc.students.regenerateGeneralInvite.useQuery(
    undefined,
    {
      enabled: false,
    }
  );

  const handleCopyLink = async () => {
    if (data?.fullInviteLink) {
      await navigator.clipboard.writeText(data.fullInviteLink);
      setCopied(true);
      toast.success('Link copiado para a área de transferência!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCancelLink = () => {
    if (data?.inviteToken) {
      cancelMutation.mutate({ inviteToken: data.inviteToken });
    }
  };

  const handleRegenerateLink = async () => {
    const result = await regenerateMutation.refetch();
    if (result.data) {
      toast.success('Novo link gerado com sucesso!');
      refetch();
    }
  };

  return (
    <>
      {/* Button to open modal */}
      <Button
        onClick={() => setShowModal(true)}
        variant="outline"
        className="gap-2"
      >
        <svg
          className="w-4 h-4"
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
        Link de Convite
      </Button>

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
                <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
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
                <Button
                  onClick={handleCopyLink}
                  className={`w-full gap-2 ${
                    copied
                      ? 'bg-green-500 hover:bg-green-600'
                      : 'bg-orange-500 hover:bg-orange-600'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copiar Link
                    </>
                  )}
                </Button>

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

                {/* Action Buttons */}
                <div className="flex gap-2 mt-4">
                  <Button
                    onClick={() => setShowCancelConfirm(true)}
                    variant="outline"
                    className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                    disabled={cancelMutation.isPending}
                  >
                    Cancelar Link
                  </Button>
                  <Button
                    onClick={handleRegenerateLink}
                    variant="outline"
                    className="flex-1"
                    disabled={regenerateMutation.isPending}
                  >
                    Gerar Novo
                  </Button>
                </div>
              </div>
            ) : null}

            {/* Cancel Confirmation Modal */}
            {showCancelConfirm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
                <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    Cancelar Link de Convite?
                  </h3>
                  <p className="text-slate-600 text-sm mb-6">
                    Ao cancelar este link, ninguém mais poderá se registrar usando-o. Você poderá gerar um novo link a qualquer momento.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setShowCancelConfirm(false)}
                      variant="outline"
                      className="flex-1"
                    >
                      Não, manter
                    </Button>
                    <Button
                      onClick={handleCancelLink}
                      className="flex-1 bg-red-600 hover:bg-red-700"
                      disabled={cancelMutation.isPending}
                    >
                      {cancelMutation.isPending ? 'Cancelando...' : 'Sim, cancelar'}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Close Button */}
            <Button
              onClick={() => setShowModal(false)}
              variant="outline"
              className="w-full mt-6"
            >
              Fechar
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
