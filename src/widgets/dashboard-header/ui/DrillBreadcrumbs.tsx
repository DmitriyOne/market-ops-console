'use client';

import { ChevronDownIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Fragment } from 'react';

import { getMarket, getProduct, getRegion, useDashboard } from '@/entities/performance';
import { useDrillDown } from '@/features/drill-down';
import { cn } from '@/shared/lib';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/shared/ui';

type Option = { id: string; name: string };

type StepProps = {
  /** Name of the chosen item, or undefined while nothing is chosen at this level. */
  name: string | undefined;
  placeholder: string;
  changeLabel: (name: string) => string;
  options: Option[];
  value: string | undefined;
  /** The deepest chosen step is the current page. */
  current: boolean;
  onPick: (id: string) => void;
};

/** One level of the path: shows the choice and opens the list of its siblings. */
function Step({ name, placeholder, changeLabel, options, value, current, onPick }: StepProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className={cn('min-h-11 gap-1 px-2', name ? 'text-foreground' : 'text-muted-foreground')}
          aria-label={name ? changeLabel(name) : placeholder}
          aria-current={current ? 'page' : undefined}
        >
          <span className={cn(current && 'font-semibold')}>{name ?? placeholder}</span>
          <ChevronDownIcon aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" collisionPadding={15}>
        <DropdownMenuRadioGroup value={value ?? ''} onValueChange={onPick}>
          {options.map((o) => (
            <DropdownMenuRadioItem key={o.id} value={o.id} className="min-h-11">
              {o.name}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Portfolio › Region › Market › Product (brief: drill down without losing
 * context). Each chosen step can be changed in place; picking the current
 * item again goes back up to that level.
 */
export function DrillBreadcrumbs({ className }: { className?: string }) {
  const t = useTranslations('drill');
  const { ds, state } = useDashboard();
  const drill = useDrillDown();
  const { regionId, marketId, productId } = state.scope;

  const region = regionId ? getRegion(ds, regionId) : undefined;
  const market = marketId ? getMarket(ds, marketId) : undefined;
  const product = productId ? getProduct(ds, productId) : undefined;
  const atPortfolio = !regionId;

  const steps: StepProps[] = [
    {
      name: region?.name,
      placeholder: t('chooseRegion'),
      changeLabel: (name) => t('changeRegion', { name }),
      options: ds.regions,
      value: regionId,
      current: Boolean(region) && !market,
      onPick: drill.toRegion,
    },
  ];
  if (region) {
    steps.push({
      name: market?.name,
      placeholder: t('chooseMarket'),
      changeLabel: (name) => t('changeMarket', { name }),
      options: ds.markets.filter((m) => m.regionId === region.id),
      value: marketId,
      current: Boolean(market) && !product,
      onPick: drill.toMarket,
    });
  }
  if (market) {
    steps.push({
      name: product?.name,
      placeholder: t('chooseProduct'),
      changeLabel: (name) => t('changeProduct', { name }),
      options: ds.products,
      value: productId,
      current: Boolean(product),
      onPick: drill.toProduct,
    });
  }

  return (
    <Breadcrumb aria-label={t('label')} className={className}>
      <BreadcrumbList className="gap-0.5 sm:gap-0.5">
        <BreadcrumbItem>
          {atPortfolio ? (
            <BreadcrumbPage className="px-2 font-semibold">{t('portfolio')}</BreadcrumbPage>
          ) : (
            <Button
              type="button"
              variant="ghost"
              className="min-h-11 px-2"
              onClick={drill.toPortfolio}
            >
              {t('portfolio')}
            </Button>
          )}
        </BreadcrumbItem>
        {steps.map((step) => (
          <Fragment key={step.placeholder}>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <Step {...step} />
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
