"use client"

import { motion } from "framer-motion"
import { Pacifico } from "next/font/google"
import Image from "next/image"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useRef } from "react"

const pacifico = Pacifico({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-pacifico",
})

function ElegantShape({
  className,
  delay = 0,
  width = 400,
  height = 100,
  rotate = 0,
  gradient = "from-white/[0.08]",
}: {
  className?: string
  delay?: number
  width?: number
  height?: number
  rotate?: number
  gradient?: string
}) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: -150,
        rotate: rotate - 15,
      }}
      animate={{
        opacity: 1,
        y: 0,
        rotate: rotate,
      }}
      transition={{
        duration: 2.4,
        delay,
        ease: [0.23, 0.86, 0.39, 0.96],
        opacity: { duration: 1.2 },
      }}
      className={cn("absolute", className)}
    >
      <motion.div
        animate={{
          y: [0, 15, 0],
        }}
        transition={{
          duration: 12,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
        style={{
          width,
          height,
        }}
        className="relative"
      >
        <div
          className={cn(
            "absolute inset-0 rounded-full",
            "bg-gradient-to-r to-transparent",
            gradient,
            "backdrop-blur-[2px] border-2 border-white/[0.15]",
            "shadow-[0_8px_32px_0_rgba(255,255,255,0.1)]",
            "after:absolute after:inset-0 after:rounded-full",
            "after:bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_70%)]",
          )}
        />
      </motion.div>
    </motion.div>
  )
}

export default function HeroGeometric({
  badge = "",
  title1 = "Elevate Your",
  title2 = "Invoice Vision",
}: {
  badge?: string
  title1?: string
  title2?: string
}) {
  const billingRef = useRef<HTMLDivElement>(null);
  
  const scrollToBilling = () => {
    billingRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const fadeUpVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 1,
        delay: 0.5 + i * 0.2,
        ease: [0.25, 0.4, 0.25, 1],
      },
    }),
  }

  // Cloud fog animation variants
  const fogVariants = {
    animate: {
      opacity: [0.15, 0.25, 0.15],
      scale: [1, 1.05, 1],
      x: [0, 5, 0],
      y: [0, 3, 0],
      transition: {
        duration: 8,
        repeat: Infinity,
        repeatType: "reverse" as const,
        ease: "easeInOut"
      }
    }
  };

  return (
    <div className="relative w-full flex flex-col items-center overflow-hidden bg-[#030303]">
      <div className="min-h-screen w-full flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.05] via-transparent to-rose-500/[0.05] blur-3xl" />

        {/* Fog in top-left corner */}
        <motion.div 
          className="absolute top-0 left-0 w-[30vw] h-[20vh] bg-white/[0.15] rounded-full blur-3xl"
          variants={fogVariants}
          animate="animate"
          style={{ transformOrigin: 'center' }}
        />

        {/* Fog in top-right corner */}
        <motion.div 
          className="absolute top-0 right-0 w-[25vw] h-[15vh] bg-white/[0.18] rounded-full blur-3xl"
          variants={fogVariants}
          animate="animate"
          style={{ transformOrigin: 'center', animationDelay: '1s' }}
        />

        {/* Fog in bottom-left corner */}
        <motion.div 
          className="absolute bottom-0 left-0 w-[20vw] h-[20vh] bg-white/[0.16] rounded-full blur-3xl"
          variants={fogVariants}
          animate="animate"
          style={{ transformOrigin: 'center', animationDelay: '2s' }}
        />

        {/* Fog in bottom-right corner */}
        <motion.div 
          className="absolute bottom-0 right-0 w-[28vw] h-[18vh] bg-white/[0.17] rounded-full blur-3xl"
          variants={fogVariants}
          animate="animate"
          style={{ transformOrigin: 'center', animationDelay: '3s' }}
        />

        <div className="absolute inset-0 overflow-hidden">
          <ElegantShape
            delay={0.3}
            width={600}
            height={140}
            rotate={12}
            gradient="from-indigo-500/[0.15]"
            className="left-[-10%] md:left-[-5%] top-[15%] md:top-[20%]"
          />

          <ElegantShape
            delay={0.5}
            width={500}
            height={120}
            rotate={-15}
            gradient="from-rose-500/[0.15]"
            className="right-[-5%] md:right-[0%] top-[70%] md:top-[75%]"
          />

          <ElegantShape
            delay={0.4}
            width={300}
            height={80}
            rotate={-8}
            gradient="from-violet-500/[0.15]"
            className="left-[5%] md:left-[10%] bottom-[5%] md:bottom-[10%]"
          />

          <ElegantShape
            delay={0.6}
            width={200}
            height={60}
            rotate={20}
            gradient="from-amber-500/[0.15]"
            className="right-[15%] md:right-[20%] top-[10%] md:top-[15%]"
          />

          <ElegantShape
            delay={0.7}
            width={150}
            height={40}
            rotate={-25}
            gradient="from-cyan-500/[0.15]"
            className="left-[20%] md:left-[25%] top-[5%] md:top-[10%]"
          />
        </div>

        <div className="relative z-10 container mx-auto px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div custom={1} variants={fadeUpVariants} initial="hidden" animate="visible">
              <h1 className="text-4xl sm:text-6xl md:text-8xl font-bold mb-6 md:mb-8 tracking-tight">
                <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/80">{title1}</span>
                <br />
                <span
                  className={cn(
                    "bg-clip-text text-transparent bg-gradient-to-r from-[#6366f1] via-white/90 to-[#f43f5e] ",
                    pacifico.className,
                  )}
                >
                  {title2}
                </span>
              </h1>
            </motion.div>

            <motion.div custom={2} variants={fadeUpVariants} initial="hidden" animate="visible">
              <p className="text-base sm:text-lg md:text-xl text-white/40 mb-8 leading-relaxed font-light tracking-wide max-w-xl mx-auto px-4">
                Crafting exceptional digital experiences through innovative design and cutting-edge technology.
              </p>
            </motion.div>
            
            <motion.div custom={3} variants={fadeUpVariants} initial="hidden" animate="visible">
              <button 
                onClick={scrollToBilling}
                className="px-8 py-3 rounded-full bg-gradient-to-r from-[#6366f1] via-white/90 to-[#f43f5e] text-black font-medium
                shadow-lg hover:shadow-indigo-500/20 transition-all duration-300 hover:scale-105 transform
                focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:ring-opacity-50">
                Start
              </button>
            </motion.div>
          </div>
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-transparent to-[#030303]/80 pointer-events-none" />
      </div>
      
      {/* Billing App Section */}
      <div ref={billingRef} className="w-full flex items-center justify-center p-6 md:p-12 relative" style={{ minHeight: "310vh" }}>
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.05] via-transparent to-rose-500/[0.05] blur-3xl" />

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="w-full max-w-7xl bg-white rounded-3xl shadow-2xl overflow-hidden h-auto relative z-10"
        >
          <div className="w-full" style={{ height: "300vh" }}>
            <iframe
              src="/mobile-billing-app/index.html"
              className="w-full h-full border-0"
              title="Billing Software"
              scrolling="no"
              style={{ transform: "scale(1)", transformOrigin: "top center" }}
            />
          </div>
        </motion.div>
      </div>
    </div>
  )
}
