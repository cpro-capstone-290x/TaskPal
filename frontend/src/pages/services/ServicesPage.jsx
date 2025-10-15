import React from "react";
import { Brush, Truck, Sprout } from "lucide-react"; // Importing icons from Lucide
import { Link } from "react-router-dom";

/*
  Defines all available service categories displayed on the page.
  Each object contains:
  - name: the service title
  - description: short text explaining the service
  - icon: a Lucide icon to represent the service visually
  - link: the route that takes the user to the booking page for that service
*/
const services = [
  {
    id: 1,
    name: "Cleaning",
    description:
      "Professional home cleaning services tailored for your needs. Reliable, affordable, and efficient.",
    icon: <Brush className="w-10 h-10 text-blue-500" />,
    link: "/book/cleaning",
  },
  {
    id: 2,
    name: "Moving",
    description:
      "Helping you move safely and easily with reliable transportation and support staff.",
    icon: <Truck className="w-10 h-10 text-green-500" />,
    link: "/book/moving",
  },
  {
    id: 3,
    name: "Gardening",
    description:
      "From lawn maintenance to landscaping — let our experts care for your outdoor spaces.",
    icon: <Sprout className="w-10 h-10 text-emerald-500" />,
    link: "/book/gardening",
  },
];

/*
  Grid view page displaying all service categories.
*/
const ServicesPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-16 px-6">
      {/* Page heading and short description */}
      <div className="max-w-6xl mx-auto text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Our Services</h1>
        <p className="text-gray-600 text-lg">
          Choose from our trusted service categories. Book instantly and get
          connected with verified providers.
        </p>
      </div>

      {/* Card grid layout for displaying services */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {services.map((service) => (
          <div
            key={service.id}
            className="bg-white shadow-md rounded-2xl p-8 hover:shadow-xl hover:scale-105 transition-all duration-300"
          >
            <div className="flex justify-center mb-4">{service.icon}</div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              {service.name}
            </h2>
            <p className="text-gray-600 mb-4">{service.description}</p>

            {/* Button that redirects user to the specific booking page */}
            <Link
              to={service.link}
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Book Now
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ServicesPage;
