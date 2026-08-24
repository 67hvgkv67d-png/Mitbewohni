import type { Metadata } from "next";
import WgFinder from "./WgFinder";

export const metadata: Metadata = {
  title: "Mitbewohni | Menschen für deine WG finden",
  description: "Steckbriefe für Menschen, die in einer WG wohnen möchten.",
};

export default function Home() {
  return <WgFinder />;
}
