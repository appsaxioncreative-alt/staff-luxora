import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

export const metadata = { title: "Crew – My jobs", description: "Assigned jobs, delivery and return counts" };
export const viewport = { width: "device-width", initialScale: 1, themeColor: "#0f3d2e" };

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
