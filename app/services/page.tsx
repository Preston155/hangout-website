import { AkronTireShop } from '@/components/akron-tire-shop';

export const metadata = {
  title: 'Services | Akron Tire Shop',
  description: 'Akron Tire Shop offers new tires, used tires, tire mounting, tire balancing, and tire repairs.',
};

export default function ServicesPage() {
  return <AkronTireShop initialScreen="checkout" />;
}
