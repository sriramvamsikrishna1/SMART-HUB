import React from 'react'

export const Footer: React.FC = () => {
  return (
    <footer className="landing-footer" id="main-footer">
      <div className="landing-footer-container">
        <div className="landing-footer-info">
          <strong className="landing-footer-title">Smart Hub</strong>
          <span className="landing-footer-dot" aria-hidden="true">&bull;</span>
          <span className="landing-footer-dept">Computer Science and Engineering</span>
          <span className="landing-footer-dot" aria-hidden="true">&bull;</span>
          <span className="landing-footer-inst">Geethanjali Institute of Science and Technology</span>
        </div>
        <div className="landing-footer-copy">
          Copyright &copy; 2026
        </div>
      </div>
    </footer>
  )
}

export default Footer
