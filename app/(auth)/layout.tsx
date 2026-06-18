/**
 * Auth group layout. Renders only its children. The auth pages opt
 * out of the root <ClerkProvider>'s default sign-in/up routing by
 * using their own pages here.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return <>{children}</>;
}