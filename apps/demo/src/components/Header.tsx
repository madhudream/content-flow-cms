import React from 'react';
import { Link } from 'react-router-dom';
import { ContentComponent } from '@contentflow/sdk/react';

export function Header() {
  return (
    <header className="bg-blue-600 text-white shadow-md">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">
            <ContentComponent
              contentId="site-title"
              pageId="home"
              defaultText="Demo App"
              as="span"
              data-content-id="site-title"
            />
          </h1>
          <ul className="flex space-x-6">
            <li>
              <Link to="/" className="hover:underline">
                Home
              </Link>
            </li>
            <li>
              <Link to="/about" className="hover:underline">
                About
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:underline">
                Contact
              </Link>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  );
}
