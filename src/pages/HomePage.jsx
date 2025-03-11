import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { GiKnifeFork, GiHamburgerMenu } from 'react-icons/gi';
import { FaEnvelope, FaPhone, FaMapMarkerAlt, FaTwitter, FaInstagram, FaFacebookF } from 'react-icons/fa';
import { MdRestaurant, MdStar, MdRotate90DegreesCcw } from 'react-icons/md'; // Íconos válidos
import '@fontsource/poppins/400.css'; // Peso normal
import '@fontsource/poppins/600.css'; // Peso semibold
import '@fontsource/poppins/800.css'; // Peso extrabold
import VRSection from '../components/VRSection';

const HomePage = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert('Por favor, introduce un correo válido.');
      return;
    }
    console.log('Formulario enviado:', formData);
    setFormData({ name: '', email: '', message: '' });
  };

  // Variantes de animación
  const navVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const titleVariants = {
    hover: { scale: 1.05, color: '#f97316', transition: { duration: 0.3 } },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 font-poppins text-gray-800">
      {/* Navbar */}
      <motion.nav
        initial="hidden"
        animate="visible"
        variants={navVariants}
        className="bg-white shadow-xl fixed top-0 left-0 w-full z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <motion.div whileHover={{ rotate: 360, scale: 1.1 }} transition={{ duration: 0.6 }} className="text-orange-500">
              <GiKnifeFork className="text-4xl" />
            </motion.div>
            <span className="font-extrabold text-2xl sm:text-3xl tracking-tight">Cartear Digital</span>
          </div>
          <motion.div variants={navVariants} className="hidden md:flex space-x-8">
            {[
              { label: 'Inicio', section: 'inicio' },
              { label: 'Nosotros', section: 'nosotros' },
              { label: '3D/VR', section: '3d' },
              { label: 'Planes', section: 'planes' },
              { label: 'Contacto', section: 'contacto' },
            ].map((item) => (
              <motion.a
                key={item.label}
                variants={itemVariants}
                whileHover={{ scale: 1.1, color: '#f97316' }}
                href={`#${item.section}`}
                className="text-gray-700 font-medium transition duration-300"
              >
                {item.label}
              </motion.a>
            ))}
          </motion.div>
          <div className="hidden md:flex items-center space-x-4">
            <Link
              to="/login"
              className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition duration-300 font-medium shadow-md"
            >
              Iniciar Sesión
            </Link>
            <Link
              to="/register"
              className="bg-white text-orange-500 border border-orange-500 px-4 py-2 rounded-lg hover:bg-orange-500 hover:text-white transition duration-300 font-medium shadow-md"
            >
              Registrarse
            </Link>
          </div>
          <div className="md:hidden">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Abrir menú móvil"
              className="text-gray-700"
            >
              <GiHamburgerMenu className="text-3xl" />
            </motion.button>
            {isMenuOpen && (
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ duration: 0.4, ease: 'easeInOut' }}
                className="fixed top-0 right-0 w-3/4 max-w-xs h-full bg-white shadow-2xl z-50 p-6"
              >
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  onClick={() => setIsMenuOpen(false)}
                  className="text-gray-700 mb-6 text-xl font-bold"
                >
                  X
                </motion.button>
                {[
                  { label: 'Inicio', section: 'inicio' },
                  { label: 'Nosotros', section: 'nosotros' },
                  { label: '3D/VR', section: '3d' },
                  { label: 'Planes', section: 'planes' },
                  { label: 'Contacto', section: 'contacto' },
                ].map((item) => (
                  <motion.a
                    key={item.label}
                    whileHover={{ scale: 1.05, color: '#f97316' }}
                    href={`#${item.section}`}
                    className="block py-3 text-gray-700 text-lg font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.label}
                  </motion.a>
                ))}
                <Link to="/login" className="block py-3 text-orange-500 font-medium">Iniciar Sesión</Link>
                <Link to="/register" className="block py-3 text-orange-500 font-medium">Registrarse</Link>
              </motion.div>
            )}
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <header id="inicio" className="relative h-screen flex items-center justify-center bg-gradient-to-r from-orange-500 to-amber-400">
        <div className="absolute inset-0">
          <iframe
            title="Video de Presentación"
            className="w-full h-full object-cover"
            src="https://www.youtube.com/embed/24NXi-Ply-Q?autoplay=1&mute=1&loop=1&playlist=24NXi-Ply-Q"
            frameBorder="0"
            allow="autoplay; fullscreen"
            loading="lazy"
          />
        </div>
        <div className="absolute inset-0 bg-black opacity-60"></div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="relative z-10 text-center text-white px-4 sm:px-6 max-w-4xl mx-auto"
        >
          <motion.h1
            initial={{ y: -50 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-6 drop-shadow-lg"
          >
            Menús Digitales en Acción
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 1 }}
            className="text-lg sm:text-xl md:text-2xl mb-10 max-w-2xl mx-auto drop-shadow-md"
          >
            Tecnología 3D y digital para transformar la experiencia de tus clientes y gestionar tu restaurante con facilidad.
          </motion.p>
          <div className="flex justify-center gap-4 sm:gap-6">
            <motion.a
              whileHover={{ scale: 1.1, boxShadow: '0 10px 20px rgba(0, 0, 0, 0.2)' }}
              whileTap={{ scale: 0.95 }}
              href="#planes"
              className="bg-orange-500 text-white font-medium py-3 px-6 sm:px-8 rounded-full shadow-lg transition duration-300"
            >
              Explora Planes
            </motion.a>
            <motion.a
              whileHover={{ scale: 1.1, boxShadow: '0 10px 20px rgba(0, 0, 0, 0.2)' }}
              whileTap={{ scale: 0.95 }}
              href="#contacto"
              className="bg-white text-orange-500 font-medium py-3 px-6 sm:px-8 rounded-full shadow-lg transition duration-300"
            >
              Probar Gratis
            </motion.a>
          </div>
        </motion.div>
      </header>

      {/* Sección Nosotros */}
      <section id="nosotros" className="py-16 sm:py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            whileHover="hover"
            variants={titleVariants}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-6 tracking-tight cursor-pointer"
          >
            ¿Quiénes Somos?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto"
          >
            En Cartear Digital, fusionamos tecnología y creatividad para ofrecer menús digitales que potencian tu restaurante y deleitan a tus clientes.
          </motion.p>
        </div>
      </section>

      {/* Sección VR / 3D */}
      <section id="3d">
        <VRSection />
      </section>

      {/* Sección Planes Mejorada con Iconos Interactivos */}
      <section id="planes" className="py-16 sm:py-20 bg-amber-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            whileHover="hover"
            variants={titleVariants}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-12 tracking-tight cursor-pointer"
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
              },
              {
                title: 'Pro',
                price: '$49/mes',
                features: ['Menú 3D Interactivo', 'Soporte Prioritario', 'Estadísticas de Uso'],
                icon: <MdStar className="text-6xl text-orange-500" />,
              },
              {
                title: 'Premium',
                price: '$99/mes',
                features: ['Menú VR Completo', 'Soporte 24/7', 'Personalización Total'],
                icon: <MdRotate90DegreesCcw className="text-6xl text-orange-500" />, // Ícono válido
              },
            ].map((plan) => (
              <motion.div
                key={plan.title}
                whileHover={{ scale: 1.05, boxShadow: '0 15px 30px rgba(0, 0, 0, 0.1)' }}
                className="bg-white p-6 rounded-xl shadow-lg border border-orange-100 flex flex-col items-center"
              >
                <motion.div
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.6 }}
                  className="mb-4"
                >
                  {plan.icon}
                </motion.div>
                <h3 className="text-xl font-semibold text-gray-900">{plan.title}</h3>
                <p className="text-orange-500 mt-2 text-lg font-medium">{plan.price}</p>
                <ul className="text-gray-600 mt-4 space-y-2 text-sm text-center">
                  {plan.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="mt-6 bg-orange-500 text-white py-2 px-6 rounded-full hover:bg-orange-600 transition duration-300 font-medium"
                >
                  Seleccionar
                </motion.button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Sección Contacto */}
      <section id="contacto" className="py-16 sm:py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            whileHover="hover"
            variants={titleVariants}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-3xl sm:text-4xl font-extrabold text-gray-900 text-center mb-12 tracking-tight cursor-pointer"
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
                Eleva tu restaurante con menús digitales. ¡Envíanos un mensaje y empecemos!
              </p>
              <div className="space-y-6 text-gray-700">
                <motion.div whileHover={{ x: 10 }} className="flex items-center">
                  <FaEnvelope className="text-orange-500 mr-3 text-xl" />
                  <p>info@carteardigital.com</p>
                </motion.div>
                <motion.div whileHover={{ x: 10 }} className="flex items-center">
                  <FaPhone className="text-orange-500 mr-3 text-xl" />
                  <p>+1 234 567 890</p>
                </motion.div>
                <motion.div whileHover={{ x: 10 }} className="flex items-center">
                  <FaMapMarkerAlt className="text-orange-500 mr-3 text-xl" />
                  <p>123 Calle del Sabor, Ciudad</p>
                </motion.div>
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
                    className="w-full px-4 py-3 border border-orange-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white transition duration-200"
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
                    className="w-full px-4 py-3 border border-orange-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white transition duration-200"
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
                    className="w-full px-4 py-3 border border-orange-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white transition duration-200"
                    placeholder="¿En qué podemos ayudarte?"
                    rows="4"
                    required
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: '0 10px 20px rgba(0, 0, 0, 0.1)' }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  className="w-full bg-orange-500 text-white font-medium py-3 px-8 rounded-full shadow-md hover:bg-orange-600 transition duration-300"
                >
                  Enviar
                </motion.button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-orange-800 py-10 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-amber-100 mb-6 text-base sm:text-lg">© 2025 Cartear Digital. Todos los derechos reservados.</p>
          <div className="flex justify-center gap-6 mb-6">
            {['inicio', 'nosotros', 'contacto'].map((section) => (
              <motion.a
                key={section}
                whileHover={{ scale: 1.1, color: '#f97316' }}
                href={`#${section}`}
                className="text-amber-100 transition duration-300"
              >
                {section.charAt(0).toUpperCase() + section.slice(1)}
              </motion.a>
            ))}
          </div>
          <div className="flex justify-center gap-6">
            <motion.a whileHover={{ scale: 1.2, rotate: 15 }} href="https://twitter.com" className="text-amber-100">
              <FaTwitter className="text-xl" />
            </motion.a>
            <motion.a whileHover={{ scale: 1.2, rotate: 15 }} href="https://instagram.com" className="text-amber-100">
              <FaInstagram className="text-xl" />
            </motion.a>
            <motion.a whileHover={{ scale: 1.2, rotate: 15 }} href="https://facebook.com" className="text-amber-100">
              <FaFacebookF className="text-xl" />
            </motion.a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;




