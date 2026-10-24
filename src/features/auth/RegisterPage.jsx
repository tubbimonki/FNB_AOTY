import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';

// Sign-up form. Same pattern as LoginPage: a controlled form (inputs live in
// state), preventDefault on submit, call the API through useAuth(), and show
// the server's message if it says no. The minLength/type checks here are for
// comfort only; the API validates again because forms can be skipped.
const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // One change handler for every field: update('email') returns a handler
  // that copies the form and replaces just that field.
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
    <main className="max-w-sm mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Create an account</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col">
          <span className="text-sm font-semibold mb-1">Name</span>
          <input
            autoComplete="name"
            required
            maxLength={60}
            value={form.name}
            onChange={update('name')}
            className="border rounded p-2"
          />
        </label>
        <label className="flex flex-col">
          <span className="text-sm font-semibold mb-1">Email</span>
          <input
            type="email"
            autoComplete="email"
            required
            value={form.email}
            onChange={update('email')}
            className="border rounded p-2"
          />
        </label>
        <label className="flex flex-col">
          <span className="text-sm font-semibold mb-1">Password</span>
          <input
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            aria-describedby="password-hint"
            value={form.password}
            onChange={update('password')}
            className="border rounded p-2"
          />
        </label>
        <p id="password-hint" className="text-xs -mt-2">
          At least 8 characters.
        </p>
        {error && (
          <p role="alert" className="text-red-700 text-sm">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="bg-green-600 text-white font-semibold rounded px-4 py-2 disabled:opacity-60"
        >
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <p className="mt-4 text-sm">
        Already have an account?{' '}
        <Link to="/login" state={location.state} className="underline">
          Log in
        </Link>
      </p>
    </main>
  );
};

export default RegisterPage;
