// ─────────────────────────────────────────────────────────────────────────
// YOUR TURN: task 3 in the auth notes doc.
//
// Build the sign-up form. LoginPage.jsx next door is the closest example;
// read it first, then make this your own (and style it however you like).
//
// It needs:
//   - three inputs with visible labels: "Name", "Email", "Password"
//     (the tests find them by label text)
//   - a submit button named "Create account"
//   - on submit: call register({ name, email, password }) from useAuth(),
//     then navigate to location.state?.from ?? '/dashboard'
//   - register() throws an ApiError when the API says no (email taken,
//     password too short...). Show error.message in an element with
//     role="alert" so the user knows what to fix.
//   - a link back to /login for people who already have an account
//
// Worth adding once it works: minLength={8} on the password input,
// autoComplete="new-password" (password managers then offer a strong one),
// and disabling the button while the request is in flight.
//
// Why validate in the form AND on the server? The form is for comfort; the
// server is the one that can't be skipped.
//
// Tests: src/features/auth/RegisterPage.test.jsx. Remove `.skip` from it.
// ─────────────────────────────────────────────────────────────────────────

const RegisterPage = () => (
  <main className="max-w-sm mx-auto p-6">
    <h2 className="text-2xl font-bold mb-4">Create an account</h2>
    <p>Sign-up form coming soon (task 3).</p>
  </main>
);

export default RegisterPage;
