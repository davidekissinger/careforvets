export const site = {
  name: 'CareForVets',
  origin: 'https://careforvets.com',
  email: 'info@careforvets.com',
  // Change only after substantive content review, not on every build.
  contentDate: '2026-11-06',
  reviewDue: '2027-02-06',
  owner: 'CareForVets content owner',
};

export const navigation = [
  { label: 'Find Care', path: '/care-navigation/' },
  { label: 'For Caregivers', path: '/caregivers/' },
  { label: 'Careers', path: '/careers/' },
  { label: 'Resources', path: '/resources/' },
  { label: 'Partners', path: '/partners/' },
];

export const categories = [
  { id: 'care-at-home', label: 'Care at home', path: '/resources/care-at-home/', description: 'Understand support options and where to start.' },
  { id: 'caregivers', label: 'Family caregiving', path: '/caregivers/', description: 'Find practical help for supporting someone you love.' },
  { id: 'disability', label: 'Disability and rehabilitation', path: '/resources/disability-and-rehabilitation/', description: 'Explore rehabilitation, mobility, and accessibility resources.' },
  { id: 'mental-health', label: 'Mental health support', path: '/resources/mental-health-support/', description: 'Find an appropriate starting point for support.' },
  { id: 'benefits', label: 'Veterans benefits', path: '/resources/veterans-benefits/', description: 'Start with official information and qualified assistance.' },
  { id: 'careers', label: 'Healthcare careers', path: '/careers/healthcare-careers/', description: 'Explore clinical and nonclinical opportunities.' },
];

export const legacyRedirects = [
  ['/home', '/'], ['/index.html', '/'],
  ['/veterans.html', '/care-navigation/'], ['/veterans', '/care-navigation/'],
  ['/home-health.html', '/resources/care-at-home/'], ['/home-health', '/resources/care-at-home/'],
  ['/partners.html', '/partners/'], ['/about.html', '/about/'],
  ['/contact.html', '/contact/'], ['/privacy.html', '/privacy/'], ['/terms.html', '/terms/'],
  ['/success.html', '/thank-you/'], ['/success', '/thank-you/'],
];

// This route is intentionally excluded from the generated site and sitemap.
// A location page requires genuine service scope and distinct local information.
export const conditionalPages = [{
  path: '/locations/toledo-oh/',
  title: 'Veteran Care Resources in Toledo Ohio | CareForVets',
  h1: 'Veteran Care Resources in Toledo Ohio',
  description: 'Explore verified veteran care resources in Toledo, Ohio, with local access information and practical next steps for veterans and caregivers.',
  status: 'Not published: service geography and local access information require verification',
}];
