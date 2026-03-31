export default function WidgetFullPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      id="widget-fullpage"
      style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column' }}
    >
      {children}
    </div>
  );
}
