'use client';

import { useTheme } from '@wrksz/themes/client';
import { ChevronRightIcon, MonitorIcon, MoonIcon, SunIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/shared/ui';

const THEMES = [
  { value: 'light', Icon: SunIcon },
  { value: 'dark', Icon: MoonIcon },
  { value: 'system', Icon: MonitorIcon },
] as const;

/** The theme menu; `children` is its trigger. */
function ThemeMenu({ children }: { children: ReactNode }) {
  const t = useTranslations('theme');
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup
          value={theme ?? 'system'}
          onValueChange={(value) => {
            const choice = THEMES.find((t) => t.value === value);
            if (choice) setTheme(choice.value);
          }}
        >
          {THEMES.map(({ value, Icon }) => (
            <DropdownMenuRadioItem key={value} value={value}>
              <Icon aria-hidden />
              {t(value)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Both are undefined on the server and in the first client render (library
// docs): the trigger waits, so it never offers a choice it cannot show.
const useThemeReady = () => {
  const { resolvedTheme, forcedTheme } = useTheme();
  return Boolean(resolvedTheme) && !forcedTheme;
};

/** Header: an icon button. */
export function ThemeSwitch() {
  const t = useTranslations('theme');
  const ready = useThemeReady();
  return (
    <ThemeMenu>
      <Button variant="ghost" size="icon" aria-label={t('label')} disabled={!ready}>
        <SunIcon aria-hidden className="dark:hidden" />
        <MoonIcon aria-hidden className="hidden dark:block" />
      </Button>
    </ThemeMenu>
  );
}

/** Settings sheet: the whole row opens the menu and shows the current theme. */
export function ThemeSwitchRow({ className }: { className?: string }) {
  const t = useTranslations('theme');
  const ready = useThemeReady();
  const { theme } = useTheme();
  const current = THEMES.find((c) => c.value === theme) ?? THEMES[2];
  return (
    <ThemeMenu>
      <button type="button" className={className} disabled={!ready}>
        <span>{t('label')}</span>{' '}
        <span className="flex items-center gap-1 text-muted-foreground">
          {ready ? t(current.value) : null}
          <ChevronRightIcon aria-hidden className="size-4" />
        </span>
      </button>
    </ThemeMenu>
  );
}
