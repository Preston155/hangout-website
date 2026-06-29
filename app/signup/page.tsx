import { AuthForm } from '@/components/auth-form';

export default function Signup() {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-12">
      <AuthForm mode="signup" />
    </main>
  );
}