// Default site content. Every key here is editable from the admin panel (stored in D1 `kv`).
// Keys starting with "_" are private (never sent to the public site).
export const DEFAULTS = {
  _security: { admin_2fa: true },
  brand: { name: 'Jangid Cuts', bigword: 'JANGID CUTS', loader_role: 'Video Editor & Graphic Designer' },
  seo: { title: 'Jangid Cuts | Prashant Jangid · Video Editor & Graphic Designer', description: 'Prashant Jangid (Jangid Cuts), video editor and graphic designer from Jaipur. Reels, YouTube, wedding films, ads, colour grading and thumbnails.' },
  hero: { hello: 'Hello, I am', name: 'Prashant Jangid', role: 'Video Editor & Graphic Designer', cta: 'Hire Me', photo: '/img/hero-n708.webp', photo_alt: 'Prashant Jangid, video editor and graphic designer', bw: true, zoom: 100, shift_y: 0 },
  about: {
    editor_title: 'About the editor', editor_photo: '/img/hero-n708.webp',
    editor_body: "I'm Prashant Jangid, a video editor and graphic designer. For 5+ years I have been editing reels and shorts, YouTube videos, wedding films, ads and promos, plus colour grading, motion graphics and thumbnails.\n\nI work in DaVinci Resolve and care about the small things: pacing, sound and colour.",
    brand_title: 'About Jangid Cuts', brand_photo: '/img/f2_0.jpg',
    brand_body: "Jangid Cuts is a video editing and design studio for creators, brands and wedding filmmakers, in India and worldwide.\n\nWe also make editing packs, LUTs and SFX you can download from the store."
  },
  welcome: { show: true, title: 'Welcome', sub: 'Sign in to buy packs, hire us and download freebies, or just look around.', signin: 'Sign in / Sign up', skip: 'Start without sign in' },
  ads: { enabled: false, publisher_id: '', slots: { home_mid: '', portfolio: '', services: '', store: '' } },
  app: { version: '1.0.0' },
  stats: [
    { icon: 'users', num: 50, suffix: '+', label: 'Happy Clients' },
    { icon: 'clock', num: 5, suffix: '+', label: 'Years Experience' },
    { icon: 'film', num: 500, suffix: '+', label: 'Videos Edited' },
    { icon: 'bolt', num: 24, suffix: 'h', label: 'Fast Delivery' }
  ],
  home: {
    work_eyebrow: 'Portfolio', work_title: 'Featured Work', work_btn: 'View Portfolio',
    svc_eyebrow: 'Services', svc_title: 'What We Do', svc_link: 'View details', svc_more: 'More services', svc_count: 6,
    pf_banner: { show: true, eyebrow: 'Portfolio', title: 'Step into the full portfolio', sub: 'Video edits and thumbnails, sorted by category.', btn: 'Open Portfolio', image: '/img/f2_0.jpg' },
    rev_eyebrow: 'Reviews', rev_title: 'What Clients Say', rev_note: 'Average from client reviews',
    show_stats: true, show_work: true, show_services: true, show_reviews: true
  },
  services: [
    { slug: 'colour-grading', title: 'Colour Grading', desc: 'Cinematic looks from Log footage. Skin tones that pop, moods that match your story.', full: 'Cinematic colour grading in DaVinci Resolve. I balance your shots, fix skin tones and build a look that matches the mood of your story, from Log or phone footage.\n\nWhat you get:\n- Shot matching and correction\n- A custom cinematic look\n- Before/after preview', image: '/img/f8_0.jpg', tag: 'Service', main: true },
    { slug: 'reels-shorts', title: 'Reels & Shorts', desc: 'Scroll-stopping vertical edits with beat-sync, captions, transitions and SFX.', full: 'Vertical edits built to stop the scroll: fast hooks, beat-synced cuts, captions, transitions and sound design for Instagram Reels and YouTube Shorts.', image: '/img/f0_1.jpg', tag: 'Service', main: true },
    { slug: 'youtube-videos', title: 'YouTube Videos', desc: 'Long-form edits with pacing, B-roll, music and retention-focused cuts.', full: 'Long-form YouTube edits with tight pacing, B-roll, music, zooms, text and retention-focused cuts, so people keep watching.', image: '/img/f2_0.jpg', tag: 'Service', main: true },
    { slug: 'wedding-films', title: 'Wedding Films', desc: 'Highlight films and teasers that feel like a movie, graded to perfection.', full: 'Wedding highlight films, teasers and pre-wedding edits that feel like a movie, with music, story and a cinematic grade.', image: '/img/f8_1.jpg', tag: 'Service', main: true },
    { slug: 'ads-promos', title: 'Ads & Promos', desc: 'Product and brand promos with motion graphics that sell.', full: 'Product ads and brand promos with motion graphics, clean typography and sound design, made to sell.', image: '/img/f3_0.jpg', tag: 'Service', main: true },
    { slug: 'thumbnails-graphics', title: 'Thumbnails & Graphics', desc: 'Click-worthy YouTube thumbnails, posters and social graphics.', full: 'Click-worthy YouTube thumbnails, posters and social media graphics designed to get attention.', image: '/img/t1.jpg', tag: 'Service', main: true },
    { slug: 'motion-graphics', title: 'Motion Graphics', desc: 'Titles, logo animation, lower thirds and animated text.', full: 'Animated titles, logo reveals, lower thirds and kinetic text for videos and brands.', image: '/img/f3_1.jpg', tag: 'Service', main: false },
    { slug: 'podcast-editing', title: 'Podcast Editing', desc: 'Multi-cam podcast cuts and short clips for social.', full: 'Multi-cam podcast editing plus short highlight clips for social media.', image: '/img/f4_1.jpg', tag: 'Service', main: false }
  ],
  faq: [
    { q: 'How do I send my raw footage?', a: 'Share a Google Drive (or any cloud) link in the Hire Me form. Large files are totally fine.' },
    { q: 'How long does an edit take?', a: 'Reels usually 24–48 hours, long YouTube videos 2–5 days, depending on length and complexity.' },
    { q: 'How many revisions do I get?', a: 'Revisions are included until you are happy with the edit, within the agreed scope.' },
    { q: 'How do I pay?', a: 'Secure payments by UPI (GPay, PhonePe, Paytm), cards and net banking. You get a receipt by email.' },
    { q: 'Where do I find my downloads?', a: 'In your profile under My Orders & Downloads. Everything you buy stays on your account email for lifetime.' },
    { q: 'Can I get a refund?', a: 'Refunds are only possible if the product was not delivered. Once the download is enabled, the purchase cannot be refunded. See the Privacy & Refund policy.' }
  ],
  footer: { about: 'Video editing & graphic design by Prashant Jangid. Reels, YouTube, weddings, ads, colour grading, thumbnails & much more.', copyright: '© {year} Jangid Cuts. All rights reserved.', made_in: 'Made in Jaipur, India', show_location: false },
  socials: [
    { name: 'Instagram', icon: 'ig', url: 'https://instagram.com/jangidcuts', handle: '@jangidcuts' },
    { name: 'YouTube', icon: 'yt', url: 'https://www.youtube.com/@jangidcutsofficial', handle: '@jangidcutsofficial' },
    { name: 'Telegram', icon: 'tg', url: 'https://t.me/jangidcuts', handle: 't.me/jangidcuts' },
    { name: 'Pinterest', icon: 'pin', url: 'https://www.pinterest.com/jangidcuts/', handle: 'jangidcuts' },
    { name: 'WhatsApp Channel', icon: 'wa', url: 'https://whatsapp.com/channel/0029VbDPSvz11ulFkdMulk3e', handle: 'Jangid Cuts' },
    { name: 'Facebook', icon: 'fb', url: 'https://www.facebook.com/jangidcuts', handle: 'Jangid Cuts' }
  ],
  contact: {
    title: 'Contact', intro: 'Pick whatever is easiest for you. I usually reply within a few hours (9 AM – 6 PM IST).',
    whatsapp: '+919351664400', call: '+919351664400', email: 'jangidcuts@gmail.com',
    instagram_dm: 'https://ig.me/m/jangidcuts', telegram: 'https://t.me/jangidcuts', hours: '9:00 AM – 6:00 PM IST'
  },
  pages: {
    about: { title: 'About', body: "I'm Prashant Jangid, a video editor and graphic designer from Jaipur. I have been editing for 5+ years: reels and shorts, YouTube videos, wedding films, ads and promos, colour grading, motion graphics and thumbnails.\n\nJangid Cuts is the brand I started in the last few months to bring all of that work under one name. I work with creators, brands and agencies in India and abroad.\n\n## Tools\nDaVinci Resolve, CapCut Pro, VN and more.\n\n## How I work\nYou send the raw footage and a short brief, I send a first cut, we polish it together until you are happy." },
    how_i_work: { title: 'How I Work', body: "## 1. Brief\nFill the Hire Me form or message me. Tell me what you need, your deadline and your budget.\n\n## 2. Footage\nShare your raw files with a Google Drive (or any cloud) link.\n\n## 3. First cut\nYou get the first version, usually within 24–48 hours for reels.\n\n## 4. Revisions\nWe polish it together until you are happy, within the agreed scope.\n\n## 5. Delivery\nFinal export in the format you need." },
    privacy: { title: 'Privacy & Refund Policy', body: "## What we collect\nYour name and email when you create an account, fill a form or buy something. Payment details are handled by the payment provider; we never see or store your card or UPI PIN.\n\n## How we use it\nTo deliver your orders, reply to your messages and tickets, and (only if you allow it in Settings) send offers and new product emails.\n\n## Your rights\nYou can download or delete your account any time from Settings.\n\n## Refund policy\nDigital products are delivered instantly. A refund is only possible if the product was not delivered to you. Once the download has been enabled for your account, the purchase cannot be refunded.\n\nFor any issue, raise a ticket from the Support page." },
    terms: { title: 'Terms & Conditions', sections: [
      { id: 'general', title: 'General', body: 'By using this website you agree to these terms. Jangid Cuts may update them; the latest version is always on this page.' },
      { id: 'account', title: 'Accounts & Login', body: 'Keep your login secure. One account per person. We may suspend accounts that misuse the site.' },
      { id: 'purchase', title: 'Purchases & Downloads', body: 'Products are licensed for your own use. Re-selling or sharing purchased files is not allowed. Lifetime access is provided on your account email. Refunds only if the product was not delivered.' },
      { id: 'hire', title: 'Hiring & Client Work', body: 'Project scope, price and deadline are agreed before work starts. Revisions are included within the agreed scope. Final files are delivered after payment.' },
      { id: 'support', title: 'Support & Tickets', body: 'Tickets are private and answered by email. Please do not share passwords or payment details in a ticket.' },
      { id: 'reviews', title: 'Reviews', body: 'Reviews must be honest and respectful. Offensive reviews are removed.' }
    ] },
    licence: { title: 'Licence', body: 'Free and paid resources from the Jangid Cuts store are licensed for personal and commercial projects you create. You may not re-sell, re-upload or share the files themselves.' },
    shipping: { title: 'Shipping / Delivery Policy', body: 'All products are digital. Small files are available to download right after purchase from My Orders. Large packs are delivered by a private link sent to your registered email from jangidcuts@gmail.com. Nothing is shipped physically.' },
    support: { title: 'Support', body: 'Facing an issue with an order, a download or your account? Raise a ticket below. You get a ticket number right away and the solution by email.' }
  },
  store: {
    title: 'Store', intro: 'Templates, LUTs, editing packs, SFX and more. Free and paid.',
    free_label: 'Free', paid_label: 'Paid', owned_label: 'Owned',
    empty_owned: "You haven't purchased anything yet",
    empty: 'New packs are coming soon.',
    big_file_msg: 'The download link has been sent to your registered email.',
    first_download_msg: 'Download started — you can find this in your local storage.',
    price_filters: [ { label: 'Under ₹100', min: 0, max: 99 }, { label: '₹100 – ₹299', min: 100, max: 299 }, { label: '₹300 – ₹999', min: 300, max: 999 }, { label: '₹1000+', min: 1000, max: 0 } ],
    bundles: [ { min_items: 2, pct: 10 }, { min_items: 3, pct: 15 } ],
    usd_rate: 84,
    storage_note: 'Cloud file storage activation is pending. Until then, use files up to 25 MB or a Google Drive / external link.'
  },
  hire_form: {
    title: 'Hire Me', intro: 'Tell me about your project. I reply by email.',
    categories: ['Reels / Shorts','YouTube Long Video','Vlog','Podcast','Wedding Film','Pre-wedding','Engagement','Birthday / Event','Corporate Video','Product Ad','Brand Promo','Real Estate','Travel','Gaming','Music Video','Song / Beat-sync Edit','Colour Grading','Motion Graphics','Logo Animation','Documentary','Short Film','Trailer / Teaser','Educational / Coaching','Fitness','Food','Fashion','Tech Review','Unboxing','Faceless YouTube','Anime / AMV','Sports Highlights','Interview','Thumbnail Design','Poster / Social Graphics','Other'],
    perday: ['1','2','3','Custom'], formats: ['Shorts / Reels','Full YouTube video','Both'], plans: ['Per video','Monthly','One-time project'],
    budgets: ['Under ₹2,000','₹2,000 – ₹5,000','₹5,000 – ₹15,000','₹15,000+','$100 – $500','$500+','Not sure yet'],
    word_limit: 500, thanks: "Thanks! Your request is in. You'll get a reply on your email soon."
  },
  help: { title: 'Questions & Help', issue_title: 'Facing any issue? Let us know', issue_note: "We'll reply by email with a ticket number.", thanks: 'Thanks! Your ticket {number} is created. A confirmation is on its way to your email.', support_email: 'supportjangidcuts@gmail.com', support_note: 'Only support-related emails here (orders, downloads, account, tickets).', business_email: 'jangidcuts@gmail.com' },
  languages: ['en','hi','es','fr','de','ar','pt','ja'],
  mail_templates: {
    otp: { subject: 'Your Jangid Cuts code: {code}', body: 'Hi {name},\n\nYour verification code is {code}. It expires in 10 minutes.\n\nIf you did not ask for this, you can ignore this email.\n\nJangid Cuts' },
    hire_received: { subject: 'We received your project request ({number})', body: 'Hi {name},\n\nThank you for reaching out to Jangid Cuts. Your project request {number} has been received. I will review it and get back to you shortly.\n\nBest regards,\nPrashant Jangid\nFounder, Jangid Cuts' },
    hire_approved: { subject: 'Ready to work with you — Jangid Cuts [{number}]', body: "Hi {name},\n\nThank you for your project request ({number}). I have reviewed your brief and I'm ready to work with you.\n\nPlease reply to this email with your raw footage link and any references, and we will get started.\n\nBest regards,\nPrashant Jangid\nFounder, Jangid Cuts\njangidcuts@gmail.com · Instagram @jangidcuts" },
    ticket_received: { subject: 'Ticket {number} received — Jangid Cuts Support', body: 'Hi {name},\n\nThank you for contacting Jangid Cuts Support. Your ticket {number} has been created and we are looking into it.\n\nYour message:\n{message}\n\nJangid Cuts Support' },
    ticket_status: { subject: 'Ticket {number} update: {status}', body: 'Dear {name},\n\nThank you for reaching out to Jangid Cuts Support. Your ticket {number} is now: {status}.\n\n{note}\n\nTrack your request any time: {track}\n\nRegards,\nTeam Jangid Cuts' },
    ticket_solved: { subject: 'Your ticket {number} has been resolved', body: 'Hi {name},\n\nYour ticket {number} has been resolved. Here is the solution:\n\n{solution}\n\nIf you still need help, reply to this email.\n\nJangid Cuts Support' },
    order_paid: { subject: 'Thank you for your purchase — Order {number}', body: 'Hi {name},\n\nThank you for purchasing from Jangid Cuts! Your order {number} is confirmed.\n\n{items}\n\nTotal: {total}\n\nYour downloads are available any time in My Orders: {link}\n\nBest regards,\nPrashant Jangid\nFounder, Jangid Cuts' },
    download_link: { subject: 'Your download link — {product} [{number}]', body: 'Hi {name},\n\nHere is your private download link for {product} (order {number}):\n{link}\n\nThis link is only for your account email. Please do not share it.\n\nJangid Cuts' },
    order_status: { subject: 'Order {number}: {status}', body: 'Hi {name},\n\nYour order {number} is now: {status}.{refund}\n\nTrack it here: {link}\n\nJangid Cuts' }
  },
  payments_public: { currency: 'INR', note: 'Secure payments by UPI (GPay, PhonePe, Paytm), cards, net banking and wallets.' },
  portfolio_page: { eyebrow: 'Jangid Cuts', title: 'My Work', lead: 'Edits and thumbnails, sorted by category. Tap anything to watch or zoom in.', video_label: 'Video Portfolio', thumb_label: 'Thumbnail Portfolio', email: 'jangidcuts@gmail.com' },
  portfolio_rows: {
    video: [ { title: 'Trending Now', auto: true, source: 'featured' }, { title: 'Colour Grading', source: 'cat:Colour Grading' }, { title: 'Song Edits', source: 'cat:Song Edits' }, { title: 'YouTube & Cinematic', source: 'cat:YouTube & Cinematic' } ],
    thumb: [ { title: 'Most Clicked', auto: true, source: 'featured' }, { title: 'YouTube Thumbnails', source: 'cat:YouTube' } ]
  },
  _alerts: { email: 'jangidcuts@gmail.com', telegram_bot_token: '', telegram_chat_id: '' },
  _payments: { provider: 'test', key_id: '', key_secret_enc: '', webhook_secret_enc: '' }
};

