import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import * as impersonateService from '../services/admin-impersonate.service';

const ImpersonationBanner: React.FC = () => {
  const navigate = useNavigate();
  const { checkAuth } = useAuth();
  const [impersonationStatus, setImpersonationStatus] = useState(
    impersonateService.getImpersonationStatus()
  );

  useEffect(() => {
    // Check impersonation status on mount
    const status = impersonateService.getImpersonationStatus();
    setImpersonationStatus(status);
  }, []);

  const handleStopImpersonation = async () => {
    if (!confirm('Stop impersonating and return to admin view?')) {
      return;
    }

    const toastId = toast.loading('Returning to admin view...');

    try {
      const result = await impersonateService.stopImpersonation();

      if (result.success) {
        toast.success('Returned to admin view', { id: toastId });

        // Update auth context to reflect admin state and navigate smoothly
        await checkAuth();

        setTimeout(() => {
          navigate('/admin/users');
        }, 300);
      } else {
        toast.error('Failed to stop impersonation', { id: toastId });
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to stop impersonation', { id: toastId });
    }
  };

  if (!impersonationStatus.isImpersonating) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-xl">🎭</span>
            <div>
              <p className="font-bold text-sm">
                Impersonating User
              </p>
              <p className="text-xs opacity-90">
                Viewing as: {impersonationStatus.targetUserEmail}
              </p>
            </div>
          </div>

          <button
            onClick={handleStopImpersonation}
            className="px-4 py-2 bg-white text-orange-600 rounded-lg font-medium hover:bg-gray-100 transition-colors text-sm flex items-center space-x-2"
          >
            <span>🔙</span>
            <span>Exit Impersonation</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImpersonationBanner;
