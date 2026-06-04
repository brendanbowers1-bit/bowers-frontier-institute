import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { WhatWeDo } from "./components/WhatWeDo";
import { Labs } from "./components/Labs";
import { Founder } from "./components/Founder";
import { Contact } from "./components/Contact";
import { Footer } from "./components/Footer";

export default function App() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <WhatWeDo />
        <Labs />
        <Founder />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
