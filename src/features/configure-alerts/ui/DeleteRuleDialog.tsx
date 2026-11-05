'use client';

import { useTranslations } from 'next-intl';
import { useRef } from 'react';

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

/**
 * "Delete “…”?" before an optimistic delete (owner, 2026-11-05). After a
 * delete the row and its button are gone, so focus goes to `afterDelete`
 * instead of being dropped on the page.
 */
export function DeleteRuleDialog({
  rule,
  onConfirm,
  onClose,
  afterDelete,
}: {
  rule: AlertRule | null;
  onConfirm: (rule: AlertRule) => void;
  onClose: () => void;
  afterDelete: () => void;
}) {
  const t = useTranslations('alerts.delete');
  const confirmed = useRef(false);
  return (
    <AlertDialog
      open={rule !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <AlertDialogContent
        onCloseAutoFocus={(event) => {
          if (!confirmed.current) return;
          confirmed.current = false;
          event.preventDefault();
          afterDelete();
        }}
      >
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
              if (!rule) return;
              confirmed.current = true;
              onConfirm(rule);
            }}
          >
            {t('confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
