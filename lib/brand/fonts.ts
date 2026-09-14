import { Fraunces, Inter } from "next/font/google";

export const speakifyInter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-hub-inter",
});

export const speakifyFraunces = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-hub-fraunces",
});
