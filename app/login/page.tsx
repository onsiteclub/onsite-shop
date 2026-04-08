import { redirect } from 'next/navigation';

const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL || 'https://auth.onsiteclub.ca';

export default function LoginRedirect({
  searchParams,
}: {
  searchParams: { return?: string };
}) {
  const returnTo = searchParams.return || '/';
  const shopUrl = process.env.NEXT_PUBLIC_SHOP_URL || 'https://shop.onsiteclub.ca';
  redirect(`${AUTH_URL}/login?return_to=${encodeURIComponent(`${shopUrl}${returnTo}`)}`);
}
