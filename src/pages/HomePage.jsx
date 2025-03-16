import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { GiKnifeFork, GiHamburgerMenu } from 'react-icons/gi';
import { FaEnvelope, FaPhone, FaMapMarkerAlt, FaTwitter, FaInstagram, FaFacebookF } from 'react-icons/fa';
import { MdRestaurant, MdStar, MdRotate90DegreesCcw } from 'react-icons/md';
import VRSection from '../components/VRSection'; // Asegúrate de tener este componente

const HomePage = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    console.log('Formulario enviado:', formData);
    setFormData({ name: '', email: '', message: '' });
  };

  // Variantes para animaciones
  const titleVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8 } },
    hover: { scale: 1.02, color: '#f97316', transition: { duration: 0.3 } },
  };

  const logoVariants = {
    hover: { rotate: 15, color: '#f97316', transition: { duration: 0.3 } },
  };

  const textVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, staggerChildren: 0.1 } },
  };

  const letterVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0 },
  };

  const iconVariants = {
    hover: { scale: 1.2, color: '#f97316', transition: { duration: 0.3 } },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 font-poppins text-gray-800">
      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-white shadow-md z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center py-4">
          <div className="flex items-center space-x-3">
            <motion.div
              variants={logoVariants}
              whileHover="hover"
              className="text-orange-500 text-4xl"
            >
              <GiKnifeFork />
            </motion.div>
            <motion.span
              className="font-extrabold text-2xl sm:text-3xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-amber-500"
              initial="hidden"
              animate="visible"
              variants={textVariants}
              whileHover={{ scale: 1.02, color: '#f97316', transition: { duration: 0.3 } }}
            >
              {'Menú Digital'.split('').map((char, index) => (
                <motion.span key={index} variants={letterVariants}>
                  {char}
                </motion.span>
              ))}
            </motion.span>
          </div>
          <div className="hidden md:flex space-x-8">
            {['Inicio', 'Nosotros', '3D/VR', 'Planes', 'Contacto'].map((item) => (
              <motion.a
                key={item}
                whileHover={{ scale: 1.05, color: '#f97316' }}
                href={`#${item.toLowerCase().replace('/', '')}`}
                className="text-gray-700 font-medium"
              >
                {item}
              </motion.a>
            ))}
            <Link to="/login" className="text-orange-500 font-medium">Iniciar Sesión</Link>
            <Link to="/register" className="text-orange-500 font-medium">Registrarse</Link>
          </div>
          <button
            onClick={() => setIsMenuOpen(true)}
            className="md:hidden text-gray-700 text-2xl"
          >
            <GiHamburgerMenu />
          </button>
        </div>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ duration: 0.3 }}
            className="fixed top-0 right-0 w-3/4 max-w-xs h-full bg-gray-900 bg-opacity-90 backdrop-blur-md shadow-2xl z-50 p-6"
          >
            <button
              onClick={() => setIsMenuOpen(false)}
              className="text-white mb-6 text-xl font-bold"
            >
              X
            </button>
            {[
              { label: 'Inicio', section: 'inicio' },
              { label: 'Nosotros', section: 'nosotros' },
              { label: '3D/VR', section: '3dvr' },
              { label: 'Planes', section: 'planes' },
              { label: 'Contacto', section: 'contacto' },
            ].map((item) => (
              <motion.a
                key={item.label}
                whileHover={{ scale: 1.05, color: '#f97316' }}
                href={`#${item.section}`}
                className="block py-4 text-white text-lg font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </motion.a>
            ))}
            <Link to="/login" className="block py-4 text-orange-500 font-medium">Iniciar Sesión</Link>
            <Link to="/register" className="block py-4 text-orange-500 font-medium">Registrarse</Link>
          </motion.div>
        )}
      </nav>

      {/* Hero Section */}
      <header id="inicio" className="relative h-screen flex items-center justify-center">
        <video
          className="absolute inset-0 w-full h-full object-cover"
          src="/videos/nuevo-video.webm"
          autoPlay
          muted
          loop
          playsInline
        />
        <div className="absolute inset-0 bg-black opacity-60"></div>
        <div className="relative z-10 text-center text-white px-4 sm:px-6 max-w-4xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="text-3xl sm:text-4xl md:text-6xl font-extrabold tracking-tight mb-6"
          >
            Menús Digitales en Acción
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="text-base sm:text-lg md:text-2xl mb-10 max-w-2xl mx-auto"
          >
            Tecnología 3D y digital para transformar la experiencia de tus clientes.
          </motion.p>
          <div className="flex justify-center gap-4 sm:gap-6">
            <Link
              to="/register"
              className="bg-orange-500 text-white font-medium py-3 px-6 sm:px-8 rounded-full shadow-lg hover:bg-orange-600 transition-all duration-300 transform hover:scale-105"
            >
              Explora Planes
            </Link>
            <Link
              to="/register"
              className="bg-white text-orange-500 font-medium py-3 px-6 sm:px-8 rounded-full shadow-lg hover:bg-orange-600 hover:text-white transition-all duration-300 transform hover:scale-105"
            >
              Probar Gratis
            </Link>
          </div>
        </div>
      </header>

      {/* Sección Nosotros */}
      <section id="nosotros" className="py-12 sm:py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.img
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            src="/nosotros-img.jpg"
            alt="Nuestro equipo"
            className="w-full max-w-md mx-auto mb-6 rounded-lg shadow-md"
          />
          <motion.h2
            variants={titleVariants}
            initial="hidden"
            whileInView="visible"
            whileHover="hover"
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-6"
          >
            ¿Quiénes Somos?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-lg sm:text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto"
          >
            En Menú Digital, fusionamos tecnología y creatividad para ofrecer menús digitales que potencian tu restaurante.
          </motion.p>
        </div>
      </section>

      {/* Sección VR / 3D */}
      <section id="3dvr" className="py-12 sm:py-16 bg-amber-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2
            variants={titleVariants}
            initial="hidden"
            whileInView="visible"
            whileHover="hover"
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-8"
          >
            Explora en 3D y VR
          </motion.h2>
          <VRSection />
        </div>
      </section>

      {/* Sección Planes */}
      <section id="planes" className="py-12 sm:py-16 bg-amber-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2
            variants={titleVariants}
            initial="hidden"
            whileInView="visible"
            whileHover="hover"
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-12"
          >
            Elige Tu Plan Ideal
          </motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                title: 'Básico',
                price: '$19/mes',
                features: ['Menú Digital Básico', 'Soporte por Email', 'Actualizaciones Mensuales'],
                icon: <MdRestaurant className="text-6xl text-orange-500" />,
                bg: 'bg-gradient-to-br from-white to-orange-50',
              },
              {
                title: 'Pro',
                price: '$49/mes',
                features: ['Menú 3D Interactivo', 'Soporte Prioritario', 'Estadísticas de Uso'],
                icon: <MdStar className="text-6xl text-orange-500" />,
                bg: 'bg-gradient-to-br from-orange-50 to-amber-100',
              },
              {
                title: 'Premium',
                price: '$99/mes',
                features: ['Menú VR Completo', 'Soporte 24/7', 'Personalización Total'],
                icon: <MdRotate90DegreesCcw className="text-6xl text-orange-500" />,
                bg: 'bg-gradient-to-br from-white to-orange-50',
              },
            ].map((plan) => (
              <motion.div
                key={plan.title}
                whileHover={{ scale: 1.05, boxShadow: '0 15px 30px rgba(0, 0, 0, 0.1)' }}
                className={`${plan.bg} p-6 rounded-xl shadow-xl border border-orange-200 transition-all duration-300`}
              >
                <motion.div variants={iconVariants} whileHover="hover" className="mb-4">
                  {plan.icon}
                </motion.div>
                <h3 className="text-xl font-semibold text-gray-900">{plan.title}</h3>
                <p className="text-2xl font-bold text-orange-500 mt-2">{plan.price}</p>
                <ul className="text-gray-600 mt-4 space-y-2 text-sm text-center">
                  {plan.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
                <Link
                  to="/register"
                  className="mt-6 inline-block bg-orange-500 text-white py-2 px-6 rounded-full shadow-md hover:bg-orange-600 transition-all duration-300 transform hover:scale-105"
                >
                  Seleccionar
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Sección Contacto */}
      <section id="contacto" className="py-12 sm:py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            variants={titleVariants}
            initial="hidden"
            whileInView="visible"
            whileHover="hover"
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-extrabold text-gray-900 text-center mb-12"
          >
            ¡Hablemos!
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-6">Contáctanos Hoy</h3>
              <p className="text-gray-600 mb-8 text-base sm:text-lg">
                Eleva tu restaurante con menús digitales. ¡Envíanos un mensaje!
              </p>
              <div className="space-y-6 text-gray-700">
                <motion.div whileHover={{ x: 5 }} className="flex items-center">
                  <motion.div variants={iconVariants} whileHover="hover">
                    <FaEnvelope className="text-orange-500 mr-3 text-xl" />
                  </motion.div>
                  <p>info@menudigital.com</p>
                </motion.div>
                <motion.div whileHover={{ x: 5 }} className="flex items-center">
                  <motion.div variants={iconVariants} whileHover="hover">
                    <FaPhone className="text-orange-500 mr-3 text-xl" />
                  </motion.div>
                  <p>+1 234 567 890</p>
                </motion.div>
                <motion.div whileHover={{ x: 5 }} className="flex items-center">
                  <motion.div variants={iconVariants} whileHover="hover">
                    <FaMapMarkerAlt className="text-orange-500 mr-3 text-xl" />
                  </motion.div>
                  <p>123 Calle del Sabor, Ciudad</p>
                </motion.div>
              </div>
              <div className="mt-8">
                <iframe
                  title="Ubicación"
                  src="https://www.google.com/maps/embed?pb=..."
                  className="w-full h-64 rounded-lg shadow-md"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="bg-amber-50 p-6 sm:p-8 rounded-xl shadow-lg border border-orange-100"
            >
              <form onSubmit={handleFormSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-gray-800 font-medium mb-2">Nombre</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    className="w-full px-5 py-5 text-lg border border-orange-200 rounded-lg focus:outline-none focus:ring-4 focus:ring-orange-500 hover:border-orange-400 transition-all duration-300"
                    placeholder="Tu nombre"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-gray-800 font-medium mb-2">Correo Electrónico</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleFormChange}
                    className="w-full px-5 py-5 text-lg border border-orange-200 rounded-lg focus:outline-none focus:ring-4 focus:ring-orange-500 hover:border-orange-400 transition-all duration-300"
                    placeholder="tu@email.com"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-gray-800 font-medium mb-2">Mensaje</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleFormChange}
                    className="w-full px-5 py-5 text-lg border border-orange-200 rounded-lg focus:outline-none focus:ring-4 focus:ring-orange-500 hover:border-orange-400 transition-all duration-300"
                    placeholder="¿En qué podemos ayudarte?"
                    rows="4"
                    required
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.05, backgroundColor: '#f97316' }}
                  type="submit"
                  className="w-full bg-orange-500 text-white font-medium py-4 px-10 text-lg rounded-full shadow-lg transition-all duration-300 transform hover:scale-105"
                >
                  Enviar
                </motion.button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-gray-800 to-gray-900 py-12 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            whileHover={{ rotate: 15, color: '#f97316' }}
            className="text-4xl mb-6"
          >
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
            <motion.a
              whileHover={{ scale: 1.2, rotate: 15, color: '#f97316' }}
              href="https://twitter.com/menudigital"
              className="text-amber-100"
            >
              <FaTwitter className="text-3xl" />
            </motion.a>
            <motion.a
              whileHover={{ scale: 1.2, rotate: 15, color: '#f97316' }}
              href="https://instagram.com/menudigital"
              className="text-amber-100"
            >
              <FaInstagram className="text-3xl" />
            </motion.a>
            <motion.a
              whileHover={{ scale: 1.2, rotate: 15, color: '#f97316' }}
              href="https://facebook.com/menudigital"
              className="text-amber-100"
            >
              <FaFacebookF className="text-3xl" />
            </motion.a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;




