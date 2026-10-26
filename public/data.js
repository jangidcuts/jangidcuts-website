/* Sample portfolio data. In the real site this comes from the admin panel. */
window.JC = {
 video: {
  cats: {
   "Colour Grading": ["Bridal", "Log footage"],
   "Wedding": ["Highlights", "Bridal portraits"],
   "Reels & Shorts": ["Beat-sync", "Promo reels"],
   "Ads & Promos": ["Product ads"],
   "YouTube & Cinematic": ["Travel", "Cinematic"],
   "Song Edits": ["Music video"],
   "Events": ["Birthday"]
  },
  items: [
   {t:"RAW vs Cinematic Grade", c:"Colour Grading", s:"Bridal", img:"img/f0_0.jpg", o:"v", clip:"media/c1.mp4"},
   {t:"S-Log3 to Cinematic", c:"Colour Grading", s:"Log footage", img:"img/f1_0.jpg", o:"v"},
   {t:"Monster Energy · Spec Ad", c:"Ads & Promos", s:"Product ads", img:"img/f3_0.jpg", o:"v"},
   {t:"Gucci · Song Edit", c:"Song Edits", s:"Music video", img:"img/f4_0.jpg", o:"h"},
   {t:"Alpine Colour Story", c:"YouTube & Cinematic", s:"Travel", img:"img/f2_0.jpg", o:"h", clip:"media/c4.mp4"},
   {t:"Wedding Grade · Golden", c:"Wedding", s:"Bridal portraits", img:"img/f8_0.jpg", o:"v"},
   {t:"Raw vs Graded Wedding", c:"Wedding", s:"Highlights", img:"img/f7_1.jpg", o:"v"},
   {t:"Forest · Cinematic Cut", c:"YouTube & Cinematic", s:"Cinematic", img:"img/f5_0.jpg", o:"h"},
   {t:"Birthday Highlight", c:"Events", s:"Birthday", img:"img/f6_0.jpg", o:"v"},
   {t:"Bridal Close-up Grade", c:"Colour Grading", s:"Bridal", img:"img/f1_1.jpg", o:"v"},
   {t:"Mountain Drive", c:"YouTube & Cinematic", s:"Travel", img:"img/f2_1.jpg", o:"h"},
   {t:"Song Edit · Night Mood", c:"Song Edits", s:"Music video", img:"img/f4_1.jpg", o:"h"},
   {t:"Woods · Slow Cinema", c:"YouTube & Cinematic", s:"Cinematic", img:"img/f5_1.jpg", o:"h"},
   {t:"Party Recap Reel", c:"Reels & Shorts", s:"Beat-sync", img:"img/f6_1.jpg", o:"v"},
   {t:"Bride Portrait Grade", c:"Wedding", s:"Bridal portraits", img:"img/f8_1.jpg", o:"v"},
   {t:"Before / After · Wedding", c:"Colour Grading", s:"Bridal", img:"img/f0_1.jpg", o:"v"},
   {t:"Monster · Product Reveal", c:"Reels & Shorts", s:"Promo reels", img:"img/f3_1.jpg", o:"v"}
  ],
  rows: [
   {title:"Trending Now", note:"auto-scrolls", auto:true, pick:[0,2,5,8,13,9,14,16,1]},
   {title:"Colour Grading", c:"Colour Grading"},
   {title:"Reels & Ads", pick:[2,16,13,6,15]},
   {title:"Song Edits", c:"Song Edits"},
   {title:"YouTube & Cinematic", c:"YouTube & Cinematic"}
  ],
  feature: [
   {t:"Alpine Colour Story", d:"Travel footage graded into a cold, cinematic mountain look.", img:"img/f2_0.jpg", i:4},
   {t:"Song Edits", d:"Beat-synced music edits with mood colour grading.", img:"img/f4_0.jpg", i:3},
   {t:"Forest Cinematic Cut", d:"Slow, moody cinema-style cut with a natural green grade.", img:"img/f5_0.jpg", i:7}
  ]
 },
 thumb: {
  cats: {
   "YouTube": ["Vlog", "Travel", "Tutorial"],
   "Before / After": ["Colour grade"],
   "Ads & Brands": ["Product"],
   "Lifestyle": ["Events", "Day in life"]
  },
  items: [
   {t:"RAW vs GRADED", c:"Before / After", s:"Colour grade", img:"img/t1.jpg", o:"h"},
   {t:"ZERO LIMITS", c:"Ads & Brands", s:"Product", img:"img/t2.jpg", o:"h"},
   {t:"S-LOG3 SECRET", c:"YouTube", s:"Tutorial", img:"img/t3.jpg", o:"h"},
   {t:"WEDDING FILM 2026", c:"Lifestyle", s:"Events", img:"img/t4.jpg", o:"h"},
   {t:"SHOT ON PHONE?!", c:"YouTube", s:"Tutorial", img:"img/t5.jpg", o:"h"},
   {t:"CINEMATIC IN 5 MIN", c:"YouTube", s:"Tutorial", img:"img/t6.jpg", o:"h"},
   {t:"BIRTHDAY SURPRISE", c:"Lifestyle", s:"Events", img:"img/t7.jpg", o:"h"},
   {t:"MOUNTAIN VLOG EP.1", c:"YouTube", s:"Travel", img:"img/t8.jpg", o:"h"},
   {t:"BEFORE & AFTER", c:"Before / After", s:"Colour grade", img:"img/t9.jpg", o:"h"},
   {t:"PRODUCT LAUNCH AD", c:"Ads & Brands", s:"Product", img:"img/t10.jpg", o:"h"},
   {t:"A DAY IN MY LIFE", c:"Lifestyle", s:"Day in life", img:"img/t11.jpg", o:"h"},
   {t:"COLOUR GRADE TIPS", c:"YouTube", s:"Vlog", img:"img/t12.jpg", o:"h"}
  ],
  rows: [
   {title:"Most Clicked", note:"auto-scrolls", auto:true, pick:[0,1,4,7,3,9,5]},
   {title:"YouTube Thumbnails", c:"YouTube"},
   {title:"Brands & Lifestyle", pick:[1,9,3,6,10]}
  ],
  feature: [
   {t:"Thumbnails that get clicks", d:"Bold type, clean cut-outs and colour that stands out in the feed.", img:"img/t1.jpg", i:0},
   {t:"Brand Thumbnails", d:"Product and promo thumbnails in the brand's own colours.", img:"img/t2.jpg", i:1}
  ]
 },
 services: [
  {t:"Colour Grading", d:"Cinematic looks from Log footage", img:"img/f8_0.jpg"},
  {t:"Reels & Shorts Editing", d:"Beat-sync, captions, transitions", img:"img/f0_1.jpg"},
  {t:"YouTube Video Editing", d:"Long-form, retention-focused", img:"img/f5_1.jpg"},
  {t:"Wedding Films", d:"Highlights & teasers", img:"img/f7_1.jpg"},
  {t:"Ads & Promo Videos", d:"Product & brand promos", img:"img/f3_0.jpg"},
  {t:"Thumbnail Design", d:"YouTube thumbnails that get clicks", img:"img/t1.jpg"},
  {t:"Motion Graphics", d:"Titles, logo animation, lower thirds", img:"img/f3_1.jpg"},
  {t:"Podcast Editing", d:"Multi-cam cuts and clips", img:"img/f4_1.jpg"},
  {t:"Poster & Social Graphics", d:"Posts, banners, posters", img:"img/t12.jpg"}
 ]
};
