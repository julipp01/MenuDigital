import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MdRestaurant, MdStar, MdRotate90DegreesCcw, MdQrCode, MdQrCodeScanner, MdTrendingUp, MdTimer, MdEdit, MdViewInAr, MdSend } from 'react-icons/md';
import VRSection from '../components/VRSection';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import theme from "../config/theme";

// Efecto innovador para íconos
const iconVariants = {
  initial: { scale: 1, y: 0, rotateY: 0 },
  animate: { scale: [1, 1.2, 1], y: [0, -5, 0], transition: { duration: 0.8, ease: "easeOut" } },
  hover: {
    scale: 1.3,
    y: -5,
    rotateY: 180,
    color: "#f97316", // orange-500
    transition: { type: "spring", stiffness: 300 },
  },
};

const HomePage = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [formSubmitted, setFormSubmitted] = useState(false);

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    console.log('Formulario enviado:', formData);
    setFormData({ name: '', email: '', message: '' });
    setFormSubmitted(true);
    setTimeout(() => setFormSubmitted(false), 3000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50" style={{ fontFamily: "'Inter', sans-serif" }}>
      <Navbar />

      <div className="flex-grow">
        {/* Hero Section */}
        <header id="inicio" className="relative min-h-screen flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 w-full h-full">
            <video
              className="w-full h-full object-cover"
              src="/videos/nuevo-video.webm" // Verifica la ruta
              autoPlay
              muted
              loop
              playsInline
              onError={() => console.log("Error cargando el video")}
            />
            <div className="absolute inset-0 bg-black opacity-20"></div>
          </div>
          <motion.div
            className="relative z-10 text-center text-white px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto bg-black/30 py-6 rounded-lg"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          >
            <motion.h1
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4 leading-tight text-white"
              style={{ fontFamily: "'Poppins', sans-serif", textShadow: "0 2px 4px rgba(0, 0, 0, 0.5)" }}
              whileHover={{ scale: 1.05 }}
            >
              Carta digital QR fácil e intuitiva para restaurantes y bares
            </motion.h1>
            <motion.p
              className="text-sm sm:text-base md:text-lg lg:text-xl mb-8 max-w-2xl mx-auto text-white/90 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Crea una carta digital QR personalizada para tu restaurante o bar en minutos
            </motion.p>
            <Link
              to="/register"
              className="inline-block bg-orange-500 text-white py-2 sm:py-3 px-6 sm:px-8 rounded-full text-sm sm:text-base font-semibold shadow-lg hover:bg-orange-600 transition-all duration-300 hover:shadow-xl"
            >
              <motion.span
                className="inline-block"
                whileHover={{ scale: 1.1, rotate: 3 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                Probar Gratis
              </motion.span>
            </Link>
          </motion.div>
        </header>

        {/* Sección ¿Cómo se usa? */}
        <section id="como-se-usa" className="py-8 sm:py-12 lg:py-16 bg-gray-50 text-center">
          <motion.h2
            className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 mb-12 relative inline-block after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-1 after:bg-orange-500 after:scale-x-0 after:transition-transform after:duration-300 hover:after:scale-x-100"
            style={{ fontFamily: "'Poppins', sans-serif" }}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.05, textShadow: "0 0 10px rgba(0, 0, 0, 0.2)" }}
          >
            ¿Cómo se usa?
          </motion.h2>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-3xl mx-auto px-4 mb-12 leading-relaxed">
            Tus clientes usarán su celular para escanear un código QR y acceder instantáneamente a una carta digital interactiva. Podrán explorar platos en tiempo real con imágenes 3D y realidad aumentada, mientras tú editas y personalizas todo al momento desde cualquier dispositivo. Transformá tu restaurante en una experiencia moderna, aumentá tus ventas y gestioná tu menú digital de manera rápida, segura y eficiente.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 px-4 max-w-5xl mx-auto">
            {[
              { icon: <MdQrCodeScanner />, title: "Escanea el QR", desc: "Acceso instantáneo a la carta digital." },
              { icon: <MdEdit />, title: "Edita al Instante", desc: "Actualiza tu menú en tiempo real." },
              { icon: <MdViewInAr />, title: "3D y AR", desc: "Platos que cobran vida para tus clientes." },
            ].map((step) => (
              <motion.div
                key={step.title}
                className="p-4 sm:p-6 bg-white rounded-xl shadow-lg relative overflow-hidden border border-gray-200"
                whileHover={{ scale: 1.05, boxShadow: "0 10px 20px rgba(0, 0, 0, 0.1)" }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <motion.div
                  className="mb-4 text-4xl sm:text-5xl text-orange-500 relative after:content-[''] after:absolute after:inset-0 after:bg-orange-200 after:opacity-0 after:rounded-full after:scale-0 hover:after:scale-150 hover:after:opacity-20 after:transition-all after:duration-300"
                  variants={iconVariants}
                  initial="initial"
                  animate="animate"
                  whileHover="hover"
                >
                  {step.icon}
                </motion.div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>{step.title}</h3>
                <p className="text-gray-600 mt-2 text-xs sm:text-sm leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Sección Beneficios */}
        <section id="beneficios" className="py-8 sm:py-12 lg:py-16 bg-gray-50 text-center">
          <motion.h2
            className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 mb-12 relative inline-block after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-1 after:bg-orange-500 after:scale-x-0 after:transition-transform after:duration-300 hover:after:scale-x-100"
            style={{ fontFamily: "'Poppins', sans-serif" }}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.05, textShadow: "0 0 10px rgba(0, 0, 0, 0.2)" }}
          >
            ¿Por qué elegirnos?
          </motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 px-4 max-w-5xl mx-auto">
            {[
              { icon: <MdQrCode />, title: "Menús QR Inteligentes", desc: "Personaliza y edita en tiempo real desde cualquier dispositivo." },
              { icon: <MdTrendingUp />, title: "Aumenta tus Ventas", desc: "Recomendaciones basadas en IA para potenciar tus ingresos." },
              { icon: <MdTimer />, title: "Ahorra Tiempo", desc: "Olvídate de imprimir y gestioná tu menú fácilmente." },
            ].map((benefit) => (
              <motion.div
                key={benefit.title}
                className="p-4 sm:p-6 bg-white rounded-xl shadow-lg relative overflow-hidden border border-gray-200"
                whileHover={{ scale: 1.05, boxShadow: "0 10px 20px rgba(0, 0, 0, 0.1)" }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <motion.div
                  className="mb-4 text-4xl sm:text-5xl text-orange-500 relative after:content-[''] after:absolute after:inset-0 after:bg-orange-200 after:opacity-0 after:rounded-full after:scale-0 hover:after:scale-150 hover:after:opacity-20 after:transition-all after:duration-300"
                  variants={iconVariants}
                  initial="initial"
                  animate="animate"
                  whileHover="hover"
                >
                  {benefit.icon}
                </motion.div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>{benefit.title}</h3>
                <p className="text-gray-600 mt-2 text-xs sm:text-sm leading-relaxed">{benefit.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Sección VR / 3D */}
        <section id="3dvr" className="py-8 sm:py-12 lg:py-16 bg-gray-50 text-center">
          <motion.h2
            className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 mb-8 relative inline-block after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-1 after:bg-orange-500 after:scale-x-0 after:transition-transform after:duration-300 hover:after:scale-x-100"
            style={{ fontFamily: "'Poppins', sans-serif" }}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.05, textShadow: "0 0 10px rgba(0, 0, 0, 0.2)" }}
          >
            Explora en 3D y VR
          </motion.h2>
          <VRSection />
        </section>

        {/* Sección Planes */}
        <section id="planes" className="py-8 sm:py-12 lg:py-16 bg-gray-50 text-center">
          <motion.h2
            className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 mb-12 relative inline-block after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-1 after:bg-orange-500 after:scale-x-0 after:transition-transform after:duration-300 hover:after:scale-x-100"
            style={{ fontFamily: "'Poppins', sans-serif" }}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.05, textShadow: "0 0 10px rgba(0, 0, 0, 0.2)" }}
          >
            Elige Tu Plan Ideal
          </motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 px-4 max-w-6xl mx-auto">
            {[
              {
                title: 'Básico',
                price: '$19/mes',
                features: ['Menú Digital Básico', 'Soporte por Email', 'Actualizaciones Mensuales'],
                icon: <MdRestaurant />,
                bg: 'bg-white',
              },
              {
                title: 'Pro',
                price: '$49/mes',
                features: ['Menú 3D Interactivo', 'Soporte Prioritario', 'Estadísticas de Uso'],
                icon: <MdStar />,
                bg: 'bg-white',
              },
              {
                title: 'Premium',
                price: '$99/mes',
                features: ['Menú VR Completo', 'Soporte 24/7', 'Personalización Total con IA'],
                icon: <MdRotate90DegreesCcw />,
                bg: 'bg-white',
              },
            ].map((plan) => (
              <motion.div
                key={plan.title}
                whileHover={{ scale: 1.05, boxShadow: '0 15px 30px rgba(0, 0, 0, 0.1)' }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className={`${plan.bg} p-4 sm:p-6 rounded-xl shadow-lg border border-gray-200 relative overflow-hidden`}
              >
                <motion.div
                  className="mb-4 text-4xl sm:text-5xl text-orange-500 relative after:content-[''] after:absolute after:inset-0 after:bg-orange-200 after:opacity-0 after:rounded-full after:scale-0 hover:after:scale-150 hover:after:opacity-20 after:transition-all after:duration-300"
                  variants={iconVariants}
                  initial="initial"
                  animate="animate"
                  whileHover="hover"
                >
                  {plan.icon}
                </motion.div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>{plan.title}</h3>
                <p className="text-lg sm:text-xl font-bold text-orange-500 mt-2">{plan.price}</p>
                <ul className="text-gray-600 mt-4 space-y-2 text-xs sm:text-sm leading-relaxed">
                  {plan.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
                <Link
                  to="/register"
                  className="mt-6 inline-block bg-orange-500 text-white py-2 px-6 rounded-full shadow-md hover:bg-orange-600 hover:shadow-xl transition-all duration-300 text-sm sm:text-base"
                >
                  Seleccionar
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Sección Contacto */}
        <section id="contacto" className="py-8 sm:py-12 lg:py-16 bg-gray-50 text-center">
          <motion.h2
            className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 mb-12 relative inline-block after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-1 after:bg-orange-500 after:scale-x-0 after:transition-transform after:duration-300 hover:after:scale-x-100"
            style={{ fontFamily: "'Poppins', sans-serif" }}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.05, textShadow: "0 0 10px rgba(0, 0, 0, 0.2)" }}
          >
            ¡Hablemos!
          </motion.h2>
          <form onSubmit={handleFormSubmit} className="max-w-md mx-auto space-y-4 px-4">
            <input
              type="text"
              name="name"
              placeholder="Nombre"
              className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all text-sm leading-relaxed"
              onChange={handleFormChange}
              value={formData.name}
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Correo Electrónico"
              className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all text-sm leading-relaxed"
              onChange={handleFormChange}
              value={formData.email}
              required
            />
            <textarea
              name="message"
              placeholder="Mensaje"
              className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all resize-none h-24 text-sm leading-relaxed"
              onChange={handleFormChange}
              value={formData.message}
              required
            ></textarea>
            <motion.button
              type="submit"
              className="w-full bg-orange-500 text-white py-2 rounded-md hover:bg-orange-600 hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 text-sm"
            >
              <motion.span
                variants={iconVariants}
                initial="initial"
                animate="animate"
                whileHover="hover"
              >
                <MdSend className="text-lg" />
              </motion.span>
              Enviar
            </motion.button>
            {formSubmitted && (
              <motion.p
                className="text-green-600 text-sm font-semibold leading-relaxed"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                ¡Mensaje enviado con éxito! Te contactaremos pronto.
              </motion.p>
            )}
          </form>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default HomePage;






