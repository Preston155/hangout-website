import { AkronTireShop } from '@/components/akron-tire-shop';

export const metadata = {
  title: 'Contact | Akron Tire Shop',
  description: 'Call Akron Tire Shop or request help with new tires, used tires, mounting, balancing, and repairs.',
};

export default function ContactPage() {
  return <AkronTireShop initialScreen="settings" />;
}
