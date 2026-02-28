import { ContentComponent } from '@contentflow/sdk/react';

export default function AboutPage() {
  return (
    <div className="pt-20 bg-white">
      {/* Hero Section */}
      <section className="py-24 md:py-40 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-normal text-gray-900 mb-10 leading-[1.1]">
            <ContentComponent
              contentId="about-hero-title"
              defaultText="What would be possible if exceptional customer support were accessible to all?"
              data-content-id="about-hero-title"
            />
          </h1>
          <p className="text-lg md:text-xl text-gray-700 leading-relaxed max-w-4xl">
            <ContentComponent
              contentId="about-hero-subtitle"
              defaultText="Our mission is to accelerate business growth through intelligent support operations. Grounded in the realities of customer service workflows and driven by thoughtful innovation, Customer Portal helps businesses operate efficiently and delight their customers."
              data-content-id="about-hero-subtitle"
            />
          </p>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-24 md:py-40 px-6 bg-white border-t border-gray-200">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-sm font-medium text-gray-500 mb-8 tracking-wide">
            <ContentComponent
              contentId="about-story-label"
              defaultText="Solving a universal problem"
              data-content-id="about-story-label"
            />
          </h3>
          <div className="space-y-8">
            <p className="text-base md:text-lg text-gray-700 leading-relaxed">
              <ContentComponent
                contentId="about-story-p1"
                defaultText="Each business depends on excellent customer support. It underpins satisfaction for customers and informs the decisions that shape companies. Yet most businesses never receive meaningful operational insights because support teams are overwhelmed by mundane, time consuming tasks. Companies face the same pressures. Instead of using support as a strategic asset, they get pulled into administrative work that drains focus and limits growth."
                data-content-id="about-story-p1"
              />
            </p>
            <p className="text-base md:text-lg text-gray-700 leading-relaxed">
              <ContentComponent
                contentId="about-story-p2"
                defaultText="Customer Portal exists to change that dynamic. When support teams can work with speed and precision, the benefits extend across the entire business. We make that possible by automating the busywork so teams can redirect their time and expertise toward high value customer relationships."
                data-content-id="about-story-p2"
              />
            </p>
          </div>
        </div>
      </section>

      {/* Secondary Story Section */}
      <section className="py-24 md:py-40 px-6 bg-white border-t border-gray-200">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-sm font-medium text-gray-500 mb-8 tracking-wide">
            <ContentComponent
              contentId="about-mission-label"
              defaultText="Redefining the future of customer operations"
              data-content-id="about-mission-label"
            />
          </h3>
          <div className="space-y-8">
            <p className="text-base md:text-lg text-gray-700 leading-relaxed">
              <ContentComponent
                contentId="about-story-p3"
                defaultText="Customer service is entering a major transformation, and support operations is one of the toughest real world domains for applied AI. The work involves messy, inconsistent customer data, complex workflows, and countless edge cases that span many conditional steps."
                data-content-id="about-story-p3"
              />
            </p>
            <p className="text-base md:text-lg text-gray-700 leading-relaxed">
              <ContentComponent
                contentId="about-story-p4"
                defaultText="Solving these problems requires building systems that can adapt through real-world constraints, plan multistep workflows, and execute reliably at scale. We're committed to this challenge because we believe exceptional support should be accessible to every business, not just those with massive teams or budgets."
                data-content-id="about-story-p4"
              />
            </p>
          </div>
        </div>
      </section>

      {/* Team Section - Dark Background like Accrual */}
      <section className="py-24 md:py-40 px-6 bg-gray-900 text-white">
        <div className="max-w-5xl mx-auto">
          <p className="text-yellow-400 text-sm font-medium mb-8 tracking-wide">
            <ContentComponent
              contentId="about-team-label"
              defaultText="Build with us"
              data-content-id="about-team-label"
            />
          </p>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-normal mb-12 leading-tight max-w-4xl">
            <ContentComponent
              contentId="about-team-title"
              defaultText="We're a remote team spread across the globe."
              data-content-id="about-team-title"
            />
          </h2>
          <div className="space-y-8 max-w-4xl">
            <p className="text-base md:text-lg text-gray-300 leading-relaxed">
              <ContentComponent
                contentId="about-team-p1"
                defaultText="The entire company comes together several times a year and we often gather in smaller groups when high bandwidth collaboration helps. We know everyone works differently, so we offer people the flexibility to work in the way that helps them move quickly and think clearly."
                data-content-id="about-team-p1"
              />
            </p>
            <p className="text-base md:text-lg text-gray-300 leading-relaxed">
              <ContentComponent
                contentId="about-team-p2"
                defaultText="As part of a small team, you'll have real ownership across the stack. You won't just ship features here. Every interaction with a customer and every change you ship directly shapes how businesses operate. You'll work closely with business leaders to understand their needs, introduce new technologies, reshape workflows, and unlock growth they couldn't reach before."
                data-content-id="about-team-p2"
              />
            </p>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24 md:py-40 px-6 bg-white border-t border-gray-200">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-sm font-medium text-gray-500 mb-16 tracking-wide">
            <ContentComponent
              contentId="about-values-label"
              defaultText="Our principles"
              data-content-id="about-values-label"
            />
          </h3>
          
          <div className="space-y-20">
            {/* Value 1 */}
            <div className="max-w-3xl">
              <h4 className="text-3xl md:text-4xl font-normal text-gray-900 mb-6">
                <ContentComponent
                  contentId="about-value1-title"
                  defaultText="Customer First"
                  data-content-id="about-value1-title"
                />
              </h4>
              <p className="text-base md:text-lg text-gray-600 leading-relaxed">
                <ContentComponent
                  contentId="about-value1-desc"
                  defaultText="Every decision we make starts with one question: How does this help our customers succeed?"
                  data-content-id="about-value1-desc"
                />
              </p>
            </div>

            {/* Value 2 */}
            <div className="max-w-3xl">
              <h4 className="text-3xl md:text-4xl font-normal text-gray-900 mb-6">
                <ContentComponent
                  contentId="about-value2-title"
                  defaultText="Move Fast"
                  data-content-id="about-value2-title"
                />
              </h4>
              <p className="text-base md:text-lg text-gray-600 leading-relaxed">
                <ContentComponent
                  contentId="about-value2-desc"
                  defaultText="Speed matters. We ship early and often, learning and iterating based on real-world feedback."
                  data-content-id="about-value2-desc"
                />
              </p>
            </div>

            {/* Value 3 */}
            <div className="max-w-3xl">
              <h4 className="text-3xl md:text-4xl font-normal text-gray-900 mb-6">
                <ContentComponent
                  contentId="about-value3-title"
                  defaultText="Radical Transparency"
                  data-content-id="about-value3-title"
                />
              </h4>
              <p className="text-base md:text-lg text-gray-600 leading-relaxed">
                <ContentComponent
                  contentId="about-value3-desc"
                  defaultText="We believe in open communication, both internally and with our customers. No surprises, no hidden agendas."
                  data-content-id="about-value3-desc"
                />
              </p>
            </div>

            {/* Value 4 */}
            <div className="max-w-3xl">
              <h4 className="text-3xl md:text-4xl font-normal text-gray-900 mb-6">
                <ContentComponent
                  contentId="about-value4-title"
                  defaultText="Embrace Simplicity"
                  data-content-id="about-value4-title"
                />
              </h4>
              <p className="text-base md:text-lg text-gray-600 leading-relaxed">
                <ContentComponent
                  contentId="about-value4-desc"
                  defaultText="Complexity is the enemy of execution. We strive to make everything we build simple and intuitive."
                  data-content-id="about-value4-desc"
                />
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
