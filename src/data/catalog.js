// Shared catalog vocabulary. Keep this as the single source of truth for
// navigation, admin choices, URL parsing, and customer-facing filtering.
export const PRODUCT_TYPES = [
  { value: 'book', label: 'Book' },
  { value: 'stationery', label: 'Stationery' },
  { value: 'medical_essential', label: 'Medical / College Essential' },
  { value: 'engineering_essential', label: 'Engineering Essential' },
];

export const BOOK_CATEGORIES = ['School', 'Intermediate', 'Degree', 'Engineering / B.Tech', 'Medical', 'Competitive Exams'];
export const STATIONERY_CATEGORIES = ['Notebooks', 'Pen & Pencil', 'Eraser & Sharpener', 'Geometry Boxes', 'Art & Drawing', 'School Stationery', 'Office Stationery', 'Other Stationery'];
export const MEDICAL_ESSENTIAL_CATEGORIES = [
  'Medical Aprons', 'Stethoscopes', 'Medical Kits', 'Other College Essentials',
  'BP Operator', 'Mask', 'Pulse Oximeter', 'Gloves', 'OT Dress', 'Goniometer', 'Pen Torch', 'Knee Hammer', 'Tape', 'CNS Kit',
];
export const ENGINEERING_ESSENTIAL_CATEGORIES = ['Calculator', 'Engineering Instruments'];
export const STREAMS = ['MPC', 'BiPC'];
export const EXAMS = ['JEE', 'JEE Advanced', 'NEET', 'UPSC', 'Civil Services', 'Groups / State Services', 'SSC', 'Banking', 'Railways', 'APPSC / State Exams', 'Other Government Exams'];
export const APRON_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

// School classes: 1st through 10th.
export const SCHOOL_CLASSES = ['1st Class', '2nd Class', '3rd Class', '4th Class', '5th Class', '6th Class', '7th Class', '8th Class', '9th Class', '10th Class'];
// Intermediate years: 1st Year / 2nd Year, each split by stream (MPC/BiPC).
export const INTER_YEARS = ['1st Year', '2nd Year'];

export function slugify(value) { return value.toLowerCase().replace(/\s*\/\s*/g, '-').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''); }

const categoryBySlug = (items, slug) => items.find((item) => slugify(item) === slug);

export const catalogNavigation = [
  { label: 'Books', to: '/books', children: [
    { label: 'School', to: '/books/school' },
    { label: 'Intermediate', to: '/books/intermediate' },
    { label: 'Degree', to: '/books/degree' },
    { label: 'Engineering / B.Tech', to: '/books/engineering', children: [
      { label: 'Engineering Books', to: '/books/engineering' },
      ...ENGINEERING_ESSENTIAL_CATEGORIES.map((label) => ({ label, to: `/books/engineering/${slugify(label)}` })),
    ] },
    { label: 'Medical', to: '/books/medical', children: [
      { label: 'Medical Books', to: '/books/medical' },
      ...MEDICAL_ESSENTIAL_CATEGORIES.map((label) => ({ label, to: `/books/medical/${slugify(label)}` })),
    ] },
    { label: 'Competitive Exams', to: '/books/competitive', children: [
      { label: 'JEE', to: '/books/competitive/jee' }, { label: 'JEE Advanced', to: '/books/competitive/jee-advanced' }, { label: 'NEET', to: '/books/competitive/neet' },
      { label: 'UPSC', to: '/books/competitive/upsc', children: [{ label: 'Civil Services', to: '/books/competitive/upsc/civil-services' }, { label: 'Groups / State Services', to: '/books/competitive/upsc/groups-state-services' }] },
      { label: 'SSC', to: '/books/competitive/ssc' }, { label: 'Banking', to: '/books/competitive/banking' }, { label: 'Railways', to: '/books/competitive/railways' }, { label: 'APPSC / State Exams', to: '/books/competitive/appsc-state-exams' }, { label: 'Other Government Exams', to: '/books/competitive/other-government-exams' },
    ] },
  ] },
  { label: 'Stationery', to: '/stationery' },
];

/** Finds the nav node whose `to` exactly matches this pathname — used to show
 * "Refine by" chips for the next level down on the listing page itself,
 * since the dropdown menu is deliberately kept shallow (2 levels). */
