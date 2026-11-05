'use client';

import { useTranslations } from 'next-intl';

import type { AlertRule } from '@/shared/api';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui';

/** "Delete “…”?" before an optimistic delete (owner, 2026-11-05). */
export function DeleteRuleDialog({
  rule,
  onConfirm,
  onClose,
}: {
  rule: AlertRule | null;
  onConfirm: (rule: AlertRule) => void;
  onClose: () => void;
}) {
  const t = useTranslations('alerts.delete');
  return (
    <AlertDialog
      open={rule !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('title', { name: rule?.name ?? '' })}</AlertDialogTitle>
          <AlertDialogDescription>{t('description')}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="h-11">{t('cancel')}</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            className="h-11"
            onClick={() => {
              if (rule) onConfirm(rule);
            }}
          >
            {t('confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
