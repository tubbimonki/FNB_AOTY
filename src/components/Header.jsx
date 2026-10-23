import React from 'react';
import { Link } from 'react-router-dom';

const Header = ({ navigation, onNavigate }) => {
  return (
    <header>
      <h1>Climate Change Awareness App</h1>
      <nav>
        <ul>
          {navigation.map((item, index) => (
            <li key={index}>
              <Link to={'/' + item.link}>{item.label}</Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
};

export default Header;
