# sawm — why this exists

a research document on the gap, the reasoning, and the design decisions behind a ramadan fasting companion built from spite and empathy

---

## the landscape: what already exists

i surveyed the entire ramadan app ecosystem — the top-ranked apps on iOS and android, the "best of ramadan" listicles, the app store reviews, the community forums. here's 
what i found.

every single ramadan app is fundamentally the same product. they are content delivery platforms for religious text and time data. the feature matrix looks like this across 
almost all of them:

- prayer times with adhan notifications
- quran reader with translations and tafsir
- qibla compass
- hijri calendar
- hadith library
- dua collections
- tasbih counter
- ramadan countdown

the major players — Muslim Pro (180M+ downloads), Pillars, Athan, Tarteel, Quranly — are all competing on the same feature set with minor differentiators. Tarteel does 
AI-powered recitation correction. Quranly does gamified streak tracking. Muslim Pro bolts on a social layer. Pillars emphasizes privacy and ad-free design (genuinely good). 
MyWaqt does prayer-based productivity scheduling (actually novel).

but the fundamental assumption behind all of them is identical: the user already knows what they're doing. they know the terminology. they know the rituals. they grew up 
with ramadan. they have family to eat with. they have community around them.

that assumption excludes a massive number of people.

---

## the gap: who gets left behind

### converts and reverts

roughly 25% of american muslims are converts. that's not a niche — it's a quarter of the community. an estimated 20,000 americans convert to islam every year.

the research on their experience during ramadan is bleak:

- most converts report limited social support from their muslim community. ramadan, eid, and holidays associated with their former religion are reported as being a lonely 
time, resulting in feelings of marginalization. (The Family and Youth Institute, 2015)

- many converts break their fast alone, often in front of the TV. those who attended community iftars at the masjid found themselves eating alone there too, as people of 
like cultures banded together. (Message International)

- one imam described his first ramadan as feeling "terrified" — not just converting to a new religion, but to a new community. constantly bombarded with questions about how 
and why he converted. (Islamic Horizons)

- a young woman's family refused to acknowledge her islam. her father would put a plate of food in front of her during ramadan because he refused to accept her fasting. she 
had no community to turn to. (SeekersGuidance)

- many converts are "secret muslims" who haven't disclosed their conversion to family. they have to navigate fasting while hiding it — skipping family meals, pretending 
they've already eaten, figuring out halal food logistics in non-muslim households. (Islam21c)

- the terminology alone is a barrier. suhoor, iftar, fajr, maghrib, taraweeh, laylatul qadr — these are all assumed knowledge in every app. no existing app explains these 
terms inline. you either know them or you don't.

### muslims in non-muslim contexts

even born muslims living in non-muslim majority countries (the US, UK, western europe, parts of asia) face practical challenges that no app addresses:

- managing energy levels at work while fasting. no app provides contextual guidance about what phase of the fast you're in and what to expect physically.

- dehydration is the number one physical challenge. the eating window between maghrib and fajr is the only time to hydrate. studies from the british nutrition foundation, 
johns hopkins, and others consistently emphasize 8-10 cups of water during this window. no app tracks this.

- suhoor (the pre-dawn meal) is frequently skipped due to exhaustion. research shows skipping it leads to blood sugar crashes, headaches, and difficulty concentrating. no 
app provides meal guidance timed to your actual schedule.

- the physical adaptation in the first week is rough — caffeine withdrawal headaches, energy crashes, disrupted sleep cycles. no app acknowledges this or offers practical 
coping strategies.

### the broader pattern

the app ecosystem treats ramadan as a spiritual content problem. it is also a logistics problem, a physical health problem, and a community inclusion problem. the spiritual 
tools are well-served. the practical tools are almost nonexistent.

---

## what sawm does differently

sawm is not a prayer times app. it's a fasting day companion — a live operational dashboard for getting through the day.

### 1. live fast progress tracking

a circular progress ring shows exactly where you are in the current fast. during fasting hours (fajr to maghrib), it shows time remaining and percentage complete. during 
the eating window, it counts down to the next fajr.

this sounds simple but no existing app does it well. most show static prayer time tables or basic countdowns. sawm treats the fast as a continuous process with a clear 
visual state.

the ring changes color — amber during fasting, green during the eating window. at a glance you know what mode you're in.

### 2. context-aware guidance engine

this is the core differentiator. the "right now" card changes its content based on what time of day it is relative to the prayer schedule:

