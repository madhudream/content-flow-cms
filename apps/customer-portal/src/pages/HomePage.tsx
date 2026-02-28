import { ContentComponent } from '@contentflow/sdk/react';

export default function HomePage() {
  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-6 py-24 md:py-32">
          <div className="max-w-3xl">
            <ContentComponent
              contentId="home-hero-title"
              defaultText="Empowering businesses with exceptional support"
              data-content-id="home-hero-title"
              className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6 animate-[fadeIn_0.6s_ease-out]"
            />
            <ContentComponent
              contentId="home-hero-subtitle"
              defaultText="We help companies scale their customer success operations with world-class support infrastructure and dedicated account management."
              data-content-id="home-hero-subtitle"
              className="text-xl text-gray-600 leading-relaxed mb-10 animate-[fadeIn_0.6s_ease-out_0.2s] opacity-0 [animation-fill-mode:forwards]"
            />
            <div className="flex gap-4 animate-[fadeIn_0.6s_ease-out_0.4s] opacity-0 [animation-fill-mode:forwards]">
              <button className="px-8 py-4 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors shadow-sm hover:shadow-md">
                <ContentComponent
                  contentId="home-cta-primary"
                  defaultText="Get Started"
                  data-content-id="home-cta-primary"
                />
              </button>
              <button className="px-8 py-4 bg-white text-gray-900 rounded-xl font-semibold border-2 border-gray-200 hover:border-gray-300 transition-colors">
                <ContentComponent
                  contentId="home-cta-secondary"
                  defaultText="Learn More"
                  data-content-id="home-cta-secondary"
                />
              </button>
            </div>
          </div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-10">
          <div className="absolute top-20 right-20 w-64 h-64 bg-indigo-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-40 w-96 h-96 bg-purple-500 rounded-full blur-3xl"></div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <ContentComponent
              contentId="home-features-title"
              defaultText="Built for scale, designed for simplicity"
              data-content-id="home-features-title"
              className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
            />
            <ContentComponent
              contentId="home-features-subtitle"
              defaultText="Everything you need to deliver exceptional customer experiences"
              data-content-id="home-features-subtitle"
              className="text-lg text-gray-600"
            />
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group p-8 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-all duration-300 hover:shadow-lg">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <ContentComponent
                contentId="home-feature1-title"
                defaultText="Lightning Fast"
                data-content-id="home-feature1-title"
                className="text-xl font-semibold text-gray-900 mb-3"
              />
              <ContentComponent
                contentId="home-feature1-desc"
                defaultText="Respond to customer inquiries in milliseconds with our optimized infrastructure."
                data-content-id="home-feature1-desc"
                className="text-gray-600 leading-relaxed"
              />
            </div>

            {/* Feature 2 */}
            <div className="group p-8 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-all duration-300 hover:shadow-lg">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <ContentComponent
                contentId="home-feature2-title"
                defaultText="Secure & Compliant"
                data-content-id="home-feature2-title"
                className="text-xl font-semibold text-gray-900 mb-3"
              />
              <ContentComponent
                contentId="home-feature2-desc"
                defaultText="Enterprise-grade security with SOC 2 Type II and GDPR compliance out of the box."
                data-content-id="home-feature2-desc"
                className="text-gray-600 leading-relaxed"
              />
            </div>

            {/* Feature 3 */}
            <div className="group p-8 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-all duration-300 hover:shadow-lg">
              <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <ContentComponent
                contentId="home-feature3-title"
                defaultText="Real-time Analytics"
                data-content-id="home-feature3-title"
                className="text-xl font-semibold text-gray-900 mb-3"
              />
              <ContentComponent
                contentId="home-feature3-desc"
                defaultText="Track performance metrics and customer satisfaction in real-time with beautiful dashboards."
                data-content-id="home-feature3-desc"
                className="text-gray-600 leading-relaxed"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <ContentComponent
                contentId="home-stat1-number"
                defaultText="10,000+"
                data-content-id="home-stat1-number"
                className="text-4xl font-bold text-gray-900 mb-2"
              />
              <ContentComponent
                contentId="home-stat1-label"
                defaultText="Happy Customers"
                data-content-id="home-stat1-label"
                className="text-gray-600"
              />
            </div>
            <div className="text-center">
              <ContentComponent
                contentId="home-stat2-number"
                defaultText="99.9%"
                data-content-id="home-stat2-number"
                className="text-4xl font-bold text-gray-900 mb-2"
              />
              <ContentComponent
                contentId="home-stat2-label"
                defaultText="Uptime SLA"
                data-content-id="home-stat2-label"
                className="text-gray-600"
              />
            </div>
            <div className="text-center">
              <ContentComponent
                contentId="home-stat3-number"
                defaultText="<2min"
                data-content-id="home-stat3-number"
                className="text-4xl font-bold text-gray-900 mb-2"
              />
              <ContentComponent
                contentId="home-stat3-label"
                defaultText="Avg Response Time"
                data-content-id="home-stat3-label"
                className="text-gray-600"
              />
            </div>
            <div className="text-center">
              <ContentComponent
                contentId="home-stat4-number"
                defaultText="50+"
                data-content-id="home-stat4-number"
                className="text-4xl font-bold text-gray-900 mb-2"
              />
              <ContentComponent
                contentId="home-stat4-label"
                defaultText="Countries Served"
                data-content-id="home-stat4-label"
                className="text-gray-600"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
