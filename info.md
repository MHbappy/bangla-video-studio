bangla-video-studio/
├── media/
│   ├── library/              ← সব ভিডিওর জন্য শেয়ার্ড
│   │   ├── broll/            ✏️ বারবার কাজে লাগে এমন B-roll
│   │   ├── music/            ✏️ লাইসেন্স-মুক্ত মিউজিক
│   │   ├── brand/            ✏️ logo.png, qr.png, brand.json (ফোন, ঠিকানা, সোশ্যাল)
│   │   └── sfx/              (whoosh.wav, pop.wav — চাইলে একই নামে ভালোটা দিয়ে বদলান)
│   └── videos/
│       └── <ভিডিওর-নাম>/     ← npm run new বানায়
│           ├── aroll.mp4     (আপনার কাটা ফুটেজ — new কমান্ড নিজে কপি করে)
│           ├── broll/        ✏️ শুধু এই ভিডিওর B-roll
│           ├── music/        ✏️ (ঐচ্ছিক) শুধু এই ভিডিওর মিউজিক
│           ├── transcript.json, edit.json        ← Claude লেখে
│           ├── captions…, timeline.json ইত্যাদি  ← নিজে থেকে তৈরি
│           └── output/       ← final.mp4, shorts.mp4, graphics.mov, captions.srt, chapters.txt
├── glossary.txt              ✏️ টেকনিক্যাল শব্দের সঠিক বানান
├── src/theme.ts              ✏️ ব্র্যান্ডের রং (একবার ঠিক করলেই হবে)
├── src/, scripts/            ← কোড (হাত দিতে হবে না)
├── .claude/skills/           ← ৩টা Skill
└── docs/                     ← গাইড