import React from 'react';

const Header = ({ navigation, onNavigate }) => {
  return (
    <header>
      <h1>Climate Change Awareness App</h1>
      <nav>
        <ul>
          {navigation.map((item, index) => (
            <li key={index}>
              <a 
                href={item.link} 
                onClick={(e) => {
                  if (item.link !== '#features' && item.link !== '#guides' && item.link !== '#benefits') {
                    e.preventDefault();
                    onNavigate(item.label.toLowerCase());
                  }
                }}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
};

export default Header;
