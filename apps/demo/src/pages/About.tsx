import React from 'react';
import { ContentComponent } from '@contentflow/sdk/react';

export function About() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-6">
        <ContentComponent
          contentId="about-title"
          pageId="about"
          defaultText="About ContentFlow CMS"
          as="span"
          data-content-id="about-title"
        />
      </h1>

      <div className="prose max-w-none">
        <p className="text-lg mb-4">
          <ContentComponent
            contentId="about-intro"
            pageId="about"
            defaultText="ContentFlow is a modern, framework-agnostic content management system designed for developers who want flexibility without complexity."
            as="span"
            data-content-id="about-intro"
          />
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4">
          <ContentComponent
            contentId="mission-title"
            pageId="about"
            defaultText="Our Mission"
            as="span"
            data-content-id="mission-title"
          />
        </h2>
        <p className="text-gray-700">
          <ContentComponent
            contentId="mission-description"
            pageId="about"
            defaultText="We believe content editing should be visual, intuitive, and accessible to non-technical users, while giving developers the freedom to build with their preferred tools."
            as="span"
            data-content-id="mission-description"
          />
        </p>
      </div>
    </div>
  );
}
