import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button, Input } from '../../components/ui/DesignSystem';
import toast from 'react-hot-toast';

export const SimpleLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }

    setIsLoading(true);

    try {
      await login(email, password);
      
      // Redirect to intended page or dashboard
      const from = (location.state as any)?.from?.pathname || 
                   (email.includes('admin') ? '/admin/dashboard' : '/dashboard');
      navigate(from, { replace: true });
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-[#1e293b] rounded-2xl shadow-2xl p-8 border border-[#334155]">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-[#00C7D1] mb-2">Finaster</h1>
            <p className="text-[#94a3b8]">MLM Platform Login</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@finaster.com or user@finaster.com"
              required
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />

            <div className="bg-[#334155] border border-[#475569] rounded-lg p-4 text-sm">
              <p className="text-[#cbd5e1] font-medium mb-2">Test Accounts:</p>
              <p className="text-[#94a3b8]">Admin: <span className="text-[#00C7D1]">admin@finaster.com</span></p>
              <p className="text-[#94a3b8]">User: <span className="text-[#00C7D1]">user@finaster.com</span></p>
              <p className="text-[#94a3b8] mt-1 text-xs">Password: any</p>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SimpleLogin;
