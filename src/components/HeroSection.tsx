import React from 'react'
import { motion, useReducedMotion } from 'motion/react'
import {
  TrendingUp,
  Cpu,
  Code2,
  Award,
  Sparkles,
} from 'lucide-react'
import LiquidSculptureHero from './ui/liquid-sculpture-hero'

export interface HeroSectionProps {
  onOpenLogin?: () => void
  onExplore?: () => void
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onOpenLogin, onExplore }) => {
  const shouldReduceMotion = useReducedMotion()

  const handleExplore = (e?: React.MouseEvent) => {
    if (e) e.preventDefault()
    if (onExplore) {
      onExplore()
      return
    }
    const elem = document.getElementById('academics')
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' })
    } else {
      window.location.hash = 'academics'
    }
  }

  const handleOpenPortal = (e?: React.MouseEvent) => {
    if (e) e.preventDefault()
    if (onOpenLogin) {
      onOpenLogin()
    } else {
      const elem = document.getElementById('portals-section')
      if (elem) {
        elem.scrollIntoView({ behavior: 'smooth' })
      } else {
        window.location.hash = 'portals-section'
      }
    }
  }

  const ribbonVariants = shouldReduceMotion
    ? {
        hidden: { opacity: 1, y: 0 },
        visible: { opacity: 1, y: 0 },
      }
    : {
        hidden: { opacity: 0, y: 16 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.6,
            delay: 0.35,
            ease: [0.21, 0.47, 0.32, 0.98] as const,
          },
        },
      }

  return (
    <section className="hero-section" id="hero-section">
      {/* 1. Liquid Sculpture Hero Canvas & Interactive Narrative */}
      <div className="w-full relative rounded-2xl overflow-hidden border border-white/8 bg-[#090d16] shadow-2xl">
        {/* Subtle Department Identity Pill in Top-Right or Floating Header */}
        <div className="absolute top-5 right-6 z-20 hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[11px] font-semibold tracking-wider uppercase backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" aria-hidden="true" />
          <span>CSE Department Platform</span>
        </div>

        <LiquidSculptureHero
          brand="Smart Hub"
          eyebrow="GEETHANJALI INSTITUTE OF SCIENCE AND TECHNOLOGY"
          headline={`Build. Learn.
Innovate.`}
          headlineAccent="Innovate."
          body="Your department's digital hub for academic resources, coding practice, student projects, placement preparation, and department updates."
          primaryCta={{
            label: 'Explore Smart Hub',
            href: '#academics',
            onClick: handleExplore,
          }}
          secondaryCta={{
            label: 'Student & Faculty Portal',
            href: '#portals-section',
            onClick: handleOpenPortal,
          }}
          backdropText="SMART HUB"
          showNav={false}
          showCredit={false}
          theme="dark"
          background="#090d16"
          darkBackground="#090d16"
          textColor="#f8fafc"
          accentColor="#3b82f6"
          height="auto"
          className="min-h-145 lg:min-h-155 py-6 sm:py-10"
          sculptureScale={1.05}
          sculptureX={16}
          sculptureY={0}
          interactive={true}
          liquid={1.1}
          turbulence={1.0}
          particleDensity={1.05}
          streaks={true}
        />
      </div>

      {/* 2. Key Metrics Ribbon */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={ribbonVariants}
        className="hero-metrics-ribbon"
        aria-label="Department Key Highlights"
      >
        <div className="metric-item" title="Subject to annual placement cell audit">
          <div className="metric-header">
            <TrendingUp className="metric-icon" aria-hidden="true" />
            <span className="metric-number">92.4% *</span>
          </div>
          <span className="metric-label">Placement Track Record</span>
        </div>

        <div className="metric-divider" aria-hidden="true" />

        <div className="metric-item" title="Verified campus computing facilities">
          <div className="metric-header">
            <Cpu className="metric-icon" aria-hidden="true" />
            <span className="metric-number">12+</span>
          </div>
          <span className="metric-label">Modern Computing Labs</span>
        </div>

        <div className="metric-divider" aria-hidden="true" />

        <div className="metric-item" title="Active student developer community">
          <div className="metric-header">
            <Code2 className="metric-icon" aria-hidden="true" />
            <span className="metric-number">500+</span>
          </div>
          <span className="metric-label">Active Student Coders</span>
        </div>

        <div className="metric-divider" aria-hidden="true" />

        <div className="metric-item" title="Institutional accreditation status">
          <div className="metric-header">
            <Award className="metric-icon" aria-hidden="true" />
            <span className="metric-number">NBA &bull; NAAC</span>
          </div>
          <span className="metric-label">Accredited Excellence</span>
        </div>
      </motion.div>

      <p className="text-[11px] text-slate-500 text-center -mt-1">
        * Department milestones and statistics are subject to annual administrative verification.
      </p>
    </section>
  )
}

export default HeroSection
