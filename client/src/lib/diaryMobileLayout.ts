// Shared by the real diary and its mobile viewport regression fixture.
// Keep these strings static so Tailwind detects every utility in production.
export const diaryDialogClassName =
  "sm:max-w-4xl sm:p-0";

export const diaryDialogHeaderClassName =
  "shrink-0 border-b px-3 py-3 pr-11 sm:px-6 sm:pr-12";

export const diaryDialogScrollClassName =
  "min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-3 pb-8 pt-3 sm:px-6 [scrollbar-gutter:stable]";

export const diaryDialogFooterClassName =
  "relative z-10 shrink-0 border-t bg-background px-3 pt-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-6 sm:py-3";

export const diaryDialogActionsClassName =
  "grid w-full grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-end";
