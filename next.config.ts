import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/shared/config/i18n/request.ts');

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.0.63'],
};

export default withNextIntl(nextConfig);
