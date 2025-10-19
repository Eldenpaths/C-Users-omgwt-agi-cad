import { Home, Cpu, Database, FileText, Users } from "lucide-react";

const navItems = [
  { name: "Agents", icon: Users, href: "#" },
  { name: "Forge", icon: Cpu, href: "#" },
  { name: "EchoVault", icon: Database, href: "#" },
  { name: "Logs", icon: FileText, href: "#" },
];

export default function Sidebar({ open }) {
  return (
    <aside
      className={`${
        open ? "w-64" : "w-20"
      } bg-gray-900 transition-all duration-300 flex flex-col`}
    >
      <div className="flex items-center justify-center h-16 font-bold text-xl border-b border-gray-800">
        AGI-CAD
      </div>
      <nav className="flex-1 mt-4 space-y-2">
        {navItems.map(({ name, icon: Icon, href }) => (
          <a
            key={name}
            href={href}
            className="flex items-center gap-3 px-4 py-2 hover:bg-gray-800 transition"
          >
            <Icon className="w-5 h-5" />
            {open && <span className="text-sm">{name}</span>}
          </a>
        ))}
      </nav>
    </aside>
  );
}
