/**
 * Institutional & Platform Branding Configuration
 *
 * Central single-source-of-truth for institution, department, and platform identity.
 * Modify values here to update branding across the entire application.
 */

export interface InstitutionConfig {
  collegeName: string
  collegeAcronym: string
  collegeFullName: string
  departmentName: string
  departmentShortName: string
  platformName: string
  platformSubtitle: string
  /**
   * OFFICIAL COLLEGE LOGO SLOT:
   * To use the official college logo:
   * 1. Place your official logo file (e.g., gist-logo.png or gist-logo.svg) in the /public directory.
   * 2. Set this property to the path, e.g. '/gist-logo.png'.
   * When null, a clean, professional text-based academic badge is rendered automatically.
   */
  officialLogoUrl: string | null
}

export const institutionConfig: InstitutionConfig = {
  collegeName: 'Geethanjali Institute of Science and Technology',
  collegeAcronym: 'GIST',
  collegeFullName: 'Geethanjali Institute of Science and Technology (GIST)',
  departmentName: 'Department of Computer Science and Engineering',
  departmentShortName: 'CSE',
  platformName: 'Smart CSE Hub',
  platformSubtitle: 'Digital Platform for Students, Faculty & Administration',
  officialLogoUrl: null,
}
