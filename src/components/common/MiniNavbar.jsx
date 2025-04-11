import React from "react";
import { useTheme } from "../../contexts/ThemeContext";
import { motion } from "framer-motion";
import { GiKnifeFork } from "react-icons/gi";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

const MiniNavbar = () => {
  const { theme } = useTheme() || {};

  const iconVariants = {
    initial: { rotate: 0, y: 0 },
    hover: {
      rotate: 360,
      y: [-3, 3, -3],
      transition: { duration: 0.8, ease: "easeInOut" },
    },
  };

  const letterVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: (index) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: index * 0.1,
        type: "spring",
        stiffness: 150,
        damping: 10,
      },
    }),
    hover: {
      scale: 1.1,
      color: "#ffffff",
      textShadow: "0 0 10px rgba(255, 102, 0, 0.7)",
      transition: { duration: 0.2 },
    },
  };

  const nameLetters = ["M", "E", "N", "\u00DA", " ", "D", "I", "G", "I", "T", "A", "L"];

  return (
    <div className="fixed top-0 left-0 w-full z-40 p-3 sm:p-4 bg-gradient-to-r from-orange-500 to-orange-600 flex items-center shadow-lg">
      <motion.div
        variants={iconVariants}
        initial="initial"
        whileHover="hover"
        className="text-white text-3xl sm:text-4xl mr-3 cursor-pointer"
      >
        <GiKnifeFork />
      </motion.div>
      <motion.div
        className="font-bold text-lg sm:text-xl md:text-2xl tracking-wide text-white flex space-x-1"
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
  );
};

export default MiniNavbar;
