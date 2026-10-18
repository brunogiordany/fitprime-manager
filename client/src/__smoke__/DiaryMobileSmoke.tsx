// Regression harness intentionally uses the PRODUCTION Dialog/Inputs/Cards
// and the exact training-diary shell classes, with mock data and no auth/API.
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { toast, Toaster } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  diaryDialogClassName, diaryDialogHeaderClassName,
  diaryDialogScrollClassName, diaryDialogFooterClassName, diaryDialogActionsClassName,
} from "@/lib/diaryMobileLayout";
import "@/index.css";

document.documentElement.classList.add("premium");

function DiaryLayoutSmoke() {
  const [open, setOpen] = useState(true);
  const [weight, setWeight] = useState("61");
  const [saves, setSaves] = useState(0);
  const [saving, setSaving] = useState(false);
  const save = async () => {
    if (saving) return;
    const focused = document.activeElement;
    if (focused instanceof HTMLElement) focused.blur();
    setSaving(true);
    await new Promise(resolve => setTimeout(resolve, 30));
    setSaves(old => old + 1);
    toast.success("Alterações salvas!", { id: "fitprime-diary-save", duration: 1800 });
    setSaving(false);
  };

  return (
    <>
      <main data-testid="underlying-page" className="min-h-screen bg-red-800 p-8 text-white">
        PÁGINA ANTERIOR, NÃO PODE APARECER SOB O MODAL
      </main>
      <Toaster position="top-center" visibleToasts={1} expand={false} />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          mobileFullscreen
          className={diaryDialogClassName}
          data-testid="training-diary-dialog"
          onOpenAutoFocus={event => event.preventDefault()}
        >
          <DialogHeader className={diaryDialogHeaderClassName}>
            <DialogTitle className="text-lg">Registro de Treino</DialogTitle>
            <DialogDescription>Bruno · 16/10/2026</DialogDescription>
          </DialogHeader>
          <div
            data-testid="training-diary-scroll"
            className={diaryDialogScrollClassName}
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            <div className="space-y-4">
              {Array.from({ length: 14 }, (_, index) => (
                <Card key={index} className="gap-0 overflow-hidden py-0">
                  <CardHeader className="block p-3 sm:p-4">
                    <strong>{index + 1}. Exercício de teste {index + 1}</strong>
                  </CardHeader>
                  <CardContent className="border-t p-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="min-w-0 space-y-1">
                        <Label>Carga (kg)</Label>
                        <Input
                          data-testid={index === 8 ? "editable-load" : undefined}
                          className="h-10 text-center text-base sm:text-sm"
                          inputMode="decimal"
                          type="number"
                          value={index === 8 ? weight : "60"}
                          onChange={event => setWeight(event.target.value)}
                          readOnly={index !== 8}
                        />
                      </div>
                      <div className="min-w-0 space-y-1">
                        <Label>Descanso (s)</Label>
                        <Input
                          className="h-10 text-center text-base sm:text-sm"
                          inputMode="numeric"
                          type="number"
                          readOnly
                          value="180"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          <DialogFooter data-testid="training-diary-footer" className={diaryDialogFooterClassName}>
            <div className={diaryDialogActionsClassName}>
              <Button variant="secondary" data-testid="diary-save" onClick={save} disabled={saving}>
                {saving ? "Salvando..." : "Salvar"}
              </Button>
              <Button data-testid="diary-finish" onClick={() => {}}>Finalizar Treino</Button>
              <Button variant="outline" data-testid="diary-close" onClick={() => setOpen(false)}>Fechar</Button>
              <Button variant="ghost" data-testid="diary-delete" onClick={() => {}}>Excluir</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div data-testid="save-count" aria-hidden="true" className="sr-only">{saves}</div>
    </>
  );
}

createRoot(document.getElementById("root")!).render(<DiaryLayoutSmoke />);
