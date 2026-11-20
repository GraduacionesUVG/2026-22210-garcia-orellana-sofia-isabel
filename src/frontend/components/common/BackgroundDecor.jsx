export default function BackgroundDecor() {
  return (
    <>
      <div className="absolute inset-0 bg-pattern-dots [background-size:20px_20px] opacity-30 pointer-events-none" />
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
    </>
  );
}
