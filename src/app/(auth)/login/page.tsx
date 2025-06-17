import { Metadata } from 'next';
import LoginForm from '@/components/auth/LoginForm';

export const metadata: Metadata = {
  title: 'Login - TeleDrive',
  description: 'Login to access your TeleDrive files',
};

export default function LoginPage() {
  return <LoginForm />;
} 