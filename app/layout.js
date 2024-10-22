import "./globals.css";
import Navbar from "@/components/navbar";

export const metadata = {
  title: "ResIdentity",
  description: "Decentralized Document e-Signing and Authenticity Verification",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Navbar /> {/* Navbar component: 8vh */}
        <div className="h-[92vh]">{children}</div>
      </body>
    </html>
  );
}
