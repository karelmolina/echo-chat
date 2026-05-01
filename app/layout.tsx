export const metadata = {
  title: "Echo Chat",
  description: "AI-powered chat application",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900">
        <div className="flex h-screen">
          <aside className="w-64 bg-white border-r border-gray-200 p-4">
            <h2 className="text-lg font-semibold mb-4">Conversations</h2>
            <p className="text-sm text-gray-500">No conversations yet.</p>
          </aside>
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </body>
    </html>
  );
}
