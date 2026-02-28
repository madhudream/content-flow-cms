import React from 'react';
import { ContentComponent } from '@contentflow/sdk/react';

export function Contact() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-6">
        <ContentComponent
          contentId="contact-title"
          pageId="contact"
          defaultText="Get in Touch"
          as="span"
          data-content-id="contact-title"
        />
      </h1>

      <p className="text-lg mb-8">
        <ContentComponent
          contentId="contact-intro"
          pageId="contact"
          defaultText="Have questions? We'd love to hear from you."
          as="span"
          data-content-id="contact-intro"
        />
      </p>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-xl font-bold mb-4">
            <ContentComponent
              contentId="email-title"
              pageId="contact"
              defaultText="Email Us"
              as="span"
              data-content-id="email-title"
            />
          </h3>
          <p className="text-gray-700">
            <ContentComponent
              contentId="email-address"
              pageId="contact"
              defaultText="hello@contentflow.com"
              as="span"
              data-content-id="email-address"
            />
          </p>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-4">
            <ContentComponent
              contentId="support-title"
              pageId="contact"
              defaultText="Support"
              as="span"
              data-content-id="support-title"
            />
          </h3>
          <p className="text-gray-700">
            <ContentComponent
              contentId="support-description"
              pageId="contact"
              defaultText="Visit our documentation or open an issue on GitHub"
              as="span"
              data-content-id="support-description"
            />
          </p>
        </div>
      </div>
    </div>
  );
}
