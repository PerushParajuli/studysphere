import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "./components/ui/toast";
import { ThemeProvider } from "./components/ThemeProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata = {
  title: "StudySphere - Student Management System",
  description: "A comprehensive platform for managing student activities, events, and academic resources",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">
        <ThemeProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
