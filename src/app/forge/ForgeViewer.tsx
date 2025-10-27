import dynamic from "next/dynamic";
const ForgeViewer = dynamic(() => import("@/src/components/ForgeViewer"), { ssr: false });

export default function ForgePage() {
  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Forge Render Link (Phase 8C)</h1>
      <ForgeViewer />
    </main>
  );
}

