import { UserAvatar } from "@/components/ui/UserAvatar";
import { queryClient } from "@/lib/queryClient";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "react-router-dom";
import canterburyLogoPath from "@assets/one_line_logo-03 (1)_1749356183104.png";

interface NavbarProps {
  toggleMobileSidebar: () => void;
  user: any;
}

export default function Navbar({ toggleMobileSidebar, user }: NavbarProps) {
  // Role-based nav items (copied from Sidebar)
  const isAdmin = user?.role === 'admin';
  const isSuperAdmin = user?.role === 'super_admin';
  const isMaintenance = user?.role === 'maintenance' || user?.role === 'admin';

  const navItems = isSuperAdmin ? [
    { href: "/dashboard", label: "Dashboard", icon: "dashboard", access: "super_admin" },
    { href: "/admin/organizations", label: "Manage Organizations", icon: "business", access: "super_admin" },
    { href: "/admin/buildings-facilities", label: "Buildings & Facilities", icon: "domain", access: "super_admin" },
    { href: "/admin/users", label: "User Management", icon: "group", access: "super_admin" },
    { href: "/manage-requests", label: "Manage Requests", icon: "manage_accounts", access: "super_admin" },
    { href: "/reports", label: "Reports", icon: "assessment", access: "super_admin" },
  ] : isAdmin ? [
    { href: "/dashboard", label: "Dashboard", icon: "dashboard", access: "admin" },
    // { href: "/admin/users", label: "User Management", icon: "group", access: "admin" },
    { href: "/manage-requests", label: "Manage Requests", icon: "manage_accounts", access: "admin" },
    { href: "/room-history", label: "Room History", icon: "history", access: "admin" },
    { href: "/reports", label: "Reports", icon: "assessment", access: "admin" },
    { href: "/assigned-requests", label: "Assigned to Me", icon: "engineering", access: "admin" },
    { href: "/new-building-request", label: "New Repair Request", icon: "home_repair_service", access: "admin" },
    { href: "/new-facilities-request", label: "New Labor Request", icon: "event_seat", access: "admin" },
  ] : user?.role === 'maintenance' ? [
    { href: "/dashboard", label: "Dashboard", icon: "dashboard", access: "maintenance" },
    { href: "/assigned-requests", label: "Assigned to Me", icon: "engineering", access: "maintenance" },
    { href: "/room-history", label: "Room History", icon: "history", access: "maintenance" },
    { href: "/manage-requests", label: "Manage Requests", icon: "manage_accounts", access: "maintenance" },
    { href: "/new-building-request", label: "New Repair Request", icon: "home_repair_service", access: "maintenance" },
    { href: "/new-facilities-request", label: "New Facilities Request", icon: "event_seat", access: "maintenance" },
  ] : [
    { href: "/dashboard", label: "Dashboard", icon: "dashboard", access: "all" },
    { href: "/new-building-request", label: "New Repair Request", icon: "home_repair_service", access: "all" },
    { href: "/new-facilities-request", label: "New Labor Request", icon: "event_seat", access: "all" },
    { href: "/my-requests", label: "My Requests", icon: "assignment", access: "all" },
    { href: "/room-history", label: "Room History", icon: "history", access: "all" },
  ];

  return (
    <nav className="bg-primary shadow-md">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            {/* Mobile menu button */}
            <div className="flex items-center md:hidden">
              <button
                type="button"
                className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-primary-light focus:outline-none"
                onClick={toggleMobileSidebar}
              >
                <span className="material-icons">menu</span>
              </button>
            </div>
            
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-white text-xl font-heading font-bold">
                {user?.role === 'super_admin' ? 'SchoolHouse Logistics' : user?.organizationName || 'RepairRequest'}
              </h1>
            </div>
          </div>
          
          <div className="flex items-center">
            {user?.organizationName === 'Canterbury School' && user?.role !== 'super_admin' && (
              <div className="relative">
                <div className="py-2 px-6">
                  <img 
                    src={canterburyLogoPath} 
                    alt="Canterbury School" 
                    className="h-12 w-auto"
                  />
                </div>
              </div>
            )}
            
            <div className="ml-3 relative">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex text-sm rounded-full focus:outline-none">
                    <span className="sr-only">Open user menu</span>
                    <UserAvatar user={user} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="font-normal">
                      <p className="font-medium text-sm">{user?.firstName} {user?.lastName}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {navItems.map((item) => (
                    <DropdownMenuItem key={item.href}>
                      <Link to={item.href} className="flex items-center w-full">
                        <span className="material-icons text-sm mr-2">{item.icon}</span>
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={async (e) => {
                      e.preventDefault();
                      await fetch("/api/logout", { credentials: "include" });
                      // Clear React Query cache
                      queryClient.clear();
                      window.location.href = "/landing";
                    }}
                  >
                    <span className="material-icons text-sm mr-2">logout</span>
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