export function findNavNode(pathname) {
  function search(nodes) {
    for (const node of nodes) {
      if (node.to === pathname) return node;
      if (node.children) {
        const found = search(node.children);
        if (found) return found;
      }
    }
    return null;
  }
  return search(catalogNavigation);
}

export function getCatalogCriteria(pathname) {
  const parts = pathname.split('/').filter(Boolean);
  if (parts[0] === 'stationery') return { productType: 'stationery', subcategory: categoryBySlug(STATIONERY_CATEGORIES, parts[1]), label: categoryBySlug(STATIONERY_CATEGORIES, parts[1]) || 'Stationery' };
  if (parts[0] === 'essentials') return { productType: 'medical_essential', subcategory: categoryBySlug(MEDICAL_ESSENTIAL_CATEGORIES, parts[1]), label: categoryBySlug(MEDICAL_ESSENTIAL_CATEGORIES, parts[1]) || 'Medical / College Essentials' };
  if (parts[0] !== 'books' || !parts[1]) return null;
  const [section, p2, p3, p4] = parts.slice(1);
  if (section === 'school') {
    const schoolClass = categoryBySlug(SCHOOL_CLASSES, p2);
    return { productType: 'book', category: 'School', schoolClass, label: ['School', schoolClass].filter(Boolean).join(' · ') };
  }
  if (section === 'degree') return { productType: 'book', category: 'Degree', label: 'Degree Books' };
  if (section === 'engineering') {
    // Same pattern as Medical below: /books/engineering alone = Engineering
    // BOOKS. /books/engineering/<item> = engineering essentials (calculator,
    // instruments), a different product type under the hood.
    const equipment = categoryBySlug(ENGINEERING_ESSENTIAL_CATEGORIES, p2);
    if (equipment) return { productType: 'engineering_essential', subcategory: equipment, label: `Engineering · ${equipment}` };
    return { productType: 'book', category: 'Engineering / B.Tech', label: 'Engineering / B.Tech Books' };
  }
  if (section === 'medical') {
    // /books/medical alone = medical BOOKS (unchanged). /books/medical/<equipment>
    // = medical equipment (aprons, stethoscopes, kits, etc.) — same "Medical"
    // section, just a different product type under the hood.
    const equipment = categoryBySlug(MEDICAL_ESSENTIAL_CATEGORIES, p2);
    if (equipment) return { productType: 'medical_essential', subcategory: equipment, label: `Medical · ${equipment}` };
    return { productType: 'book', category: 'Medical', label: 'Medical Books' };
  }
  if (section === 'intermediate') {
    const interYear = categoryBySlug(INTER_YEARS, p2);
    const stream = p3 === 'mpc' ? 'MPC' : p3 === 'bipc' ? 'BiPC' : undefined;
    const exam = p4 === 'jee' ? 'JEE' : p4 === 'jee-advanced' ? 'JEE Advanced' : p4 === 'neet' ? 'NEET' : undefined;
    return { productType: 'book', category: 'Intermediate', interYear, stream, exam, label: ['Intermediate', interYear, stream, exam].filter(Boolean).join(' · ') };
  }
  if (section === 'competitive') {
    const examMap = { jee: 'JEE', 'jee-advanced': 'JEE Advanced', neet: 'NEET', upsc: 'UPSC', ssc: 'SSC', banking: 'Banking', railways: 'Railways', 'appsc-state-exams': 'APPSC / State Exams', 'other-government-exams': 'Other Government Exams' };
    const exam = p3 === 'civil-services' ? 'Civil Services' : p3 === 'groups-state-services' ? 'Groups / State Services' : examMap[p2];
    return { productType: 'book', exam, label: exam ? `Competitive Exams · ${exam}` : 'Competitive Exams' };
  }
  return null;
}

export function matchesCatalogCriteria(product, criteria) {
  if (!criteria) return true;
  // Legacy documents have no productType; treat them as books so the existing
  // storefront never loses its established inventory.
  if ((product.productType || 'book') !== criteria.productType) return false;
  if (criteria.category && product.category !== criteria.category) return false;
  if (criteria.subcategory && product.subcategory !== criteria.subcategory) return false;
  if (criteria.schoolClass && product.schoolClass !== criteria.schoolClass) return false;
  if (criteria.interYear && product.interYear !== criteria.interYear) return false;
  if (criteria.stream && product.stream !== criteria.stream) return false;
  if (criteria.exam && !(product.exams || []).includes(criteria.exam)) return false;
  return true;
}
