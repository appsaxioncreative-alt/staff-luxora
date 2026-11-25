import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
export const metadata = {
  title: "Luxora Staff Login Portal",
  description: "Luxora staff portal: your jobs, deliveries and return counts.",
};
export const viewport = {
  themeColor: "#0f0d1a",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
///code 
