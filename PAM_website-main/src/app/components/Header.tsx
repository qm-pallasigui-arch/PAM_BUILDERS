import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router";
import { Menu, X, HardHat } from "lucide-react";
import { Button } from "./ui/button";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const location = useLocation();

  // Close mobile menu automatically when route changes (user tapped a link)
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen]);

  const toggleMenu = () => {
    if (mobileMenuOpen) {
      // Animate out before closing
      setIsAnimating(true);
      setTimeout(() => {
        setMobileMenuOpen(false);
        setIsAnimating(false);
      }, 200);
    } else {
      setMobileMenuOpen(true);
    }
  };

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/services", label: "Services" },
    { to: "/projects", label: "Projects" },
    { to: "/about", label: "About" },
    { to: "/contact", label: "Contact" },
    { to: "/portal/login", label: "Staff Login" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-white border-b sticky top-0 z-50 shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          
          <Link to="/" className="flex items-center gap-2">
            <HardHat className="h-8 w-8 text-orange-600" />
            <span className="text-xl font-semibold text-gray-900">
              PAM Builders 
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`text-sm transition-colors ${
                  isActive(link.to)
                    ? "text-orange-600 font-semibold"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link to="/contact">
              <Button className="bg-orange-600 hover:bg-orange-700">Get Quote</Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
            onClick={toggleMenu}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6 text-gray-700" />
            ) : (
              <Menu className="h-6 w-6 text-gray-700" />
            )}
          </button>
        </div>

        {/* Mobile Navigation — slides in with smooth transition */}
        {(mobileMenuOpen || isAnimating) && (
          <div
            className={`lg:hidden border-t bg-white transition-all duration-200 ease-in-out overflow-hidden ${
              mobileMenuOpen && !isAnimating
                ? "max-h-screen opacity-100 py-4"
                : "max-h-0 opacity-0 py-0"
            }`}
          >
            <div className="flex flex-col gap-1 pb-2">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`text-sm py-3 px-2 rounded-md transition-colors ${
                    isActive(link.to)
                      ? "text-orange-600 font-semibold bg-orange-50"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <Link to="/contact" className="mt-2">
                <Button className="w-full bg-orange-600 hover:bg-orange-700">
                  Get Quote
                </Button>
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
