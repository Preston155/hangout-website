import { AkronTireShop } from '@/components/akron-tire-shop';

export const metadata = {
  title: 'Tires | Akron Tire Shop',
  description: 'Browse sample new and used tire inventory for Akron Tire Shop.',
};

export default function TiresPage() {
  return <AkronTireShop initialPage="tires" />;
}
