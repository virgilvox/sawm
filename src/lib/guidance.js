import { formatCountdown } from './timeUtils.js';

export function getGuidance(nowMins, fajrMins, maghribMins, ishaMins) {
  const suhoorWindow = fajrMins - 60;
  const midFast = fajrMins + (maghribMins - fajrMins) / 2;
  const preIftar = maghribMins - 45;

  if (nowMins < suhoorWindow) {
    return {
      phase: 'night',
      title: 'rest window',
      parts: [
        { text: 'prioritize sleep and hydration right now. if you haven\'t had ', terms: [] },
        { text: 'Suhoor', isTerm: true },
        { text: ' yet, aim for complex carbs, protein, and plenty of water. oats, eggs, dates, and avocado are your best friends.' },
        { break: true },
        { text: 'drink water steadily. don\'t chug it all at once. your body absorbs it better in sips over time.' },
      ],
    };
  }

  if (nowMins >= suhoorWindow && nowMins < fajrMins) {
    return {
      phase: 'suhoor',
      title: 'suhoor time',
      parts: [
        { text: 'eat now if you haven\'t. focus on slow-burning fuel: whole grains, eggs, bananas, nut butter, yogurt. avoid salty or fried food. it\'ll make you thirstier.' },
        { break: true },
        { text: `drink water with intention. 2-3 glasses now. you've got ${formatCountdown(fajrMins - nowMins)} until ` },
        { text: 'Fajr', isTerm: true },
        { text: '.' },
      ],
    };
  }

  if (nowMins >= fajrMins && nowMins < fajrMins + 120) {
    return {
      phase: 'early fast',
      title: 'beginning of fast',
      parts: [
        { text: 'your fast has begun. the first few hours are usually the easiest. your body is still running on ' },
        { text: 'Suhoor', isTerm: true },
        { text: ' fuel.' },
        { break: true },
        { text: 'good time for prayer, reading, or quiet focus work. your mind is often clearest in these hours.' },
      ],
    };
  }

  if (nowMins >= fajrMins + 120 && nowMins < midFast) {
    return {
      phase: 'mid-morning',
      title: 'holding steady',
      parts: [
        { text: 'energy may start to dip. this is normal. avoid intense physical activity if you can. take it easy at work. your body is adjusting.' },
        { break: true },
        { text: 'if you feel a headache coming on, it\'s likely caffeine withdrawal or mild dehydration from yesterday. it gets easier each day. sit somewhere cool if you can.' },
      ],
    };
  }

  if (nowMins >= midFast && nowMins < preIftar) {
    return {
      phase: 'deep fast',
      title: 'the middle stretch',
      parts: [
        { text: `this is often the hardest part. you're past the halfway mark. ${formatCountdown(maghribMins - nowMins)} to go until ` },
        { text: 'Iftar', isTerm: true },
        { text: '.' },
        { break: true },
        { text: 'if you\'re struggling: slow down, breathe, and know this is temporary. rest if you can. avoid cooking smells if they make it harder. some people find this is when the spiritual clarity kicks in.' },
      ],
    };
  }

  if (nowMins >= preIftar && nowMins < maghribMins) {
    return {
      phase: 'pre-iftar',
      title: 'almost there',
      parts: [
        { text: `you're in the home stretch. ${formatCountdown(maghribMins - nowMins)} until ` },
        { text: 'Maghrib', isTerm: true },
        { text: '. if you\'re preparing food, keep it simple tonight. soup, dates, water, and a light main.' },
        { break: true },
        { text: 'when you break fast: start with dates and water. eat slowly. your stomach has been empty. sudden large meals can cause pain and bloating. gentle is the way.' },
      ],
    };
  }

  if (nowMins >= maghribMins && nowMins < maghribMins + 60) {
    return {
      phase: 'iftar',
      title: 'iftar / break your fast',
      parts: [
        { text: 'you made it through another day. start with water and dates, then a light soup or salad. wait 15-20 minutes before your main meal. your stomach needs time to wake up.' },
        { break: true },
        { text: 'hydrate steadily from now until ' },
        { text: 'Suhoor', isTerm: true },
        { text: '. track your cups below. the hydration window is open.' },
      ],
    };
  }

  if (nowMins >= maghribMins + 60 && nowMins < ishaMins + 90) {
    return {
      phase: 'evening',
      title: 'evening window',
      parts: [
        { text: 'this is your refuel time. eat balanced meals, keep drinking water, and take it easy. many people attend ' },
        { text: 'Taraweeh', isTerm: true },
        { text: ' prayers in the evening. these are optional but meaningful.' },
        { break: true },
        { text: 'try to get a snack with protein and fiber in before bed so tomorrow\'s fast starts easier.' },
      ],
    };
  }

  return {
    phase: 'late night',
    title: 'night hours',
    parts: [
      { text: 'rest when you can. set an alarm for ' },
      { text: 'Suhoor', isTerm: true },
      { text: ' if you need to. don\'t skip it. even a few dates, yogurt, and water makes a difference.' },
      { break: true },
      { text: 'keep sipping water before bed. your body will thank you tomorrow.' },
    ],
  };
}
