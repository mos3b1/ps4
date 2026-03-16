"use client";

import { Orbitron, Rajdhani } from "next/font/google";
import "./globals.css";
import { TimerProvider, useTimer } from "@/context/TimerContext";
import Navbar from "@/components/Navbar";
import Toast from "@/components/Toast";

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  weight: ["400","600","700","900"],
});

const rajdhani = Rajdhani({
  subsets: ["latin"],
  variable: "--font-rajdhani",
  weight: ["400","500","600","700"],
});

function ToastWrapper() {
  const { toast } = useTimer();
  return <Toast message={toast} />;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${orbitron.variable} ${rajdhani.variable}`}>
      <body className="antialiased min-h-screen" style={{ backgroundColor: "#080810" }}>
        <TimerProvider>
          <Navbar />
          <ToastWrapper />
          <main
            style={{
              paddingTop: "100px",
              paddingLeft: "24px",
              paddingRight: "24px",
              paddingBottom: "40px",
              maxWidth: "1200px",
              margin: "0 auto",
            }}
          >
            {children}
          </main>
        </TimerProvider>
      </body>
    </html>
  );
}
