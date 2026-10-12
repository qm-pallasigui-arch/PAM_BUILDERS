import { useState } from "react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";

const projects = [
  {
    id: 1,
    title: "Riverside Luxury Home",
    category: "Residential",
    description: "Custom 5,000 sq ft modern home with panoramic river views, featuring sustainable materials and smart home technology.",
    image: "https://images.unsplash.com/photo-1622015663319-e97e697503ee?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBob21lJTIwZXh0ZXJpb3IlMjBhcmNoaXRlY3R1cmV8ZW58MXx8fHwxNzc1Mzg2MTM1fDA&ixlib=rb-4.1.0&q=80&w=1080",
    details: {
      year: "2025",
      duration: "12 months",
      size: "5,000 sq ft",
    },
  },
  {
    id: 2,
    title: "Downtown Tech Office",
    category: "Commercial",
    description: "Modern 10,000 sq ft office space with open floor plan, collaborative areas, and state-of-the-art facilities.",
    image: "https://images.unsplash.com/photo-1703355685639-d558d1b0f63e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBvZmZpY2UlMjBpbnRlcmlvciUyMHdvcmtzcGFjZXxlbnwxfHx8fDE3NzUzMDM0NTl8MA&ixlib=rb-4.1.0&q=80&w=1080",
    details: {
      year: "2025",
      duration: "8 months",
      size: "10,000 sq ft",
    },
  },
  {
    id: 3,
    title: "Gourmet Kitchen Remodel",
    category: "Renovation",
    description: "Complete kitchen transformation featuring custom cabinetry, quartz countertops, and professional-grade appliances.",
    image: "https://images.unsplash.com/photo-1772567732969-c1506edf80a0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxraXRjaGVuJTIwcmVtb2RlbCUyMG1vZGVybnxlbnwxfHx8fDE3NzUzODYwMzN8MA&ixlib=rb-4.1.0&q=80&w=1080",
    details: {
      year: "2026",
      duration: "3 months",
      size: "450 sq ft",
    },
  },
  {
    id: 4,
    title: "Spa-Inspired Bathroom",
    category: "Renovation",
    description: "Luxurious bathroom renovation with heated floors, rainfall shower, soaking tub, and custom tile work.",
    image: "https://images.unsplash.com/photo-1758448018619-4cbe2250b9ad?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXRocm9vbSUyMHJlbm92YXRpb24lMjBsdXh1cnl8ZW58MXx8fHwxNzc1Mzg2MDMzfDA&ixlib=rb-4.1.0&q=80&w=1080",
    details: {
      year: "2026",
      duration: "2 months",
      size: "200 sq ft",
    },
  },
  {
    id: 5,
    title: "Boutique Retail Store",
    category: "Commercial",
    description: "High-end retail space with custom millwork, elegant lighting, and optimized customer flow.",
    image: "https://images.unsplash.com/photo-1759050486852-fdfe2fdc7bea?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZXRhaWwlMjBzdG9yZSUyMGludGVyaW9yJTIwZGVzaWdufGVufDF8fHx8MTc3NTM4NjEzNnww&ixlib=rb-4.1.0&q=80&w=1080",
    details: {
      year: "2025",
      duration: "4 months",
      size: "2,500 sq ft",
    },
  },
  {
    id: 6,
    title: "Modern Family Residence",
    category: "Residential",
    description: "Contemporary 3,800 sq ft home with open concept living, energy-efficient design, and premium finishes.",
    image: "https://images.unsplash.com/photo-1773558048595-0eb9c121f119?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZXNpZGVudGlhbCUyMGhvbWUlMjBleHRlcmlvcnxlbnwxfHx8fDE3NzUzNzU0MjR8MA&ixlib=rb-4.1.0&q=80&w=1080",
    details: {
      year: "2025",
      duration: "10 months",
      size: "3,800 sq ft",
    },
  },
  {
    id: 7,
    title: "Urban Apartment Complex",
    category: "Commercial",
    description: "Multi-unit residential building with 24 luxury apartments, rooftop terrace, and modern amenities.",
    image: "https://images.unsplash.com/photo-1515263487990-61b07816b324?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhcGFydG1lbnQlMjBidWlsZGluZ3xlbnwxfHx8fDE3NzUzMDI0ODh8MA&ixlib=rb-4.1.0&q=80&w=1080",
    details: {
      year: "2024",
      duration: "18 months",
      size: "45,000 sq ft",
    },
  },
  {
    id: 8,
    title: "Historic Home Restoration",
    category: "Renovation",
    description: "Careful restoration of a 1920s craftsman home, preserving original character while modernizing systems.",
    image: "https://images.unsplash.com/photo-1770838773417-08b18661c62f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob21lJTIwcmVub3ZhdGlvbiUyMGludGVyaW9yfGVufDF8fHx8MTc3NTM4MTAxNnww&ixlib=rb-4.1.0&q=80&w=1080",
    details: {
      year: "2025",
      duration: "7 months",
      size: "2,800 sq ft",
    },
  },
  {
    id: 9,
    title: "Corporate Headquarters",
    category: "Commercial",
    description: "Contemporary office building with sustainable design, collaborative workspaces, and wellness areas.",
    image: "https://images.unsplash.com/photo-1677324574457-645566fea332?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21tZXJjaWFsJTIwYnVpbGRpbmclMjBvZmZpY2V8ZW58MXx8fHwxNzc1MzEyNTkyfDA&ixlib=rb-4.1.0&q=80&w=1080",
    details: {
      year: "2024",
      duration: "14 months",
      size: "25,000 sq ft",
    },
  },
];

export function Projects() {
  const [activeTab, setActiveTab] = useState("all");

  const filteredProjects =
    activeTab === "all"
      ? projects
      : projects.filter((p) => p.category.toLowerCase() === activeTab);

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-orange-600 to-orange-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl mb-6">Our Projects</h1>
          <p className="text-xl text-orange-100 max-w-3xl mx-auto">
            Explore our portfolio of completed projects showcasing our commitment
            to quality, craftsmanship, and client satisfaction.
          </p>
        </div>
      </section>

      {/* Projects Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
            <div className="flex justify-center mb-12">
              <TabsList className="inline-flex">
                <TabsTrigger value="all">All Projects</TabsTrigger>
                <TabsTrigger value="residential">Residential</TabsTrigger>
                <TabsTrigger value="commercial">Commercial</TabsTrigger>
                <TabsTrigger value="renovation">Renovation</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value={activeTab} className="mt-0">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredProjects.map((project) => (
                  <Card
                    key={project.id}
                    className="overflow-hidden hover:shadow-xl transition-shadow group"
                  >
                    <div className="relative h-64 overflow-hidden">
                      <ImageWithFallback
                        src={project.image}
                        alt={project.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-orange-600 hover:bg-orange-700">
                          {project.category}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-6">
                      <h3 className="text-xl font-semibold mb-3">
                        {project.title}
                      </h3>
                      <p className="text-gray-600 mb-4">{project.description}</p>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        <div>
                          <span className="font-semibold">Year:</span>{" "}
                          {project.details.year}
                        </div>
                        <div>
                          <span className="font-semibold">Duration:</span>{" "}
                          {project.details.duration}
                        </div>
                        <div>
                          <span className="font-semibold">Size:</span>{" "}
                          {project.details.size}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl mb-4">Project Success</h2>
            <p className="text-xl text-gray-600">
              Numbers that speak to our commitment
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "1,000+", label: "Projects Completed" },
              { value: "98%", label: "On-Time Delivery" },
              { value: "99%", label: "Client Satisfaction" },
              { value: "$150M+", label: "Total Project Value" },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-orange-600 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