- **night (before suhoor window)**: prioritize sleep and hydration
- **suhoor window (1hr before fajr)**: specific meal guidance — complex carbs, protein, water strategy, what to avoid
- **early fast (fajr + 2hrs)**: your body is still running on fuel, good time for focused work
- **mid-morning**: energy dip warning, caffeine withdrawal acknowledgment, practical coping
- **deep fast (midpoint to pre-iftar)**: the hardest stretch. acknowledges difficulty, countdown to iftar, spiritual framing
- **pre-iftar (45min before maghrib)**: meal prep reminders, gentle iftar guidance (dates and water first, eat slowly)
- **iftar**: you made it. hydration window is open. practical eating advice
- **evening**: refuel, taraweeh mention, prep-for-tomorrow guidance
- **late night**: set suhoor alarm, keep drinking water

this guidance is practical, not preachy. it reads like advice from someone who's been through it, not a religious textbook. it acknowledges that fasting is physically hard 
and doesn't pretend otherwise.

### 3. hydration tracker

activates only during the eating window (maghrib to fajr). during fasting hours, it displays a message about focusing on the fast — water comes at maghrib.

when active, it shows cups tracked against a configurable goal (default 8, based on medical guidance for 8-10 cups between iftar and suhoor). visual cup indicators you tap 
to fill. progress bar. plus/minus buttons.

state persists in localStorage and resets daily. no account needed. no data leaves the device.

this exists because dehydration is consistently cited as the primary physical health risk during ramadan fasting, and not a single app in the ecosystem tracks it.

### 4. convert-friendly by default

every arabic term in the interface has a dotted underline. hover (desktop) or tap (mobile) reveals a plain-language tooltip explaining the term. "fajr" becomes "fajr — the 
pre-dawn prayer. marks the start of the daily fast."

a full glossary section at the bottom explains all terms in simple english. labeled "new to this?" — welcoming without being patronizing.

this is not a feature toggle or an accessibility mode. it's the default experience. the design assumes no prior knowledge while remaining useful to experienced muslims.

### 5. real prayer times via API

pulls from the AlAdhan API (aladhan.com) — the same source most islamic apps and websites use. supports geolocation for automatic local times. supports 15+ calculation 
methods:

- ISNA (default for north america)
- Muslim World League
- Umm al-Qura (makkah)
- Egyptian General Authority
- University of Karachi
- Jafari / Shia Ithna-Ashari
- Gulf Region, Kuwait, Qatar
- DIANET (turkey)
- Moonsighting Committee Worldwide
- and more

this matters because different communities use different calculation methods. ISNA vs MWL can differ by 10+ minutes on fajr time. the settings panel lets you match your 
local masjid.

### 6. ramadan awareness

the app knows the current ramadan dates (2026: feb 18 – mar 19, confirmed by saudi moon sighting feb 17). it shows "ramadan day X of 30" in the header. before ramadan it 
shows a countdown. after ramadan it acknowledges the month has ended.

---

## design decisions

### aesthetic: industrial utilitarian

