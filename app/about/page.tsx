import { AkronTireShop } from '@/components/akron-tire-shop';

export const metadata = {
  title: 'About | Akron Tire Shop',
  description: 'Learn about Akron Tire Shop, a focused local tire shop in Akron, Ohio.',
};

export default function AboutPage() {
  return <AkronTireShop initialScreen="reports" />;
}
