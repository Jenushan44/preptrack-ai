import "./globals.css";

export const metadata = {
  title: "PrepTrack AI",
  description: "Track your prep like a pro",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}