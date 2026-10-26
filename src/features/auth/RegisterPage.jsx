import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';
import AuthShell from './AuthShell';

// Sign-up form. The input checks here are for comfort; the API validates again.
const RegisterPage = () => {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Already logged in: nothing to do here.
  if (user) return <Navigate to="/dashboard" replace />;

  // One change handler for every field.
  const update = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register(form); // the API logs you in straight away
      navigate(location.state?.from ?? '/dashboard', { replace: true });
    } catch (err) {
      setError(err.message); // e.g. "That email is already registered"
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Create an account"
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" state={location.state} className="font-semibold text-sprout underline">Log in</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col">
          <span className="label">Name</span>
          <input
            autoComplete="name"
            required
            maxLength={60}
            value={form.name}
            onChange={update('name')}
            className="input"
          />
        </label>
        <label className="flex flex-col">
          <span className="label">Email</span>
          <input
            type="email"
            autoComplete="email"
            required
            value={form.email}
            onChange={update('email')}
            className="input"
          />
        </label>
        <label className="flex flex-col">
          <span className="label">Password</span>
          <input
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            aria-describedby="password-hint"
            value={form.password}
            onChange={update('password')}
            className="input"
          />
        </label>
        <p id="password-hint" className="-mt-2 text-xs">
          At least 8 characters.
        </p>
        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}
        <button type="submit" disabled={submitting} className="btn mt-1">
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </AuthShell>
  );
};

export default RegisterPage;