export const SEED_CATEGORIES = {
  portfolio_video: { 'Colour Grading': ['Bridal', 'Log footage'], 'Wedding': ['Highlights', 'Bridal portraits'], 'Reels & Shorts': ['Beat-sync', 'Promo reels'], 'Ads & Promos': ['Product ads'], 'YouTube & Cinematic': ['Travel', 'Cinematic'], 'Song Edits': ['Music video'], 'Events': ['Birthday'] },
  portfolio_thumb: { 'YouTube': ['Vlog', 'Travel', 'Tutorial'], 'Before / After': ['Colour grade'], 'Ads & Brands': ['Product'], 'Lifestyle': ['Events', 'Day in life'] },
  store_free: { 'LUTs': [], 'SFX Packs': [], 'Templates': [] },
  store_paid: { 'Editing Packs': [], 'LUTs': [], 'Presets': [] }
};

export const SEED_PORTFOLIO = {
  video: [
    ['RAW vs Cinematic Grade','Colour Grading','Bridal','f0_0.jpg','v','c1.mp4',1],['S-Log3 to Cinematic','Colour Grading','Log footage','f1_0.jpg','v','',0],
    ['Monster Energy · Spec Ad','Ads & Promos','Product ads','f3_0.jpg','v','',1],['Gucci · Song Edit','Song Edits','Music video','f4_0.jpg','h','',1],
    ['Alpine Colour Story','YouTube & Cinematic','Travel','f2_0.jpg','h','c4.mp4',1],['Wedding Grade · Golden','Wedding','Bridal portraits','f8_0.jpg','v','',1],
    ['Raw vs Graded Wedding','Wedding','Highlights','f7_1.jpg','v','',0],['Forest · Cinematic Cut','YouTube & Cinematic','Cinematic','f5_0.jpg','h','',1],
    ['Birthday Highlight','Events','Birthday','f6_0.jpg','v','',1],['Bridal Close-up Grade','Colour Grading','Bridal','f1_1.jpg','v','',0],
    ['Mountain Drive','YouTube & Cinematic','Travel','f2_1.jpg','h','',0],['Song Edit · Night Mood','Song Edits','Music video','f4_1.jpg','h','',0],
    ['Woods · Slow Cinema','YouTube & Cinematic','Cinematic','f5_1.jpg','h','',0],['Party Recap Reel','Reels & Shorts','Beat-sync','f6_1.jpg','v','',1],
    ['Bride Portrait Grade','Wedding','Bridal portraits','f8_1.jpg','v','',0],['Before / After · Wedding','Colour Grading','Bridal','f0_1.jpg','v','',0],
    ['Monster · Product Reveal','Reels & Shorts','Promo reels','f3_1.jpg','v','',1]
  ],
  thumb: [
    ['RAW vs GRADED','Before / After','Colour grade','t1.jpg',1],['ZERO LIMITS','Ads & Brands','Product','t2.jpg',1],['S-LOG3 SECRET','YouTube','Tutorial','t3.jpg',0],
    ['WEDDING FILM 2026','Lifestyle','Events','t4.jpg',1],['SHOT ON PHONE?!','YouTube','Tutorial','t5.jpg',1],['CINEMATIC IN 5 MIN','YouTube','Tutorial','t6.jpg',1],
    ['BIRTHDAY SURPRISE','Lifestyle','Events','t7.jpg',0],['MOUNTAIN VLOG EP.1','YouTube','Travel','t8.jpg',1],['BEFORE & AFTER','Before / After','Colour grade','t9.jpg',0],
    ['PRODUCT LAUNCH AD','Ads & Brands','Product','t10.jpg',1],['A DAY IN MY LIFE','Lifestyle','Day in life','t11.jpg',0],['COLOUR GRADE TIPS','YouTube','Vlog','t12.jpg',0]
  ]
};