dark background (#0a0a0a), amber accent for fasting state, muted warm tones for text. the visual language is a control panel, not a greeting card. this is deliberate.

most islamic apps lean into ornamental design — geometric patterns, calligraphy, green and gold palettes, mosque silhouettes. that's beautiful and culturally meaningful. 
but it also signals "this is for people who are already immersed in this culture." it can feel alienating to converts and outsiders.

sawm looks like a tool. it communicates: this is a thing that helps you do a thing. come as you are.

### typography: JetBrains Mono + Source Serif 4

monospace for data and UI elements — times, counters, labels. it reads as precise and functional. Source Serif for the guidance text and glossary definitions — warmer, more 
human, easier to read in longer passages.

this pairing creates a clear hierarchy: the machine parts look like machine parts, the human parts look like human parts.

### no accounts, no tracking, no ads

localStorage only. prayer times fetched from a free public API. no analytics. no user data collection. no monetization.

the footer says: "built with care. no ads. no tracking. no corporate nonsense."

this is not just an ethical stance — it's a trust signal for a community that has been burned by data collection. Muslim Pro was caught selling user location data to a data 
broker connected to the US military in 2020. that incident broke trust across the entire ecosystem. privacy-first design is table stakes for this audience.

### single file, zero dependencies

the entire app is one HTML file. no build step. no npm. no framework. under 500 lines total. it uses the browser's geolocation API and a single fetch call to AlAdhan.

this means:
- it works offline after the first API call
- it can be forked and modified by anyone who can read HTML
- it can be hosted on any free static hosting (github pages, netlify, cloudflare pages) in minutes
- it's inspectable — you can view-source and see there's no tracking

this aligns with the maker/hacker ethos of building tools that are transparent, modifiable, and owned by the people using them.

---

## technical implementation

### data flow

1. browser geolocation → lat/lng coordinates
2. coordinates + calculation method → AlAdhan API request
3. API returns full prayer time set for today
4. local clock + prayer times → current fast phase, progress calculation, guidance selection
5. render loop every 30 seconds keeps display current

### fallback behavior

if geolocation is denied or fails, defaults to Mesa, AZ coordinates. this is a reasonable default for the initial build — the user can adjust via settings.

### hydration state management

- `sawm_hydration_count`: integer, current cups
- `sawm_hydration_date`: ISO date string, resets counter on new day
- `sawm_hydration_goal`: integer, configurable target
- `sawm_method`: integer, calculation method ID

all stored in localStorage. no server. no sync. if you clear your browser data, it resets. that's fine — it's a daily tracker, not a longitudinal study.

### ramadan date detection

hardcoded for 2026 based on confirmed saudi moon sighting (feb 17 evening, first fast feb 18). this is the right approach for a single-season tool. a production version 
would pull hijri calendar data from the AlAdhan calendar API for multi-year support.

---

## what this could become

this is a mockup — a proof of concept for the gap in the market. if built out, the natural extensions are:

- **suhoor/iftar meal planner**: rotate through nutritionally balanced meal suggestions. highlight hydrating foods. simple grocery list generation.
- **energy timeline**: a horizontal bar showing expected energy levels throughout the day based on medical literature, with coping strategies at each phase.
- **community iftar finder**: aggregate community iftar events from local masjids. this directly addresses the convert isolation problem.
- **medication scheduler**: for people who need to take medication during non-fasting hours. time alerts to the eating window.
- **multi-language support**: arabic, urdu, bahasa, turkish, french — matching the global muslim population.
- **PWA with notifications**: service worker for offline support, push notifications for suhoor alarm and hydration reminders during the eating window.
- **ramadan journal**: daily reflection prompts. private, local-only. exportable as text.

but the core insight doesn't change: treat ramadan as a lived physical experience that needs practical support, not just a spiritual content delivery problem. build for the 
person eating alone in front of the TV, not just the person with a full table.

---

## sources and references

### convert experience research
- The Family and Youth Institute (2015). Research on American Muslim youth subgroups.
- Message International. "Tailoring Programs to Meet the Needs of Underserved Muslim Youth."
- SeekersGuidance. "Navigating Ramadan as a Convert: Challenges and Solutions" (Imam Khalid Latif).
- Islamic Horizons. "Eight Muslim Americans Converts Share Their Ramadan Experiences."
- Islam21c. "Reverts in Ramadan."
- Amaliah. "Ramadan for Converts: Reflections, Tips, and How to Make the Most of It."
- Al Jumuah Magazine. "What Converts Wish Raised Muslims Knew."

### health and nutrition
- Johns Hopkins Aramco Healthcare. Ramadan Nutrition and Hydration Guide.
- British Nutrition Foundation. "A Healthy Ramadan."
- Midland Health. "Ramadan Health Guide: Nutrition, Hydration & Wellbeing."
- Islamic Relief Australia. "How to Meal Plan for Ramadan."
- British Journal of Nutrition, Vol. 118, No. 12, 2017 (effects of diurnal ramadan fasting on energy expenditure).

### app ecosystem survey
- Greentech Apps Foundation. "13 Best Apps for Ramadan" (2026).
- TechCabal. "Five apps helping Muslims navigate Ramadan" (Feb 2026).
- App Store / Google Play listings for Muslim Pro, Pillars, Tarteel, Quranly, MyWaqt, iPray, Athan, Sabr.
- Adjust. "Key mobile app trends and insights for Ramadan 2025."

### prayer times data
- AlAdhan.com Prayer Times API (aladhan.com/prayer-times-api).
- Ramadan 2026 calendar confirmed by Saudi moon sighting, Feb 17, 2026.

---

*built by someone who believes the best tools are the ones that meet people where they actually are, not where you assume they should be.*
