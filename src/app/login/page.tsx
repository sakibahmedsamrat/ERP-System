'use client'

import { useFormState, useFormStatus } from 'react-dom';
import { loginAction } from './actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button 
      type="submit" 
      disabled={pending}
      className="w-full bg-blue-600 text-white p-3 rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50"
    >
      {pending ? 'Logging in...' : 'Login'}
    </button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useFormState(loginAction, null);
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'HR Module';

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gray-900 p-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">{appName}</h1>
          <p className="text-gray-400">Sign in to continue</p>
        </div>
        
        <div className="p-8">
          {state?.error && (
            <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm font-medium border border-red-100">
              {state.error}
            </div>
          )}

          <div className="bg-blue-50 text-blue-800 p-4 rounded-lg mb-6 text-sm">
            <p className="font-bold mb-1">First time setup?</p>
            <p>Use default credentials to login:</p>
            <p className="font-mono mt-1">User ID: admin</p>
            <p className="font-mono">Pass: admin123</p>
          </div>

          <form action={formAction} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
              <input 
                type="text" 
                name="userId"
                required 
                className="w-full border border-gray-300 rounded p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Enter User ID"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input 
                type="password" 
                name="password"
                required 
                className="w-full border border-gray-300 rounded p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="••••••••"
              />
            </div>

            <SubmitButton />
          </form>
        </div>
      </div>
    </div>
  );
}
