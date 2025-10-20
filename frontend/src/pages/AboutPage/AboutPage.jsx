import React from "react";
import { Link } from "react-router-dom"; // ✅ add this
import Header from "../components/Header";

const AboutPage = () => {
  return (
    <>
      {/* ===== NAVBAR ===== */}
      <Header />

      {/* ===== MAIN CONTENT ===== */}
      <main className="font-poppins text-[#222] leading-relaxed bg-white">
        {/* HERO IMAGE SECTION */}
        <section className="relative w-full h-[420px] overflow-hidden">
          <img
            src="/assets/cart.webp"
            alt="cart"
            className="w-full h-full object-cover brightness-75"
          />
          <div className="absolute inset-0 flex items-center justify-center text-center">
            <h1 className="text-white text-4xl md:text-[2.8rem] font-bold drop-shadow-md">
              About Us
            </h1>
          </div>
        </section>

        {/* INTRODUCTION SECTION */}
        <section className="text-center px-6 py-16 max-w-3xl mx-auto">
          <h2 className="text-[#0077b6] text-2xl md:text-[1.9rem] font-bold mb-4">
            Transforming lives, one task at a time
          </h2>
          <p className="text-[#333] text-base md:text-[1.05rem] leading-8">
            We bring people together. It’s at the heart of everything we do. We
            know that for every person who needs a helping hand — whether it’s
            setting up furniture, cleaning the home, or running an errand —
            there’s someone nearby who’s ready, willing, and able to help. When
            these two people come together, they support each other in a
            meaningful way, creating a better everyday life for everyone.
          </p>
        </section>

        {/* VALUES SECTION */}
        <section className="bg-gray-50 text-center px-6 py-16">
          <h2 className="text-[#0077b6] text-2xl font-bold">Our Values</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mt-10">
            {[
              {
                title: "Trust & Safety",
                desc: "We prioritize safe, respectful interactions so you can feel confident every time you book a task.",
              },
              {
                title: "Accessibility",
                desc: "Designed for everyone, especially seniors and persons with disabilities.",
              },
              {
                title: "Community",
                desc: "We encourage genuine connections between neighbours and local providers.",
              },
              {
                title: "Innovation",
                desc: "We continually evolve to make TaskPal faster, simpler, and more reliable.",
              },
            ].map((value) => (
              <div
                key={value.title}
                className="bg-white rounded-xl p-7 border-t-4 border-[#0077b6] shadow-md"
              >
                <h3 className="text-[#0077b6] font-semibold mb-2">
                  {value.title}
                </h3>
                <p className="text-gray-700">{value.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* OUR STORY SECTION */}
        <section className="text-center px-6 py-16 max-w-2xl mx-auto">
          <h2 className="text-[#0077b6] text-2xl font-bold mb-4">Our Story</h2>
          <p className="text-[#333] text-base md:text-[1.05rem] bg-white rounded-xl p-7 shadow-md">
            TaskPal began with a simple idea: if you need a helping hand, you
            shouldn’t have to look far. What started as a small local project
            has grown into a trusted platform connecting people who need help
            with those offering quality, reliable services. Our goal remains the
            same — make everyday life easier for everyone.
          </p>
        </section>

        {/* TEAM SECTION */}
        <section className="text-center px-6 py-16">
          <h2 className="text-[#0077b6] text-2xl font-bold">Meet the Team</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mt-10">
            {[
              {
                name: "Justin Mangawang",
                role: "Project Manager",
                img: "https://via.placeholder.com/110",
              },
              {
                name: "John Carlo Sinoy",
                role: "Lead Developer",
                img: "https://via.placeholder.com/110",
              },
              {
                name: "Sikandeer Kingdra",
                role: "Frontend/Backend Developer",
                img: "https://via.placeholder.com/110",
              },
              {
                name: "John Gerardo",
                role: "Documentation/Tester",
                img: "https://via.placeholder.com/110",
              },
            ].map((member) => (
              <div
                key={member.name}
                className="bg-white rounded-xl p-6 shadow-md hover:-translate-y-1 transition-transform"
              >
                <img
                  src={member.img}
                  alt={member.name}
                  className="w-28 h-28 rounded-full object-cover border-4 border-[#ffd166] mx-auto mb-3"
                />
                <h3 className="text-[#0077b6] font-semibold">{member.name}</h3>
                <p className="text-gray-600 text-sm">{member.role}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CALL TO ACTION SECTION */}
        <section className="bg-[#0077b6] text-white text-center px-8 py-20">
          <h2 className="text-2xl font-bold mb-3">Ready to get started?</h2>
          <p className="text-lg mb-8">
            Whether you need help or want to become a provider, TaskPal is ready
            when you are.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/login?type=provider"
              className="bg-[#ffd166] text-[#222] px-6 py-3 rounded-lg font-semibold text-base hover:bg-[#f7c94b] transition-all"
            >
              Join as a Provider
            </Link>
            <Link
              to="/contact"
              className="bg-white text-[#0077b6] px-6 py-3 rounded-lg font-semibold border-2 border-white hover:bg-[#005f8a] hover:text-white transition-all"
            >
              Find Help
            </Link>
          </div>
        </section>
      </main>
    </>
  );
};

export default AboutPage;
