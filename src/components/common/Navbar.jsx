import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { GiKnifeFork, GiHamburgerMenu } from "react-icons/gi";
import { FaTimes } from "react-icons/fa";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import { useAuth } from "../../contexts/AuthContext"; // Cambia esta línea

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useAuth(); // Añade este hook para obtener el estado del usuario

  const scrollToSection = (id) => {
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
      setIsMenuOpen(false);
    }
  };

  const iconVariants = {
    animate: {
      rotate: [0, 10, -10, 0],
      y: [0, -3, 0],
      transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
    },
  };

  const letterVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (index) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: index * 0.15,
        type: "spring",
        stiffness: 120,
        damping: 15,
      },
    }),
    hover: {
      y: -5,
      color: "#ffffff", // Blanco al pasar el mouse para contraste
      transition: { duration: 0.2, ease: "easeOut" },
    },
  };

  const nameLetters = ["M", "E", "N", "\u00DA", " ", "D", "I", "G", "I", "T", "A", "L"];

  return (
    <nav className="fixed top-0 w-full bg-white shadow-md z-50 font-roboto">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 flex justify-between items-center py-4">
        <div className="flex items-center space-x-3">
          <motion.div
            variants={iconVariants}
            animate="animate"
            className="text-orange-500 text-4xl"
          >
            <GiKnifeFork />
          </motion.div>
          <motion.div
            className="font-bold text-2xl sm:text-3xl tracking-wide text-orange-500 flex space-x-1" // Naranja para "MENÚ DIGITAL"
            initial="hidden"
            animate="visible"
          >
            {nameLetters.map((char, index) => (
              <motion.span
                key={index}
                custom={index}
                variants={letterVariants}
                initial="hidden"
                animate="visible"
                whileHover="hover"
                className="cursor-pointer"
              >
                {char}
              </motion.span>
            ))}
          </motion.div>
        </div>

        <div className="hidden md:flex space-x-8 items-center">
          <button
            onClick={() => scrollToSection("inicio")}
            className="text-gray-700 font-medium hover:text-orange-500 transition"
          >
            Inicio
          </button>
          <button
            onClick={() => scrollToSection("nosotros")}
            className="text-gray-700 font-medium hover:text-orange-500 transition"
          >
            Nosotros
          </button>
          <button
            onClick={() => scrollToSection("3dvr")}
            className="text-gray-700 font-medium hover:text-orange-500 transition"
          >
            3D/VR
          </button>
          <button
            onClick={() => scrollToSection("planes")}
            className="text-gray-700 font-medium hover:text-orange-500 transition"
          >
            Planes
          </button>
          <button
            onClick={() => scrollToSection("contacto")}
            className="text-gray-700 font-medium hover:text-orange-500 transition"
          >
            Contacto
          </button>
          {user ? (
            <>
              <Link to="/dashboard/home" className="text-orange-500 font-medium hover:underline">
                Dashboard
              </Link>
              <Link to="/" className="text-orange-500 font-medium hover:underline">
                Inicio
              </Link>
            </>
          ) : (
            <>
              <Link to="/login" className="text-orange-500 font-medium hover:underline">
                Iniciar Sesión
              </Link>
              <Link to="/register" className="text-orange-500 font-medium hover:underline">
                Registrarse
              </Link>
            </>
          )}
        </div>

        <button onClick={() => setIsMenuOpen(true)} className="md:hidden text-gray-700 text-2xl">
          <GiHamburgerMenu />
        </button>
      </div>

      {isMenuOpen && (
        <motion.div
          initial={{ opacity: 0, x: "100%" }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: "100%" }}
          transition={{ duration: 0.3 }}
          className="fixed top-0 right-0 w-3/4 max-w-xs h-full bg-gray-900 bg-opacity-90 backdrop-blur-md shadow-2xl z-50 p-6"
        >
          <button onClick={() => setIsMenuOpen(false)} className="text-white mb-6 text-xl font-bold">
            <FaTimes />
          </button>
          <motion.button
            whileHover={{ scale: 1.05, color: "#f97316" }}
            onClick={() => scrollToSection("inicio")}
            className="block py-4 text-white text-lg font-medium w-full text-left"
          >
            Inicio
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05, color: "#f97316" }}
            onClick={() => scrollToSection("nosotros")}
            className="block py-4 text-white text-lg font-medium w-full text-left"
          >
            Nosotros
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05, color: "#f97316" }}
            onClick={() => scrollToSection("3dvr")}
            className="block py-4 text-white text-lg font-medium w-full text-left"
          >
            3D/VR
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05, color: "#f97316" }}
            onClick={() => scrollToSection("planes")}
            className="block py-4 text-white text-lg font-medium w-full text-left"
          >
            Planes
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05, color: "#f97316" }}
            onClick={() => scrollToSection("contacto")}
            className="block py-4 text-white text-lg font-medium w-full text-left"
          >
            Contacto
          </motion.button>
          <Link to="/login" className="block py-4 text-orange-500 font-medium">
            Iniciar Sesión
          </Link>
          <Link to="/register" className="block py-4 text-orange-500 font-medium">
            Registrarse
          </Link>
        </motion.div>
      )}
    </nav>
  );
};

export default Navbar;