export const SEED_PRODUCTS = [
  { title: 'Cinematic Teal & Orange LUTs (sample)', short: '5 free .cube LUTs for Log and phone footage', price: 0, cat: ['store_free','LUTs'], image: 't9.jpg', badge: 'Free', size_text: '2 MB' },
  { title: 'Whoosh & Impact SFX (sample)', short: '20 transition sounds for reels', price: 0, cat: ['store_free','SFX Packs'], image: 't2.jpg', badge: 'Free', size_text: '8 MB' },
  { title: 'Wedding Colour Pack (sample)', short: '12 LUTs tuned for bridal skin tones', price: 199, mrp: 499, cat: ['store_paid','LUTs'], image: 't4.jpg', badge: 'Bestseller', size_text: '6 MB' },
  { title: 'Reels Editing Mega Pack (sample)', short: 'Transitions, overlays, SFX and text presets', price: 499, mrp: 999, cat: ['store_paid','Editing Packs'], image: 't6.jpg', badge: 'New', size_text: '1.2 GB' }
];

export const SEED_REVIEWS = [
  { name: 'Rohit Sharma', role: 'YouTuber · India', rating: 5, text: 'Prashant turned my raw vlog footage into something that actually feels cinematic. Fast delivery and he listens to feedback.' },
  { name: 'Emily Carter', role: 'Content creator · USA', rating: 5, text: 'Super smooth reels with perfect beat-sync. Communication was easy even across time zones. Will hire again.' },
  { name: 'Neha & Arjun', role: 'Wedding · Jaipur', rating: 5, text: 'Our wedding highlight made the whole family cry (in a good way). The colour grading is beautiful.' },
  { name: 'Aman Verma', role: 'Brand owner · Delhi', rating: 5, text: 'Our product ad got way more reach than before. Clean motion graphics and a great thumbnail too.' }
];
