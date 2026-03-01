import { Link } from 'react-router-dom';
import { ContentComponent } from '@contentflow/sdk/react';

export function Header() {
  const openInNewTab = () => {
    window.open(window.location.href, '_blank', 'noopener,noreferrer');
  };

  return (
    <header className="bg-blue-600 text-white shadow-md">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">
            <ContentComponent
              contentId="site-title"
              pageId="home"
              defaultText="Business Solutions"
              as="span"
              data-content-id="site-title"
            />
          </h1>
          <div className="flex items-center gap-6">
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
            <button
              onClick={openInNewTab}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-all duration-200 text-sm font-medium"
              title="Open in new tab"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <span>Open</span>
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
}
