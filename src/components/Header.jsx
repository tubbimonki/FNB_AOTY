import { Link } from 'react-router-dom';
import { useAuth } from '../features/auth/useAuth';

const Header = ({ navigation }) => {
  const { user, logout } = useAuth();

  return (
    <header className="mb-8">
      <h1 className="text-2xl font-bold text-blue-600">Climate Change Awareness App</h1>
      <nav>
        <ul className="flex flex-wrap gap-4 mt-2">
          {navigation.map((item) => (
            <li key={item.link}>
              <Link to={item.link} className="hover:underline">{item.label}</Link>
            </li>
          ))}
          <li>
            {user ? (
              <button onClick={logout} className="hover:underline">Log out ({user.name})</button>
            ) : (
              <Link to="/login" className="hover:underline">Log in</Link>
            )}
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;
