import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';

// PLACEHOLDER login form. It just takes a name and calls the stub login().
// Swap the form for your provider's sign-in UI when auth is chosen.
const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [name, setName] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    await login({ name });
    navigate(location.state?.from ?? '/dashboard', { replace: true });
  };

  return (
    <main className="max-w-sm mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Log in</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col">
          <span className="text-sm font-semibold mb-1">Name</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="border rounded p-2"
          />
        </label>
        <button type="submit" className="bg-green-600 text-white font-semibold rounded px-4 py-2">
          Log in
        </button>
      </form>
    </main>
  );
};

export default LoginPage;
