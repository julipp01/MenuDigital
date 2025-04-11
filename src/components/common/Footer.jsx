import React from 'react';
import { motion } from 'framer-motion';
import { GiKnifeFork } from 'react-icons/gi';
import { FaTwitter, FaInstagram, FaFacebookF } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-gradient-to-br from-gray-800 to-gray-900 py-12 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div whileHover={{ rotate: 15, color: '#f97316' }} className="text-4xl mb-6">
          <GiKnifeFork />
        </motion.div>
        <p className="text-gray-300 mb-8 text-base sm:text-lg">© 2025 Menú Digital. Todos los derechos reservados.</p>
        <div className="flex justify-center gap-8 mb-8">
          {['Inicio', 'Nosotros', 'Contacto'].map((section) => (
            <motion.a
              key={section}
              whileHover={{ scale: 1.05, color: '#f97316' }}
              href={`#${section.toLowerCase()}`}
              className="text-amber-100 text-lg font-medium"
            >
              {section}
            </motion.a>
          ))}
        </div>
        <div className="flex justify-center gap-8">
          <motion.a whileHover={{ scale: 1.2, color: '#f97316' }} href="https://twitter.com" className="text-amber-100">
            <FaTwitter className="text-3xl" />
          </motion.a>
          <motion.a whileHover={{ scale: 1.2, color: '#f97316' }} href="https://instagram.com" className="text-amber-100">
            <FaInstagram className="text-3xl" />
          </motion.a>
          <motion.a whileHover={{ scale: 1.2, color: '#f97316' }} href="https://facebook.com" className="text-amber-100">
            <FaFacebookF className="text-3xl" />
          </motion.a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;