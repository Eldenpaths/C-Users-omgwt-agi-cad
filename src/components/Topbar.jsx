import { Menu, LogOut } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";

export default function Topbar({ toggleSidebar }) {
  const handleSignOut = async () => {
    await signOut(auth);
  };

  return (
    <header className="h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4">
      <button onClick={toggleSidebar} className="p-2 hover:bg-gray-800 rounded-lg">
        <Menu className="w-5 h-5" />
      </button>
      <h1 className="font-semibold text-lg tracking-wide">AGI-CAD Dashboard</h1>
      <button
        onClick={handleSignOut}
        className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded-lg hover:bg-gray-700 transition"
      >
        <LogOut className="w-4 h-4" />
        <span className="text-sm">Sign Out</span>
      </button>
    </header>
  );
}
