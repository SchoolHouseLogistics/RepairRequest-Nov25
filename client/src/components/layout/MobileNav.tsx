import { Link, useLocation } from "react-router-dom";

interface MobileNavProps {
  user: any;
}

export default function MobileNav({ user }: MobileNavProps) {
  const location = useLocation();
  const isAdmin = user?.role === 'admin';
  const isSuperAdmin = user?.role === 'super_admin';
  const isMaintenance = user?.role === 'maintenance' || user?.role === 'admin';

  if (isSuperAdmin) {
    // Super Admin mobile navigation - 4 most important items
    return (
      <div className="md:hidden bg-white border-t border-gray-200 fixed bottom-0 left-0 right-0 z-10">
        <div className="grid grid-cols-4">
          <Link to="/">
            <div className={`flex flex-col items-center justify-center py-2 ${location.pathname === '/' ? 'text-primary' : 'text-gray-600'}`}>
              <span className="material-icons">dashboard</span>
              <span className="text-xs mt-1">Dashboard</span>
            </div>
          </Link>
          
          <Link to="/admin/organizations">
            <div className={`flex flex-col items-center justify-center py-2 ${location.pathname === '/admin/organizations' ? 'text-primary' : 'text-gray-600'}`}>
              <span className="material-icons">business</span>
              <span className="text-xs mt-1">Organizations</span>
            </div>
          </Link>
          
          <Link to="/admin/buildings-facilities">
            <div className={`flex flex-col items-center justify-center py-2 ${location.pathname === '/admin/buildings-facilities' ? 'text-primary' : 'text-gray-600'}`}>
              <span className="material-icons">domain</span>
              <span className="text-xs mt-1">Buildings</span>
            </div>
          </Link>
          
          <Link to="/manage-requests">
            <div className={`flex flex-col items-center justify-center py-2 ${location.pathname === '/manage-requests' ? 'text-primary' : 'text-gray-600'}`}>
              <span className="material-icons">manage_accounts</span>
              <span className="text-xs mt-1">Manage</span>
            </div>
          </Link>
        </div>
      </div>
    );
  }

  if (isAdmin) {
    // Admin mobile navigation - 4 most important items
    return (
      <div className="md:hidden bg-white border-t border-gray-200 fixed bottom-0 left-0 right-0 z-10">
        <div className="grid grid-cols-4">
          <Link to="/">
            <div className={`flex flex-col items-center justify-center py-2 ${location.pathname === '/' ? 'text-primary' : 'text-gray-600'}`}>
              <span className="material-icons">dashboard</span>
              <span className="text-xs mt-1">Dashboard</span>
            </div>
          </Link>
          
          <Link to="/manage-requests">
            <div className={`flex flex-col items-center justify-center py-2 ${location.pathname === '/manage-requests' ? 'text-primary' : 'text-gray-600'}`}>
              <span className="material-icons">manage_accounts</span>
              <span className="text-xs mt-1">Manage</span>
            </div>
          </Link>
          
          <Link to="/room-history">
            <div className={`flex flex-col items-center justify-center py-2 ${location.pathname === '/room-history' ? 'text-primary' : 'text-gray-600'}`}>
              <span className="material-icons">history</span>
              <span className="text-xs mt-1">History</span>
            </div>
          </Link>
          
          <Link to="/reports">
            <div className={`flex flex-col items-center justify-center py-2 ${location.pathname === '/reports' ? 'text-primary' : 'text-gray-600'}`}>
              <span className="material-icons">assessment</span>
              <span className="text-xs mt-1">Reports</span>
            </div>
          </Link>
        </div>
      </div>
    );
  }

  if (user?.role === 'maintenance') {
    // Maintenance mobile navigation - 4 most important items
    return (
      <div className="md:hidden bg-white border-t border-gray-200 fixed bottom-0 left-0 right-0 z-10">
        <div className="grid grid-cols-4">
          <Link to="/">
            <div className={`flex flex-col items-center justify-center py-2 ${location.pathname === '/' ? 'text-primary' : 'text-gray-600'}`}>
              <span className="material-icons">dashboard</span>
              <span className="text-xs mt-1">Dashboard</span>
            </div>
          </Link>

          <Link to="/assigned-requests">
            <div className={`flex flex-col items-center justify-center py-2 ${location.pathname === '/assigned-requests' ? 'text-primary' : 'text-gray-600'}`}>
              <span className="material-icons">engineering</span>
              <span className="text-xs mt-1">Assigned</span>
            </div>
          </Link>

          <Link to="/new-building-request">
            <div className={`flex flex-col items-center justify-center py-2 ${(location.pathname === '/new-facilities-request' || location.pathname === '/new-building-request') ? 'text-primary' : 'text-gray-600'}`}>
              <span className="material-icons">add_circle</span>
              <span className="text-xs mt-1">New</span>
            </div>
          </Link>

          <Link to="/manage-requests">
            <div className={`flex flex-col items-center justify-center py-2 ${location.pathname === '/manage-requests' ? 'text-primary' : 'text-gray-600'}`}>
              <span className="material-icons">manage_accounts</span>
              <span className="text-xs mt-1">Manage</span>
            </div>
          </Link>
        </div>
      </div>
    );
  }

  if (user?.role === 'tech') {
    // Tech staff mobile navigation - 4 most important items
    return (
      <div className="md:hidden bg-white border-t border-gray-200 fixed bottom-0 left-0 right-0 z-10">
        <div className="grid grid-cols-4">
          <Link to="/dashboard">
            <div className={`flex flex-col items-center justify-center py-2 ${location.pathname === '/dashboard' ? 'text-primary' : 'text-gray-600'}`}>
              <span className="material-icons">dashboard</span>
              <span className="text-xs mt-1">Dashboard</span>
            </div>
          </Link>

          <Link to="/manage-requests">
            <div className={`flex flex-col items-center justify-center py-2 ${location.pathname === '/manage-requests' ? 'text-primary' : 'text-gray-600'}`}>
              <span className="material-icons">computer</span>
              <span className="text-xs mt-1">Requests</span>
            </div>
          </Link>

          <Link to="/assigned-requests">
            <div className={`flex flex-col items-center justify-center py-2 ${location.pathname === '/assigned-requests' ? 'text-primary' : 'text-gray-600'}`}>
              <span className="material-icons">engineering</span>
              <span className="text-xs mt-1">Assigned</span>
            </div>
          </Link>

          <Link to="/new-tech-request">
            <div className={`flex flex-col items-center justify-center py-2 ${location.pathname === '/new-tech-request' ? 'text-primary' : 'text-gray-600'}`}>
              <span className="material-icons">add_circle</span>
              <span className="text-xs mt-1">New</span>
            </div>
          </Link>
        </div>
      </div>
    );
  }

  // Regular user mobile navigation
  return (
    <div className="md:hidden bg-white border-t border-gray-200 fixed bottom-0 left-0 right-0 z-10">
      <div className="grid grid-cols-4">
        <Link to="/">
          <div className={`flex flex-col items-center justify-center py-2 ${location.pathname === '/' ? 'text-primary' : 'text-gray-600'}`}>
            <span className="material-icons">dashboard</span>
            <span className="text-xs mt-1">Dashboard</span>
          </div>
        </Link>

        <Link to="/my-requests">
          <div className={`flex flex-col items-center justify-center py-2 ${location.pathname === '/my-requests' ? 'text-primary' : 'text-gray-600'}`}>
            <span className="material-icons">assignment</span>
            <span className="text-xs mt-1">Requests</span>
          </div>
        </Link>

        <Link to="/new-building-request">
          <div className={`flex flex-col items-center justify-center py-2 ${(location.pathname === '/new-facilities-request' || location.pathname === '/new-building-request') ? 'text-primary' : 'text-gray-600'}`}>
            <span className="material-icons">add_circle</span>
            <span className="text-xs mt-1">New</span>
          </div>
        </Link>

        <Link to="/new-tech-request">
          <div className={`flex flex-col items-center justify-center py-2 ${location.pathname === '/new-tech-request' ? 'text-primary' : 'text-gray-600'}`}>
            <span className="material-icons">computer</span>
            <span className="text-xs mt-1">Tech</span>
          </div>
        </Link>
      </div>
    </div>
  );
}
