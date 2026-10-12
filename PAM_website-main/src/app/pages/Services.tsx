import { Link } from "react-router";
import { ArrowRight, Building2, Home as HomeIcon, Hammer, Wrench, PaintBucket, Zap } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

const services = [
  {
    title: "Design and Build",
    description: "Full-service design and build projects — we take your concept through design, permitting, and construction for a single streamlined delivery.",
    icon: Building2,
    features: ["Turnkey Project Delivery", "Design-Build Contracts", "Permitting & Approvals", "Single Point of Contact"],
    image: "https://images.unsplash.com/photo-1707655536176-a2bc5e00cba9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  },
  {
    title: "Building Plans",
    description: "Professional building plans and architectural drawings prepared to local code standards, ready for permit submission.",
    icon: HomeIcon,
    features: ["Schematic Design", "Construction Documents", "Permit-Ready Drawings", "3D Visualizations"],
    image: "https://images.unsplash.com/photo-1773558048595-0eb9c121f119?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  },
  {
    title: "General Construction",
    description: "Comprehensive construction services for residential and commercial projects with experienced project management and crews.",
    icon: Wrench,
    features: ["Site Management", "Structural Work", "Finishing & Fit-Outs", "Subcontractor Coordination"],
    image: "https://images.unsplash.com/photo-1677324574457-645566fea332?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  },
  {
    title: "Fit-outs Construction",
    description: "Interior fit-outs for offices, retail, and hospitality — delivering build-outs that meet brand and operational needs.",
    icon: Hammer,
    features: ["Tenant Improvements", "M&E Coordination", "FF&E Installation", "Fast Turnarounds"],
    image: "https://images.unsplash.com/photo-1772567732969-c1506edf80a0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  },
  {
    title: "Masonry Works",
    description: "Skilled masonry services including block, brick, and stonework for structural and decorative applications.",
    icon: Wrench,
    features: ["Brick & Block Work", "Stone Cladding", "Restoration & Repointing", "Structural Masonry"],
    image: "https://images.unsplash.com/photo-1523413651479-597eb2da0ad6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  },
  {
    title: "Tiling Works",
    description: "High-quality tiling for floors, walls, bathrooms, and kitchens with careful substrate preparation and waterproofing where required.",
    icon: PaintBucket,
    features: ["Floor & Wall Tiling", "Shower & Wet-Area Tiling", "Pattern & Mosaic Work", "Substrate Preparation"],
    image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  },
  {
    title: "Painting and Waterproofing",
    description: "Interior and exterior painting plus waterproofing solutions to protect and finish your surfaces professionally.",
    icon: PaintBucket,
    features: ["Interior & Exterior Painting", "Protective Coatings", "Roof & Balcony Waterproofing", "Surface Preparation"],
    image: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  },
  {
    title: "Renovation",
    description: "Comprehensive renovation and remodeling services — from minor upgrades to complete home and commercial overhauls.",
    icon: Hammer,
    features: ["Kitchen & Bathroom Remodels", "Structural Alterations", "Interior Upgrades", "Historic Restoration"],
    image: "https://images.unsplash.com/photo-1770838773417-08b18661c62f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  },
];

export function Services() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-orange-600 to-orange-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl mb-6">Our Services</h1>
          <p className="text-xl text-orange-100 max-w-3xl mx-auto">
            Comprehensive construction solutions delivered by experienced professionals.
            From concept to completion, we handle every aspect of your project.
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-16">
            {services.map((service, index) => (
              <div
                key={index}
                className={`grid md:grid-cols-2 gap-8 items-center ${
                  index % 2 === 1 ? "md:flex-row-reverse" : ""
                }`}
              >
                <div className={index % 2 === 1 ? "md:order-2" : ""}>
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 text-orange-600 rounded-lg mb-4">
                    <service.icon className="h-6 w-6" />
                  </div>
                  <h2 className="text-3xl mb-4">{service.title}</h2>
                  <p className="text-lg text-gray-600 mb-6">
                    {service.description}
                  </p>
                  <ul className="space-y-3 mb-8">
                    {service.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-orange-600 rounded-full"></div>
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to="/contact">
                    <Button className="bg-orange-600 hover:bg-orange-700">
                      Request a Quote
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
                <div className={`relative h-[400px] rounded-lg overflow-hidden shadow-xl ${index % 2 === 1 ? "md:order-1" : ""}`}>
                  <ImageWithFallback
                    src={service.image}
                    alt={service.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl mb-4">Our Process</h2>
            <p className="text-xl text-gray-600">
              A streamlined approach to ensure your project's success
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                title: "Consultation",
                description: "We meet to discuss your vision, budget, and timeline",
              },
              {
                step: "02",
                title: "Planning & Design",
                description: "Our team creates detailed plans and specifications",
              },
              {
                step: "03",
                title: "Construction",
                description: "Skilled professionals bring your project to life",
              },
              {
                step: "04",
                title: "Final Walkthrough",
                description: "We ensure every detail meets your expectations",
              },
            ].map((process, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="text-5xl font-bold text-orange-600 mb-4">
                    {process.step}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{process.title}</h3>
                  <p className="text-gray-600">{process.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl mb-6">
            Let's Discuss Your Project
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Contact us today for a free consultation and detailed quote
          </p>
          <Link to="/contact">
            <Button size="lg" className="bg-orange-600 hover:bg-orange-700">
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
