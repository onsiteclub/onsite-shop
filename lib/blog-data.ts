export interface BlogPost {
  slug: string;
  tag: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  image: string;
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'why-construction-workers-deserve-a-brand',
    tag: 'Culture',
    title: 'Why Construction Workers Deserve a Brand That\'s Theirs',
    excerpt: 'Every skyline in this country was built by people who wake up before the sun. But the fashion industry has never made space for them. We\'re changing that — here\'s why OnSite Club exists.',
    date: 'Mar 15, 2025',
    readTime: '5 min read',
    image: 'https://www.onsiteclub.ca/_next/image?url=%2Fimages%2Fvision1.png&w=640&q=80',
  },
  {
    slug: 'getting-into-construction-ontario',
    tag: 'Guides',
    title: 'Getting Into Construction in Ontario: The No-BS Guide',
    excerpt: 'Certifications, safety gear, finding your first gig — everything you need to start your career in the trades. Written by someone who\'s been on the tools.',
    date: 'Mar 8, 2025',
    readTime: '8 min read',
    image: 'https://www.onsiteclub.ca/_next/image?url=%2Fimages%2Flearn.png&w=640&q=80',
  },
  {
    slug: 'behind-the-design-the-jump-tee',
    tag: 'Drops',
    title: 'Behind the Design: The Jump Tee',
    excerpt: 'Every piece we make has a story. The Jump was inspired by that first moment you step onto a frame for the first time — the adrenaline, the height, the pride.',
    date: 'Feb 28, 2025',
    readTime: '4 min read',
    image: 'https://www.onsiteclub.ca/_next/image?url=%2Fimages%2Fproduct-men.webp&w=640&q=80',
  },
  {
    slug: 'safety-gear-checklist-new-builder',
    tag: 'Safety',
    title: 'The Safety Gear Checklist Every New Builder Needs',
    excerpt: 'Hard hats, boots, glasses, gloves — what\'s required, what\'s recommended, and what the experienced crew actually wears on site every day.',
    date: 'Feb 20, 2025',
    readTime: '6 min read',
    image: 'https://www.onsiteclub.ca/_next/image?url=%2Fimages%2Fepis.png&w=640&q=80',
  },
];

export const SIDEBAR_TAGS = ['Culture', 'Guides', 'Drops', 'Safety', 'Tools', 'Crew Spotlight', 'Career'];
