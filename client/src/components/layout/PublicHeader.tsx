import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { Link } from "react-router-dom";
import logoPath from "@assets/RepairRequest Logo Transparent_1750783382845.png";
import { useState } from "react";

interface PublicHeaderProps {
  currentPage?: string;
}

export default function PublicHeader({ currentPage = "" }: PublicHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (page: string) => currentPage === page;

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-2 md:py-4">
          <Link to="/">
            <div className="flex items-center space-x-3 cursor-pointer">
              <img src={logoPath} alt="RepairRequest Logo" className="w-10 h-10" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">RepairRequest</h1>
                <p className="text-sm text-gray-600">by SchoolHouse Logistics</p>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation Menu */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link 
              to="/" 
              className={`transition-colors ${
                isActive("home") ? "text-blue-600 font-medium" : "text-gray-600 hover:text-blue-600"
              }`}
            >
              Home
            </Link>
            <Link 
              to="/features" 
              className={`transition-colors ${
                isActive("features") ? "text-blue-600 font-medium" : "text-gray-600 hover:text-blue-600"
              }`}
            >
              Features
            </Link>
            <Link 
              to="/pricing" 
              className={`transition-colors ${
                isActive("pricing") ? "text-blue-600 font-medium" : "text-gray-600 hover:text-blue-600"
              }`}
            >
              Pricing
            </Link>
            <Link 
              to="/faq" 
              className={`transition-colors ${
                isActive("faq") ? "text-blue-600 font-medium" : "text-gray-600 hover:text-blue-600"
              }`}
            >
              FAQ
            </Link>
            <Link 
              to="/login" 
              className={`transition-colors ${
                isActive("login") ? "text-blue-600 font-medium" : "text-gray-600 hover:text-blue-600"
              }`}
            >
              Login
            </Link>
            <a href="https://calendly.com/schoolhouselogistics/30min" target="_blank" rel="noopener noreferrer">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white ml-4">
                Learn What's Possible
              </Button>
            </a>
          </nav>
          
          {/* Mobile Menu */}
          <div className="md:hidden flex items-center space-x-2">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-gray-700">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col space-y-4 mt-8">
                  <Link 
                    to="/" 
                    className={`text-lg py-2 px-4 rounded-md transition-colors ${
                      isActive("home") 
                        ? "text-blue-600 font-medium bg-blue-50" 
                        : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Home
                  </Link>
                  <Link 
                    to="/features" 
                    className={`text-lg py-2 px-4 rounded-md transition-colors ${
                      isActive("features") 
                        ? "text-blue-600 font-medium bg-blue-50" 
                        : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Features
                  </Link>
                  <Link 
                    to="/pricing" 
                    className={`text-lg py-2 px-4 rounded-md transition-colors ${
                      isActive("pricing") 
                        ? "text-blue-600 font-medium bg-blue-50" 
                        : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Pricing
                  </Link>
                  <Link 
                    to="/faq" 
                    className={`text-lg py-2 px-4 rounded-md transition-colors ${
                      isActive("faq") 
                        ? "text-blue-600 font-medium bg-blue-50" 
                        : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    FAQ
                  </Link>
                  <Link 
                    to="/login" 
                    className={`text-lg py-2 px-4 rounded-md transition-colors ${
                      isActive("login") 
                        ? "text-blue-600 font-medium bg-blue-50" 
                        : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <div className="pt-4 border-t">
                    <a 
                      href="https://calendly.com/schoolhouselogistics/30min" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                        Learn What's Possible
                      </Button>
                    </a>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}

