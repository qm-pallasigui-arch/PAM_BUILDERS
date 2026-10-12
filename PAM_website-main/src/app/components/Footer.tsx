import { Link } from "react-router";
import { HardHat, Mail, Phone, MapPin, Facebook, Instagram, Linkedin } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <HardHat className="h-8 w-8 text-orange-600" />
              <span className="text-xl font-semibold text-white">
                PAM Builders
              </span>
            </div>
            <p className="text-sm mb-4">
              Design & Build since 2025. A general contractor and construction management company.
            </p>
            <div className="flex gap-4">
              <a href="https://facebook.com/yourbusiness" target="_blank" rel="noopener noreferrer" className="hover:text-orange-600 transition-colors" aria-label="Facebook">
                <Facebook className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-orange-600 transition-colors">Home</Link></li>
              <li><Link to="/services" className="hover:text-orange-600 transition-colors">Services</Link></li>
              <li><Link to="/projects" className="hover:text-orange-600 transition-colors">Projects</Link></li>
              <li><Link to="/about" className="hover:text-orange-600 transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-orange-600 transition-colors">Contact</Link></li>
              <li><Link to="/portal/login" className="hover:text-orange-600 transition-colors">Staff Login</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contact</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                {/* REPLACE: your actual business address */}
                <span>17 Pinto St., Rancho Estate 1 Concepcion Dos, Marikina City</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-orange-600 flex-shrink-0" />
                <a href="tel:+639123456789" className="hover:text-orange-600 transition-colors">
                  +63 966 0691 500
                </a>
                <br />
                <a href="tel:+639123456789" className="hover:text-orange-600 transition-colors">
                  +63 915 1688 197
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-orange-600 flex-shrink-0" />

                <a href="mailto:info@yourbusiness.com" className="hover:text-orange-600 transition-colors">
                  pambuildersconstruction@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-center">
          <p>&copy; {currentYear} PAM Builders. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
