import { ContentComponent } from '@contentflow/sdk/react';
import WorldMap from '../components/WorldMap';

export default function CustomersPage() {
  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="py-24 md:py-40 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-normal text-gray-900 mb-10 leading-[1.1]">
            <ContentComponent
              contentId="customers-hero-title"
              defaultText="Trusted by Companies Worldwide"
              data-content-id="customers-hero-title"
            />
          </h1>
          <p className="text-lg md:text-xl text-gray-700 leading-relaxed max-w-4xl mx-auto">
            <ContentComponent
              contentId="customers-hero-subtitle"
              defaultText="From startups to enterprises, businesses across the globe rely on Customer Portal to deliver exceptional support experiences."
              data-content-id="customers-hero-subtitle"
            />
          </p>
        </div>
      </section>

      {/* Map Section - Full Bleed with D3 TopoJSON */}
      <section className="py-24 md:py-40 text-white" style={{ backgroundColor: '#151515' }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-16 text-center">
            <p className="text-yellow-400 text-sm font-medium mb-8 tracking-wide uppercase">
              <ContentComponent
                contentId="customers-map-label"
                defaultText="Where We Serve"
                data-content-id="customers-map-label"
              />
            </p>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-normal mb-12 leading-tight">
              <ContentComponent
                contentId="customers-map-title"
                defaultText="Powering businesses around the world"
                data-content-id="customers-map-title"
              />
            </h2>
            <p className="text-base md:text-lg text-gray-300 leading-relaxed max-w-3xl mx-auto">
              <ContentComponent
                contentId="customers-map-subtitle"
                defaultText="From San Francisco to Singapore, London to Sydney, businesses across the globe trust us to deliver exceptional customer experiences every single day."
                data-content-id="customers-map-subtitle"
              />
            </p>
          </div>
        </div>

        {/* Full-bleed World Map */}
        <div className="w-full">
          <WorldMap />
        </div>

        {/* Stats Grid */}
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mt-20 border-t border-gray-800 pt-16">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-normal text-yellow-400 mb-4">10K+</div>
              <p className="text-gray-400 text-sm md:text-base">Active Customers</p>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-normal text-yellow-400 mb-4">50+</div>
              <p className="text-gray-400 text-sm md:text-base">Countries</p>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-normal text-yellow-400 mb-4">98%</div>
              <p className="text-gray-400 text-sm md:text-base">Satisfaction Rate</p>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-normal text-yellow-400 mb-4">24/7</div>
              <p className="text-gray-400 text-sm md:text-base">Support Available</p>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Testimonials */}
      <section className="py-24 md:py-40 px-6 bg-white border-t border-gray-200">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-sm font-medium text-gray-500 mb-16 tracking-wide uppercase text-center">
            <ContentComponent
              contentId="customers-testimonials-label"
              defaultText="Customer Stories"
              data-content-id="customers-testimonials-label"
            />
          </h3>
          <h2 className="text-4xl md:text-5xl font-normal text-gray-900 mb-20 text-center max-w-3xl mx-auto leading-tight">
            <ContentComponent
              contentId="customers-testimonials-title"
              defaultText="Why teams choose us"
              data-content-id="customers-testimonials-title"
            />
          </h2>

          <div className="grid md:grid-cols-3 gap-12 md:gap-16">
            {/* Testimonial 1 */}
            <div className="space-y-6">
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                <ContentComponent
                  contentId="customers-testimonial1-text"
                  defaultText="Customer Portal transformed how we handle support. Response times dropped by 70% in the first month."
                  data-content-id="customers-testimonial1-text"
                />
              </p>
              <div className="pt-4 border-t border-gray-100">
                <p className="font-medium text-gray-900 mb-1">
                  <ContentComponent
                    contentId="customers-testimonial1-name"
                    defaultText="Sarah Chen"
                    data-content-id="customers-testimonial1-name"
                  />
                </p>
                <p className="text-sm text-gray-600">
                  <ContentComponent
                    contentId="customers-testimonial1-role"
                    defaultText="Head of Support, TechCorp"
                    data-content-id="customers-testimonial1-role"
                  />
                </p>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="space-y-6">
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                <ContentComponent
                  contentId="customers-testimonial2-text"
                  defaultText="The analytics dashboard alone is worth it. We finally understand what our customers need."
                  data-content-id="customers-testimonial2-text"
                />
              </p>
              <div className="pt-4 border-t border-gray-100">
                <p className="font-medium text-gray-900 mb-1">
                  <ContentComponent
                    contentId="customers-testimonial2-name"
                    defaultText="Michael Rodriguez"
                    data-content-id="customers-testimonial2-name"
                  />
                </p>
                <p className="text-sm text-gray-600">
                  <ContentComponent
                    contentId="customers-testimonial2-role"
                    defaultText="CTO, StartupXYZ"
                    data-content-id="customers-testimonial2-role"
                  />
                </p>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="space-y-6">
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map ((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                <ContentComponent
                  contentId="customers-testimonial3-text"
                  defaultText="Best investment we've made. Our customer satisfaction scores increased by 40% in 3 months."
                  data-content-id="customers-testimonial3-text"
                />
              </p>
              <div className="pt-4 border-t border-gray-100">
                <p className="font-medium text-gray-900 mb-1">
                  <ContentComponent
                    contentId="customers-testimonial3-name"
                    defaultText="Emma Thompson"
                    data-content-id="customers-testimonial3-name"
                  />
                </p>
                <p className="text-sm text-gray-600">
                  <ContentComponent
                    contentId="customers-testimonial3-role"
                    defaultText="VP Customer Success, Enterprise Co"
                    data-content-id="customers-testimonial3-role"
                  />
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 md:py-40 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-normal text-gray-900 mb-10 leading-tight">
            <ContentComponent
              contentId="customers-cta-title"
              defaultText="Join thousands of happy customers"
              data-content-id="customers-cta-title"
            />
          </h2>
          <p className="text-lg md:text-xl text-gray-700 mb-12 leading-relaxed max-w-2xl mx-auto">
            <ContentComponent
              contentId="customers-cta-subtitle"
              defaultText="Start delivering exceptional customer experiences today"
              data-content-id="customers-cta-subtitle"
            />
          </p>
          <button className="px-10 py-4 bg-yellow-400 text-gray-900 rounded-full text-base font-semibold hover:bg-yellow-300 transition-all hover:scale-105 shadow-lg">
            <ContentComponent
              contentId="customers-cta-button"
              defaultText="Get Started Free"
              data-content-id="customers-cta-button"
            />
          </button>
        </div>
      </section>
    </div>
  );
}
