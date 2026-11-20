export default function PageShell({ children }) {
  return (
    <div className="responsive-surface bg-background-light text-gray-800 font-sans antialiased">
      {children}
    </div>
  );
}
