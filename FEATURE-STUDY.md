# Twenty-plus feature candidates and the ten that won

Researched August 13, 2026. Store metrics are captured separately in `COMPETITIVE-RESEARCH.md`; this study uses official product/help documentation for features and does not infer revenue, paid adoption, or live availability.

## 24 credible candidates

1. Native event sharing and copy-link fallback — [Eventbrite](https://www.eventbrite.com/help/en-us/articles/783059/how-to-use-the-eventbrite-iphone-app/), [Bandsintown](https://help.bandsintown.com/en/articles/3652349-how-can-i-share-an-event), and [AllEvents](https://support.allevents.in/article/91-how-to-share-any-events).
2. Add saved events to a phone calendar — [Bandsintown calendar sync](https://help.bandsintown.com/en/articles/3643331-how-do-i-sync-my-upcoming-events-to-my-mobile-device-calendar) and Eventbrite’s calendar action.
3. Time-of-day filtering — [Meetup event discovery](https://help.meetup.com/hc/en-us/articles/39235072484109-Finding-an-event).
4. Adjustable distance radius — Meetup’s 2–100-mile filter and Google Maps route preferences.
5. Map discovery — [AllEvents](https://allevents.app/) advertises interactive map discovery.
6. Saved/private collections with notes — [Yelp Collections](https://www.yelp-support.com/article/What-is-a-Collection?l=en_US).
7. Shareable/collaborative lists — [Google Maps shared lists](https://support.google.com/maps/answer/7280933?hl=en-AU) and Eventbrite Collections.
8. Follow venues and festivals — [Bandsintown](https://help.bandsintown.com/en/articles/3652392-can-i-follow-venues-or-festivals).
9. Follow organizers — Eventbrite’s app and organizer documentation.
10. Personalized recommendations — Eventbrite’s personalized Discover feed, Yelp Explore Weekly, Meetup suggestions, and Bandsintown artist-based discovery.
11. Local-expert editorial lists — Eventbrite It-Lists and Time Out’s local-journalist model.
12. Friends’ attendance/activity — Eventbrite’s friends feature.
13. Group polls — [Partiful polling](https://help.partiful.com/hc/en-us/sections/24466749645083--Polling-Guests).
14. Guest comments and reactions — [Partiful](https://partiful.com/) and Meetup event comments.
15. Automatic event reminders — [Meetup reminders](https://help.meetup.com/hc/en-us/articles/39792225676813-Announcing-your-events).
16. Change/cancellation alerts — [Meetup notification rules](https://help.meetup.com/hc/en-us/articles/40708711818637-What-notifications-Meetup-can-send).
17. Weekly recommendation digest — Meetup documents weekly personalized recommendations when enough quality matches exist.
18. Waitlists tied to actual capacity — [Luma](https://help.luma.com/p/waitlist), DICE and TodayTix.
19. Same-day rush/lottery inventory — [TodayTix](https://www.todaytix.com/us/static/lotteryandrush).
20. Direct ticket/wallet access — Eventbrite, Luma and AllEvents.
21. Artist-library sync and concert alerts — Bandsintown and [Songkick](https://www.songkick.com/info/about).
22. Up-front age, check-in, parking and FAQ details — [Eventbrite’s redesigned app](https://www.eventbrite.com/blog/press/newsroom/eventbrite-launches-reimagined-app/).
23. Event video previews — Eventbrite’s redesigned listings.
24. Post-event feedback/ratings — [Meetup feedback](https://help.meetup.com/hc/en-us/articles/360015131592-Sharing-feedback-about-an-event).

## The ten selected and why they beat the rest

| Selected feature | Why it wins for Cincinnati This Weekend | Delivered behavior |
|---|---|---|
| 1. Weekend Matchmaker | Fifty good choices can still feel like work. A four-choice concierge cuts directly to three verified candidates. It beats opaque “AI personalization” because the user can see and change every input. | Mood/category, day, budget and drive choices score the current verified edition only. It never claims hidden live data. |
| 2. Timeline view | A weekend is a schedule, not only a card grid. This beats a generic map as the first alternate view because time conflicts are the more common planning failure. | One tap switches the same filtered results into Friday/Saturday/Sunday chronological lanes. |
| 3. Time-of-day filter | Meetup’s morning/afternoon/evening filter solves a frequent normal-English question with almost no effort. It beats more category clutter. | Morning, afternoon, evening and late-night buckets are derived from each published start time. |
| 4. Three-event comparison | Editorial cards help discovery, but users still need to choose. Side-by-side day, time, price, travel, venue and description beat a shallow popularity badge. | Compare any two or three events, then place the winner directly into the itinerary. |
| 5. Shareable weekend plan | Eventbrite, Google Maps and Yelp prove that collections become more useful when shareable. This beats a fake multi-user account system: a clean URL recreates the shortlist without a server or personal data. | “Share this plan” uses native phone sharing when available and a copy-link fallback; the receiving URL loads the selected event IDs. |
| 6. Add to calendar | A discovery is only useful if the user remembers it. Calendar export beats pretend push alerts because it works now and the user controls the reminder. | Downloads a standard `.ics` file with title, start, location, description and official source. |
| 7. One-tap event sharing | People decide weekends in texts. This high-frequency action beats social-feed imitation and needs no account. | Native share sheet on supported phones; otherwise copies the event summary and official source URL. |
| 8. Private event notes | Yelp’s notes make a saved item personally meaningful. Notes beat public comments because this app has no moderation/account infrastructure and the user asked for practical planning. | “Who to invite / where to meet / what to remember” stays only in that browser’s storage. |
| 9. Follow venue + My venues | Bandsintown’s follow model is useful even without a global social graph. It beats claiming notifications we cannot send reliably. | Follow/unfollow a venue on the device, then filter the current weekly edition to those venues; no alert claim. |
| 10. Smart itinerary command center | Price, overlap and travel friction decide whether an ambitious plan works. Bundling them in the planner beats separate decorative badges. | Shows known minimum spend plus unknown-price count, neighborhood count, overlap/tight-transfer warnings, chronological plan, share/copy, and a multi-stop Google Maps route. |

## Candidates deliberately not represented as working

Real-time ticket inventory, wallet tickets, waitlists, rush/lottery status, cancellation alerts, push reminders, friend attendance, comments, video previews and streaming-service sync require organizer inventory, authenticated accounts, permissions or media feeds this standalone site does not have. They remain evidence-backed ideas, not fake buttons. The app instead routes ticket decisions to the original source and visibly dates every editorial record.
