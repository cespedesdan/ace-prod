const performanceFixtures = process.env.PERFORMANCE_FIXTURES === 'true'

export const publicTournament = performanceFixtures
  ? '__performance_copa_ace_10__'
  : 'Copa Ace 10'

export const publicLiveStreamId = performanceFixtures
  ? '__performance_home__'
  : 'home'
