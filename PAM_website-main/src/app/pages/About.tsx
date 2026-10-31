import { LeadershipCard, RegistrationCard } from "../components/ContentCards";
import { useWebsiteContent } from "../portal/content";
import { Link } from "react-router";
import {
  ArrowRight,
  Target,
  Eye,
  Award,
  Users,
  Clock,
  Shield,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

const values = [
  {
    icon: Award,
    title: "Excellence",
    description:
      "We are committed to delivering the highest quality workmanship in every project we undertake.",
  },
  {
    icon: Users,
    title: "Collaboration",
    description:
      "We work closely with our clients, listening to their needs and exceeding their expectations.",
  },
  {
    icon: Clock,
    title: "Reliability",
    description:
      "We respect your time and deliver projects on schedule without compromising quality.",
  },
  {
    icon: Shield,
    title: "Integrity",
    description:
      "We build trust through transparent communication, honest pricing, and ethical practices.",
  },
];

export function About() {
  const { content } = useWebsiteContent();
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-orange-600 to-orange-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl mb-6">About PAM Builders</h1>
          <p className="text-xl text-orange-100 max-w-3xl mx-auto">
            Building trust and excellence in construction since 2025
          </p>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl mb-6">Our Story</h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  PAM Builders Construction Corp is a general contractor and
                  construction management company. We specialize in providing
                  our clients with the most economical construction solutions
                  for all kinds of projects by using our wide range of
                  prefabricated building elements along with our best solutions
                  for traditional construction. Our expertise spans a wide
                  range, from pre-construction services to complete turn-key
                  construction projects.
                </p>
                <p>
                  Integrity, quality and innovation are the characteristics that
                  distinguish PAM Builders Construction Corp as a leading
                  construction company in Philippines.
                </p>
              </div>
            </div>
            <div className="relative h-[500px] rounded-lg overflow-hidden shadow-xl">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1758798349125-5c297b18b8b2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25zdHJ1Y3Rpb24lMjB0ZWFtJTIwd29ya2Vyc3xlbnwxfHx8fDE3NzUzODYwMzN8MA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Construction team"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-t-4 border-t-orange-600">
              <CardContent className="p-8">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 text-orange-600 rounded-lg mb-4">
                  <Target className="h-6 w-6" />
                </div>
                <h2 className="text-3xl mb-4">Our Mission</h2>
                <p className="text-gray-600 text-lg">
                  PAM Builders aims to become the leading construction firm that
                  is known to deliver projects that are on par with
                  international standards and provide exceptional client
                  satisfaction. We are committed to delivering exceptional value
                  and innovative construction solutions to meet our clients'
                  requirements and unique preferences. By embracing modern
                  principles and sophisticated technologies, we ensure reliable
                  performance, time delivery, and lasting results. PAM Builders
                  envisions being the primary preference at all times nationally
                  and globally, for their renowned excellence, quality,
                  performance, and reliability in all types of construction.
                </p>
              </CardContent>
            </Card>

            <Card className="border-t-4 border-t-orange-600">
              <CardContent className="p-8">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 text-orange-600 rounded-lg mb-4">
                  <Eye className="h-6 w-6" />
                </div>
                <h2 className="text-3xl mb-4">Our Vision</h2>
                <p className="text-gray-600 text-lg">
                  To become the leading construction firm, while delivering
                  projects that consistently exceed international standards and
                  provide exceptional customer satisfaction. To continually
                  deliver excellent value and innovative construction solutions
                  to meet our clients’ requirements. Using modern principles and
                  sophisticated technologies, PAM Builders envisions being the
                  primary preference at all times nationally and globally, for
                  their renowned excellence, quality, performance, and
                  reliability in all types of construction.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl mb-4">Our Core Values</h2>
            <p className="text-xl text-gray-600">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <Card
                key={index}
                className="text-center hover:shadow-lg transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 text-orange-600 rounded-full mb-4">
                    <value.icon className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{value.title}</h3>
                  <p className="text-gray-600">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Leadership Team */}
      {content.leadership.length > 0 && (
        <section className="bg-gray-50 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl mb-4">Our Leadership Team</h2>
              <p className="text-xl text-gray-600">
                Experienced professionals dedicated to your success
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-8">
              {content.leadership.map((member) => (
                <div key={member.id} className="w-full max-w-sm">
                  <LeadershipCard member={member} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4">
          <RegistrationCard url={content.birUrl} />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-orange-600 to-orange-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl mb-6">Ready to Work With Us?</h2>
          <p className="text-xl text-orange-100 mb-8">
            Let's discuss how we can bring your construction project to life
          </p>
          <Link to="/contact">
            <Button
              size="lg"
              variant="outline"
              className="bg-white text-orange-600 hover:bg-gray-100 border-white"
            >
              Get in Touch
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
