import React from 'react';
import { ContentComponent } from '@contentflow/sdk/react';

export function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-4">
          <ContentComponent
            contentId="hero-title"
            pageId="home"
            defaultText="Welcome to ContentFlow"
            as="span"
            data-content-id="hero-title"
          />
        </h1>
        <p className="text-xl text-gray-600 mb-6">
          <ContentComponent
            contentId="hero-subtitle"
            pageId="home"
            defaultText="Edit content without code"
            as="span"
            data-content-id="hero-subtitle"
          />
        </p>
        
        {/* Hero Image */}
        <div className="mb-8 flex justify-center">
          <ContentComponent
            contentId="hero-image"
            pageId="home"
            type="image"
            defaultSrc="https://via.placeholder.com/800x400/3B82F6/FFFFFF?text=ContentFlow+CMS"
            alt="ContentFlow Hero"
            className="rounded-lg shadow-lg max-w-3xl w-full"
            data-content-id="hero-image"
          />
        </div>
        
        <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700">
          <ContentComponent
            contentId="cta-button"
            pageId="home"
            defaultText="Get Started"
            as="span"
            data-content-id="cta-button"
          />
        </button>
      </section>

      {/* Features Section */}
      <section className="grid md:grid-cols-3 gap-8 mb-12">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-bold mb-3">
            <ContentComponent
              contentId="feature-1-title"
              pageId="home"
              defaultText="Framework Agnostic"
              as="span"
              data-content-id="feature-1-title"
            />
          </h3>
          <p className="text-gray-600">
            <ContentComponent
              contentId="feature-1-description"
              pageId="home"
              defaultText="Works with React, Angular, and vanilla JavaScript"
              as="span"
              data-content-id="feature-1-description"
            />
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-bold mb-3">
            <ContentComponent
              contentId="feature-2-title"
              pageId="home"
              defaultText="Visual Editing"
              as="span"
              data-content-id="feature-2-title"
            />
          </h3>
          <p className="text-gray-600">
            <ContentComponent
              contentId="feature-2-description"
              pageId="home"
              defaultText="Edit content directly in the CMS with live preview"
              as="span"
              data-content-id="feature-2-description"
            />
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-bold mb-3">
            <ContentComponent
              contentId="feature-3-title"
              pageId="home"
              defaultText="Multi-Language"
              as="span"
              data-content-id="feature-3-title"
            />
          </h3>
          <p className="text-gray-600">
            <ContentComponent
              contentId="feature-3-description"
              pageId="home"
              defaultText="Manage content for multiple locales effortlessly"
              as="span"
              data-content-id="feature-3-description"
            />
          </p>
        </div>
      </section>
    </div>
  );
}
