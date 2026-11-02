export default function Layout({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto flex max-w-screen-2xl flex-col gap-4 p-3 md:px-8 md:py-4">{children}</div>;
}
