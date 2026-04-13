import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Seed function: creates Emma Thompson — full realistic test client
// 1 contact + 10 sessions (with transcripts) + 5 notes + 4 tasks + 1 journey
// Run from Base44 dashboard → Code → Functions → Test Function

Deno.serve(async (req: Request) => {
  const startTime = Date.now();

  try {
    const base44 = createClientFromRequest(req);

    // ── Step 1: Create Contact ──────────────────────────────────────────
    const contact = await base44.asServiceRole.entities.Contact.create({
      full_name: 'Emma Thompson',
      email: 'emma.thompson@example.co.uk',
      phone: '+447700900456',
      contact_type: 'Client',
      status: 'active',
      health_goals: 'Address root causes of chronic fatigue and IBS. Improve energy levels to be more present for daughter Lily. Optimise nutrition as a long-term vegetarian. Resolve vitamin D deficiency (28 nmol/L) and borderline low ferritin (18 ug/L). Build sustainable self-care habits around a demanding teaching schedule.',
      notes: 'Emma is a 35-year-old secondary school English teacher in Bristol. Single mum to Lily (7). Vegetarian for 12 years. Diagnosed with IBS 3 years ago. Runs the school drama club. Self-referred after colleague recommendation. Intellectually curious, self-deprecating humour, puts everyone else first. Uses "it\'s fine" as a defence mechanism. Perfectionist about work, chaotic about self-care. Key people: Lily (daughter), Marcus (ex-husband, co-parents amicably), Bev (her mum, helps Wednesdays), Jen (best friend, Saturday walks), Dr Okafor (GP at Southmead Practice), Monty (cat).',
      tags: 'IBS, fatigue, vegetarian, gut health, energy, sleep, vitamin D, ferritin, single parent',
      focus_areas: 'Gut Health, Energy, Nutrition, Stress Management',
      gender: 'Female',
      preferred_contact_method: 'Email',
      preferred_support_type: 'Education, Accountability',
      contact_source: 'Referral',
    });

    const contactId = contact.id;

    // ── Step 2: Create 10 Sessions ──────────────────────────────────────
    const sessionData = [
      // ── SESSION 1 ──
      {
        contact_id: contactId,
        title: 'Initial Assessment & Health History',
        date_time: '2025-11-04T10:00:00Z',
        duration: 60,
        status: 'completed',
        platform: 'Google Meet',
        aiSessionSummary: 'Comprehensive initial assessment with Emma Thompson, a 35-year-old secondary school English teacher and single mum to Lily (7). Emma was diagnosed with IBS three years ago with symptoms worsening during term time. She reports chronic fatigue described as "bone-deep tired by 3pm." Recent blood work showed vitamin D deficiency at 28 nmol/L and borderline low ferritin at 18 ug/L. GP Dr Okafor prescribed supplements but Emma wants to address root causes. She has been vegetarian for 12 years with a diet heavily reliant on wheat-based carbohydrates — toast, sandwiches, pasta. Drinks approximately 8 cups of tea daily with minimal water intake. Lily is her primary motivation.',
        keyDiscussionPoints: 'IBS diagnosis 3 years ago, symptoms worse during term time. Chronic fatigue "bone-deep tired by 3pm." Vitamin D 28 nmol/L, ferritin 18 ug/L. Vegetarian 12 years — mostly pasta, bread, cheese. 8 cups of tea daily, barely any water. Lily is primary motivation. Marcus picks up Lily Fridays — Emma\'s only "me time" but she falls asleep on sofa. Runs school drama club. Mum Bev comments on Emma looking pale.',
        emotionalState: 'overwhelmed but hopeful',
        clientCommitments: 'Start a food diary for one week. Track energy levels 1-10 three times daily (morning, afternoon, evening). Drink one glass of water before each cup of tea.',
        progressAssessment: 'Baseline established. Strong intellectual engagement. Self-care is clearly deprioritised behind work and parenting.',
        notes: `TRANSCRIPT — Session 1 (2025-11-04)

Coach: Emma, welcome. Thank you for making the time to come and chat today. Before we dive in, how are you feeling about being here?

Emma: Honestly? A bit sceptical. Not about you — about myself. I\'ve done the whole "right, I\'m going to sort myself out" thing before and it lasts about two weeks. But my colleague Rachel raves about coaching so I thought, why not.

Coach: That\'s completely fair, and I appreciate you being honest about that. Can you tell me a bit about what\'s going on for you at the moment? What made you pick up the phone?

Emma: It\'s the tiredness, mainly. I\'m a teacher — secondary English — and by 3pm I am absolutely done. Bone-deep tired. I\'m supposed to be teaching Year 10 about Macbeth and I can barely keep my eyes open. And then there\'s the IBS, which I\'ve had for about three years now. Some days I\'m fine, other days I\'m running to the loo between lessons. It\'s mortifying.

Coach: That sounds really draining — both physically and emotionally. When you say bone-deep tired, what does that look like day to day?

Emma: I wake up at six, get Lily ready for school — she\'s seven — drop her off, teach all day, pick her up, do homework, bath time, stories, bed. And I know I should eat better but by the time I\'ve fed Lily and done homework and bath time, I just grab toast or cereal. I literally cannot be bothered to cook for just me.

Coach: What does a typical day of eating look like for you?

Emma: Toast for breakfast. Sometimes just tea — I drink about eight cups a day, it\'s obscene. Sandwich from the canteen for lunch, usually cheese and pickle on white bread. Then pasta or beans on toast for dinner. I know it\'s terrible. I\'ve been veggie for twelve years and I think I\'ve just defaulted to carbs.

Coach: No judgement at all. And water?

Emma: What\'s that? [laughs] I basically don\'t drink water. It\'s just tea. Occasionally a glass of squash if Lily\'s having some.

Coach: You mentioned blood work recently?

Emma: Yes, Dr Okafor — my GP — ran some tests. Vitamin D is low, 28 I think she said. And ferritin is borderline at 18. She\'s given me supplements but I wanted to understand why, you know? Like, I\'ve been vegetarian for twelve years and no one\'s ever flagged iron before. Is my diet actually that bad?

Coach: That curiosity is a real strength, Emma. Understanding the "why" is exactly what we\'ll work on. Tell me about the IBS — when did that start?

Emma: About three years ago, right after Marcus and I split up. He\'s Lily\'s dad. We co-parent, it\'s mostly fine, he picks her up on Fridays. Those evenings are supposed to be my only me time but honestly I just fall asleep on the sofa by half eight. Exciting life.

Coach: And the IBS symptoms — do you notice any patterns?

Emma: They\'re definitely worse during term time. Exam season is a nightmare. And Fridays are bad, which makes no sense because that should be my easy night.

Coach: We\'ll come back to that — it might make more sense than you think. Who else is in your support network?

Emma: Mum — Bev — she helps with Lily on Wednesdays. She means well but she keeps telling me I look pale and that I\'d feel better if I ate "proper meals." Mum keeps telling me I look pale. She means well but it makes me feel worse. Like I\'m failing at the most basic thing. My best friend Jen is a teacher too, we do Saturday morning walks in the park. That\'s my favourite part of the week actually. Oh, and Monty — my cat. He\'s very judgemental about my food choices.

Coach: Monty sounds like an excellent accountability partner. Emma, I\'d love for us to start with some simple tracking this week. Would you be willing to keep a food diary — just write down everything you eat and drink — and also track your energy levels three times a day, morning, afternoon, and evening, on a scale of 1 to 10?

Emma: I can try. I warn you, the food diary is going to be deeply depressing.

Coach: And one more small thing — could you try drinking one glass of water before each cup of tea?

Emma: So basically drink water eight times a day? That\'s actually genius. Fine, I\'ll try it.

Coach: Brilliant. This is a great start, Emma. We\'re going to work through this together.

Emma: Thanks, coach. I actually feel a tiny bit less sceptical already.`,
      },
      // ── SESSION 2 ──
      {
        contact_id: contactId,
        title: 'Food Diary Insights & Gut Triggers',
        date_time: '2025-11-11T10:00:00Z',
        duration: 45,
        status: 'completed',
        platform: 'Google Meet',
        aiSessionSummary: 'Food diary review revealed heavy wheat dependence across all three meals — toast for breakfast, sandwich for lunch, pasta for dinner. Protein intake is very low for a vegetarian. IBS flare patterns emerged clearly: Friday evenings correlate with stress about Marcus picking up Lily, and Sunday nights with school week anxiety. Emma recognised the stress connection herself — a significant insight moment. She mentioned her cat Monty sat on the food diary. Water intake improved slightly with the tea strategy.',
        keyDiscussionPoints: 'Food diary shows heavy wheat dependence at all meals. Protein intake critically low. IBS flares correlate with Friday evenings (Marcus handover) and Sunday nights (school anxiety). Emma identified the stress pattern herself. Water intake slightly improved. Cat Monty sat on the food diary.',
        emotionalState: 'surprised and reflective',
        clientCommitments: 'Swap one wheat meal per day for a non-wheat alternative (e.g. oats for breakfast, rice for dinner). Try a 10-minute breathing exercise on Friday evenings. Continue energy tracking.',
        progressAssessment: 'Excellent self-awareness emerging. The stress-IBS connection is a breakthrough insight.',
        notes: `TRANSCRIPT — Session 2 (2025-11-11)

Coach: Emma, good to see you. How did the tracking go this week?

Emma: Well, Monty sat on my food diary, does that count as a contribution? He left a paw print right across Wednesday. But yes, I did it. All seven days.

Coach: Brilliant, that\'s great commitment. And the water?

Emma: I\'d say I managed about five glasses a day? The "water before tea" thing is actually clever because it just becomes part of the routine. Although I did cheat a couple of times and just had the tea.

Coach: Five glasses is a huge improvement from basically zero. What did you notice in the food diary?

Emma: That I eat bread literally constantly. Toast for breakfast. Sandwich at lunch. Pasta for dinner. I looked at it and thought, am I secretly a baker? It\'s bread all the way down.

Coach: Did anything else stand out?

Emma: There\'s barely any protein. Like, cheese is about it. And I know tofu exists but honestly, I look at tofu and my soul leaves my body. I think I became vegetarian for ethical reasons and then just... stopped thinking about it.

Coach: Let\'s look at the energy tracking. Any patterns there?

Emma: Yes, actually. My mornings are about a 6 out of 10, which drops to a 3 by 2pm, then weirdly goes back to a 5 around 8pm. But by then Lily\'s in bed and I\'m too tired to do anything useful with it.

Coach: That afternoon crash is really common. We\'ll come back to that. Now, let\'s look at the IBS symptoms you tracked alongside the diary. I notice flares on Friday evening and Sunday night.

Emma: Yeah, Friday is supposed to be my night off because Marcus picks up Lily from school. But I spend the whole time worrying if Lily is okay at Marcus\'s. Is she eating properly? Is she missing me? Did she remember her reading book? And Sunday nights I get this dread about the school week starting. Reports due, Year 11 mocks coming up, drama club rehearsals...

Coach: So when you look at those two days — Friday and Sunday — what do you notice about the connection between your stress levels and your gut symptoms?

Emma: [pause] Oh god, it IS stress isn\'t it. I thought IBS was just a food thing. But those are literally my two most anxious times and that\'s when it flares. That\'s... actually kind of helpful to know? Like, at least it makes sense now.

Coach: That\'s a really important insight, Emma. The gut-brain connection is powerful — we\'ll explore that more next week. For now, how would you feel about trying to swap one wheat-based meal a day for something different? Not all three — just one.

Emma: I could do oats for breakfast instead of toast. My friend Jen keeps banging on about overnight oats.

Coach: Perfect. And for the Friday anxiety — would you be open to trying a simple 10-minute breathing exercise when Lily leaves?

Emma: I\'ll try. I\'m sceptical about breathing exercises but I said I\'d give everything a go.

Coach: That\'s all I ask. Same time next week?

Emma: Same time. Monty will guard my food diary in the meantime.`,
      },
      // ── SESSION 3 ──
      {
        contact_id: contactId,
        title: 'Stress-Gut Axis Deep Dive',
        date_time: '2025-11-18T10:00:00Z',
        duration: 45,
        status: 'completed',
        platform: 'Google Meet',
        aiSessionSummary: 'Deep exploration of the gut-brain connection. Emma was fascinated by the science — likened it to "the biology I should have taught instead of Shakespeare." Discussed vagus nerve function, cortisol impact on gut motility, and how chronic stress disrupts the enteric nervous system. IBS flare patterns map almost exactly to high-stress weeks at school. Drama club rehearsals add joy but also pressure. Introduced the concept of a stress audit to help Emma identify and rate her stressors systematically.',
        keyDiscussionPoints: 'Gut-brain axis explained — Emma deeply engaged. Vagus nerve, cortisol, gut motility connections. IBS flares map to school stress peaks. Drama club is joy plus pressure. Stress audit concept introduced. Emma comparing it to literature analysis — "reading the patterns."',
        emotionalState: 'fascinated and empowered',
        clientCommitments: 'Complete stress audit worksheet — identify top 3 stressors and rate each 1-10. Try one vagus nerve exercise daily (cold water on face or humming). Continue the wheat swap — oats going well.',
        progressAssessment: 'Intellectual engagement is Emma\'s superpower. She processes best when she understands the mechanism.',
        notes: `TRANSCRIPT — Session 3 (2025-11-18)

Coach: How was your week, Emma?

Emma: Better, actually. The overnight oats are a revelation. Jen was right. I feel less bloated in the mornings already. The breathing exercise on Friday was... fine. I felt a bit silly humming in my living room but Monty seemed to enjoy it.

Coach: That\'s wonderful. The bloating improvement from the oat swap is a great data point. Today I want to explore something you touched on last week — the stress-gut connection. Are you up for a bit of biology?

Emma: Always. I teach English but secretly I think I should have been a science teacher. Go on then.

Coach: So your gut has its own nervous system — it\'s called the enteric nervous system, sometimes called the "second brain." It has over 100 million neurons, more than your spinal cord. And it communicates constantly with your brain through the vagus nerve. When you\'re stressed, your brain sends signals down the vagus nerve that directly affect gut motility — how quickly or slowly things move through your digestive system.

Emma: This is like the biology I should have taught instead of Shakespeare. So when I\'m anxious about Marcus or school, my brain is literally telling my gut to freak out?

Coach: Essentially, yes. Cortisol — your stress hormone — can increase gut permeability, alter the gut microbiome, and speed up or slow down motility. That\'s why some people get diarrhoea when stressed and others get constipation.

Emma: I get both. Lucky me. So the IBS isn\'t just about what I eat — it\'s about what\'s eating me? Sorry, English teacher. I had to.

Coach: That\'s actually a perfect way to put it. Let\'s look at your stress landscape. When are your highest stress points in a typical week?

Emma: Friday evening — Marcus. Sunday night — school dread. Wednesday mornings — Bev picks up Lily so I feel guilty about working late but also relieved? And right now, drama club is in full rehearsal mode. The Christmas show is in three weeks and I\'m basically directing, designing sets, and calming down fifteen anxious Year 9s.

Coach: How does drama club fit into all of this?

Emma: It\'s the thing that makes teaching worth it. When I\'m in that hall watching them perform, I forget about everything else. But the workload around it — the late evenings, the weekend rehearsals — it adds up. I love it and it\'s killing me.

Coach: That tension between joy and pressure is really common. I\'d like you to do a stress audit this week. Write down every regular stressor, rate it 1-10 for intensity, and note whether it\'s something you can control, influence, or have to accept.

Emma: So basically literary analysis but for my life instead of a novel.

Coach: Exactly. And for the vagus nerve — there are simple exercises that can activate the parasympathetic response. Cold water on your face for 30 seconds, humming, slow exhaling where the out-breath is longer than the in-breath.

Emma: I\'m already humming. Monty-approved. I\'ll add the cold water thing.

Coach: One thing at a time is fine. How are the oats going?

Emma: Non-negotiable now. Lily wants them too. We make them together on Sunday evenings — she puts blueberries in hers and I put peanut butter. It\'s become a little ritual.

Coach: That\'s beautiful. You\'ve turned a health change into a bonding moment. That\'s exactly how sustainable change works.

Emma: Don\'t make me cry, coach. I\'ve got Year 10 in an hour.`,
      },
      // ── SESSION 4 ──
      {
        contact_id: contactId,
        title: 'Finding Movement That Feels Good',
        date_time: '2025-11-25T10:00:00Z',
        duration: 45,
        status: 'completed',
        platform: 'Google Meet',
        aiSessionSummary: 'Explored Emma\'s relationship with exercise, which is strongly negative due to failed gym memberships. However, she already walks 20 minutes each way to school and does Saturday morning park walks with best friend Jen — totalling 40+ minutes of daily movement she wasn\'t counting. Reframing "exercise" as "movement" was a breakthrough. The canal path near her house came up naturally — Lily keeps asking to explore it. Lily has frog wellies she\'s excited to wear. Agreed to try canal walks with Lily as a bonded movement habit.',
        keyDiscussionPoints: 'Strong negative association with "exercise" from failed gym memberships. Already walks 40 min daily (school commute). Saturday walks with Jen are her highlight. Canal path near home — Lily wants to explore it. Reframed exercise as movement. Canal walks as bonded habit with Lily. Lily has frog wellies.',
        emotionalState: 'surprised and enthusiastic',
        clientCommitments: 'Three canal walks with Lily per week, aim for 20 minutes each. Continue Saturday walks with Jen. Log how movement affects energy levels and gut symptoms.',
        progressAssessment: 'Movement reframe was a significant shift. Canal walks with Lily combine exercise, bonding, and nature — powerful combination.',
        notes: `TRANSCRIPT — Session 4 (2025-11-25)

Coach: Hi Emma, how are you this week?

Emma: Exhausted. Drama club is in full panic mode — the Christmas show is in two weeks and our lead has lost his voice. But I did my stress audit, and it was eye-opening. I scored Marcus at 7, school at 8, and money at 6. The control column was depressing — most things I can only "influence" at best.

Coach: That awareness is really valuable though. Today I want to explore movement with you. How do you feel about exercise?

Emma: [laughs] I hate it. Sorry, I know that\'s not what you want to hear. The last gym I joined, I went twice and then avoided the road it was on for six months. I once hid behind a parked car when I saw the gym instructor in Tesco. I am that person.

Coach: That\'s more common than you think. Let\'s forget the word "exercise" entirely. Tell me about movement in your day.

Emma: Movement? I walk to school — it\'s about twenty minutes each way. And Saturday mornings Jen and I walk in the park, that\'s about forty-five minutes. But that\'s not really exercise, is it?

Coach: Emma, you\'re walking forty minutes a day minimum. That IS movement. Research consistently shows that regular walking is one of the most beneficial forms of physical activity.

Emma: Wait, really? I never counted it because it\'s just... getting to work. That\'s like saying brushing my teeth is self-care.

Coach: It absolutely counts. The question isn\'t "how do I start exercising" — it\'s "how do I build on what I\'m already doing." Is there any other movement you enjoy or would be open to?

Emma: There\'s a canal path near our house. Lily keeps asking to explore it. She has these little wellies with frogs on — she\'d be SO up for canal walks. She keeps pointing at it when we drive past and saying "mummy, when are we going on an adventure?"

Coach: That sounds wonderful. How would you feel about doing that three times a week?

Emma: I\'d love it actually. It wouldn\'t feel like exercise — it would be... us time. And she goes to bed better when she\'s been outside. Win-win.

Coach: Exactly. Could you also track how you feel after walks — energy and gut symptoms? We might see some useful patterns.

Emma: Yes, definitely. God, I can\'t believe walking to school counts. I\'ve been beating myself up about not exercising when I\'m already doing forty minutes a day. What an idiot.

Coach: Not an idiot at all. You just had a definition of exercise that didn\'t include what you were already doing. How are the oats and water going?

Emma: Oats are locked in. Water before tea is now habit. I\'m probably at six glasses a day. The IBS has been a bit better this week actually — only one bad day, which was Sunday night. Classic.

Coach: That\'s real progress, Emma. Let me know how the canal walks go.

Emma: I\'m going to tell Lily tonight. She\'s going to lose her mind about the frog wellies.`,
      },
      // ── SESSION 5 ──
      {
        contact_id: contactId,
        title: 'Mapping the Energy Crash',
        date_time: '2025-12-02T10:00:00Z',
        duration: 45,
        status: 'completed',
        platform: 'Google Meet',
        aiSessionSummary: 'Energy tracking reveals a clear pattern: reasonable at 7am (6/10), crashes to 3/10 at 2-3pm, second wind at 8pm (too late, delays sleep). The afternoon crash correlates with carb-heavy, low-protein lunches. Discussed protein requirements for vegetarians and brainstormed affordable options given Emma\'s single-income teacher salary — eggs, tinned lentils, Greek yoghurt, peanut butter, edamame. Overnight oats with peanut butter already helping mornings. Emma excited about protein additions. Lily calls Emma\'s afternoon mood "grumpy mummy time" which was an emotional turning point.',
        keyDiscussionPoints: 'Energy pattern: 6/10 morning, 3/10 at 2pm, 5/10 at 8pm. Afternoon crash linked to carb-heavy, low-protein lunches. Staffroom biscuits as coping mechanism. Discussed affordable vegetarian protein sources. Cost concerns — single income teacher salary. "Grumpy mummy time" comment from Lily was emotional. Canal walks happening 2/week.',
        emotionalState: 'motivated but emotional',
        clientCommitments: 'Add protein to lunch every day for a week (lentil soup, egg sandwich, hummus wraps). Try overnight oats with protein powder or peanut butter for breakfast 3 times. Track 2pm energy specifically.',
        progressAssessment: 'The "grumpy mummy" insight is a powerful motivator. Protein gap is likely a major contributor to fatigue. Affordable options identified.',
        notes: `TRANSCRIPT — Session 5 (2025-12-02)

Coach: How was the week? How did the canal walks go?

Emma: Oh coach, they were wonderful. We\'ve done two so far. Lily wore her frog wellies and spent the entire time narrating everything like a nature documentary. She found a duck family and named them all after characters from Frozen. I haven\'t laughed that hard in weeks.

Coach: That sounds magical. And how did you feel afterwards?

Emma: Better, actually. More energy. And my gut was calmer on the days we walked. I don\'t know if that\'s the movement or just being happy.

Coach: Probably both — they\'re connected. Let\'s look at your energy tracking this week. What patterns did you notice?

Emma: Right, so mornings I\'m about a 6. Not amazing but functional. By 2pm I\'m dead. Like, 3 out of 10. Honestly by 3pm I\'m running on fumes and biscuits from the staffroom. The staffroom biscuit tin is my nemesis. And then weirdly I perk up about 8pm, which is annoying because Lily\'s in bed and I should be winding down but instead I get this second wind.

Coach: That 2pm crash is telling us something. Let\'s look at what you\'re eating at lunch.

Emma: Cheese sandwich. Or sometimes just a cereal bar and a cup of tea if I\'m rushing between classes.

Coach: What\'s the protein in those meals?

Emma: Cheese, I suppose. That\'s about it. Oh god, is this about protein? My mum\'s been saying this for years.

Coach: Your mum might be onto something. As a vegetarian, you need to be more intentional about protein. It\'s the nutrient that stabilises blood sugar and sustains energy. When you eat a carb-heavy lunch with minimal protein, your blood sugar spikes and then crashes — that 2pm wall.

Emma: So the staffroom biscuits are making it worse?

Coach: They give you a quick spike then drop you lower. How would you feel about adding protein to lunch this week?

Emma: I mean, yes, but I need it to be easy and cheap. I\'m on a teacher\'s salary with one income. I can\'t be doing fancy quinoa bowls.

Coach: Completely understand. Let\'s brainstorm affordable options. Eggs — you can batch-boil for the week. Tinned lentils — you can make a big pot of soup on Sunday. Greek yoghurt. Peanut butter — you already like this on your oats. Hummus and veg sticks.

Emma: I could do lentil soup actually. Lily likes it too. And egg sandwiches instead of cheese sometimes.

Coach: Perfect. One more thing — you mentioned Lily calls your afternoon mood something?

Emma: [voice catches] Yeah. Grumpy mummy time. She said it so casually the other day. "Is it grumpy mummy time yet?" Like it\'s just a normal part of the schedule. Between three and five, mummy is grumpy. That just... yeah. That hit hard.

Coach: I can hear that. She\'s not saying it to hurt you — she\'s just describing what she sees.

Emma: I know. That\'s almost worse. It\'s so normal to her that mummy runs out of energy halfway through the day. I don\'t want that to be her memory of childhood.

Coach: Then let\'s use that as fuel. The protein changes should help with the energy crash. And you\'re already walking more, sleeping a bit better, eating less wheat. These things compound.

Emma: Right. Yes. Okay. Protein at lunch. I can do this.`,
      },
      // ── SESSION 6 ──
      {
        contact_id: contactId,
        title: 'Six-Week Check-In & Progress',
        date_time: '2025-12-09T10:00:00Z',
        duration: 45,
        status: 'completed',
        platform: 'Google Meet',
        aiSessionSummary: 'Mid-programme quantified progress review. IBS flares reduced from 4-5 per week to 2-3 per week. Energy at 2pm improved from 3/10 to 5/10. Lost 2lbs (not a goal but noticed). Canal walks with Lily happening 2-3 times per week and becoming "our thing." However, Friday anxiety about Marcus remains high. Sleep still poor — averaging 6 hours, target is 7+. Emma expressed pride in progress but frustration that sleep and the Marcus situation remain stuck. Discussed basic sleep hygiene concepts.',
        keyDiscussionPoints: 'IBS flares reduced from 4-5/week to 2-3/week. Energy at 2pm up from 3/10 to 5/10. Weight down 2lbs unintentionally. Canal walks 2-3 times/week with Lily — "our thing." Friday anxiety still high. Sleep averaging 6 hours, wants 7+. Protein additions working well. Saturday walks with Jen continue.',
        emotionalState: 'proud but frustrated',
        clientCommitments: 'Set a screens-off time of 9:30pm. Create a Friday evening ritual — bath, book, specific playlist. Continue protein additions at lunch.',
        progressAssessment: 'Significant progress across gut health, energy, and movement. Sleep and relationship stress are the next intervention points.',
        notes: `TRANSCRIPT — Session 6 (2025-12-09)

Coach: Welcome back, Emma. Today is our six-week mark — I thought we could do a bit of a review. How are you feeling about where things are?

Emma: Honestly? Surprised. Good surprised. I came into this thinking I\'d quit after two weeks and here we are.

Coach: Let\'s look at the numbers. IBS flares?

Emma: Down. I used to have four or five bad days a week. Now it\'s more like two or three. Still not great but noticeably better.

Coach: Energy at 2pm?

Emma: Up from a 3 to about a 5 on most days. The protein at lunch has been a game changer. The staffroom biscuit tin still calls to me but I\'m resisting more often. I had lentil soup today actually.

Coach: That\'s a significant improvement. And the canal walks?

Emma: Two or three times a week now. It\'s become our thing. Lily calls them our "science walks" because she examines every leaf and insect. Last week she found a slow worm and nearly passed out with excitement. I nearly passed out for different reasons.

Coach: That\'s wonderful. Any other changes you\'ve noticed?

Emma: I\'ve lost two pounds. Which wasn\'t the goal but I\'ll take it. And my skin looks better — Jen actually commented on it. Oh, and Monty has started sitting on my yoga mat even though I don\'t do yoga. I think he\'s manifesting for me.

Coach: So where are you still struggling?

Emma: Sleep. Still rubbish. Six hours on a good night. And Fridays are still awful — the anxiety when Lily goes to Marcus\'s hasn\'t changed at all. I know the breathing helps a bit but it doesn\'t fix the underlying worry.

Coach: Let\'s talk about sleep first. What does your evening routine look like?

Emma: Put Lily to bed at half seven. Then I sort of... decompress? Which means scrolling my phone on the sofa. I tell myself it\'ll be ten minutes and suddenly it\'s eleven o\'clock.

Coach: Would you be open to setting a screens-off time?

Emma: I know I should. Nine thirty?

Coach: That sounds realistic. And for Fridays — what if we created a specific ritual? Something you look forward to rather than something you dread?

Emma: Like what?

Coach: What would feel like a treat? A bath, a specific book, a playlist?

Emma: Actually... a bath, a book, and my comfort playlist. I have this playlist called "Friday Feelings" but I never actually use it on Fridays because I\'m too busy worrying. That could work.

Coach: Then let\'s try that this Friday.

Emma: Deal. Though Monty will probably try to join me in the bath. He has no boundaries.`,
      },
      // ── SESSION 7 ──
      {
        contact_id: contactId,
        title: 'Sleep Architecture & Recovery',
        date_time: '2025-12-16T10:00:00Z',
        duration: 45,
        status: 'completed',
        platform: 'Google Meet',
        aiSessionSummary: 'Sleep diary analysis reveals Emma falls asleep at 11pm or later despite the 9:30pm screens-off target. Phone in bed is the primary barrier — "I tell myself 5 minutes then it\'s an hour of scrolling." Discussed the sleep-cortisol-appetite cycle: poor sleep drives cortisol up, increases appetite hormones, leads to carb cravings, energy crashes, more stress. Emma recognised this cycle in herself immediately. School term ending with drama club Christmas show adding extreme pressure — she ate crisps for dinner on Tuesday. Discussed phone as her "only time that\'s mine" — reframing rest as self-care, not selfishness.',
        keyDiscussionPoints: 'Sleep diary shows falling asleep 11pm+ despite 9:30 target. Phone in bed is the main barrier. Sleep-cortisol-appetite cycle explained — Emma saw herself in it immediately. School term ending, drama club Christmas show pressure. Ate crisps for dinner on Tuesday due to time pressure. Phone scrolling as "my only time" — identity wrapped in being available/productive.',
        emotionalState: 'exhausted but determined',
        clientCommitments: 'Phone charges in kitchen from tonight — not in bedroom. Buy a physical book for bedtime reading. Allow herself drama club stress without guilt — it is temporary and will pass after the show.',
        progressAssessment: 'Sleep is the key lever. Phone removal from bedroom is the single highest-impact change. The "only time that\'s mine" insight reveals a self-worth pattern that needs gentle exploration.',
        notes: `TRANSCRIPT — Session 7 (2025-12-16)

Coach: How has the sleep been this week, Emma?

Emma: Terrible. I know. I set the 9:30 screens-off thing and I managed it exactly twice. The other five nights I was on my phone until gone eleven. The drama club show is next week and I\'m basically living at school. I ate a bag of crisps for dinner on Tuesday. A whole sharing bag. At my desk. While editing the set design on my laptop. Rock bottom.

Coach: That sounds like a really pressured week. Before we problem-solve, how are you feeling right now?

Emma: Tired. Guilty. Annoyed at myself. The usual cocktail.

Coach: Let\'s look at the sleep diary. What time are you actually falling asleep?

Emma: Eleven, half eleven. Even though I\'m in bed by ten. The phone is the problem. I know the phone thing is bad, I just... it\'s my only time that\'s mine, you know? All day I\'m giving — to students, to Lily, to the drama club. That hour scrolling in bed is the only time nobody needs anything from me.

Coach: I hear that, and it\'s valid. You deserve time that\'s yours. But I want to show you something about what happens to your body when sleep drops below seven hours consistently. Poor sleep raises cortisol — your stress hormone. Higher cortisol increases ghrelin, your hunger hormone, and decreases leptin, which tells you you\'re full. So you crave carbs, your energy crashes, you reach for biscuits, and the cycle continues.

Emma: That\'s literally my life in a paragraph. Get tired, eat badly, feel worse, sleep badly, repeat. I can see it now.

Coach: The question is: is that hour of scrolling actually restful? Or does it keep your brain buzzing?

Emma: [pause] It\'s not restful. I compare myself to other people on Instagram, I read depressing news, I worry about replies to emails. It\'s stimulation dressed up as relaxation.

Coach: What if your "me time" was genuinely restful? A physical book, a bath, your Friday playlist?

Emma: You\'re going to make me put the phone in another room, aren\'t you?

Coach: What do you think would happen if you charged it in the kitchen?

Emma: I\'d probably panic for two nights and then sleep better. Fine. Kitchen. From tonight. But I need to buy a book first.

Coach: What kind of book?

Emma: Something trashy and wonderful. A murder mystery. I used to devour those before Lily was born.

Coach: Perfect. And the drama club show — it\'s next week and then it\'s done. Can you give yourself permission to be stressed about it without guilt? It\'s temporary pressure, not permanent failure.

Emma: I hadn\'t thought of it that way. It\'s not forever. It\'s just... right now. And right now is hard. But it ends.

Coach: Exactly. You\'re not failing — you\'re in a peak demand period. The crisps for dinner aren\'t a character flaw. They\'re a symptom of an overwhelming week.

Emma: Thank you for saying that. I really needed to hear it.`,
      },
      // ── SESSION 8 ──
      {
        contact_id: contactId,
        title: 'Post-Holiday Check-In & Renewed Focus',
        date_time: '2026-01-06T10:00:00Z',
        duration: 45,
        status: 'completed',
        platform: 'Google Meet',
        aiSessionSummary: 'Post-Christmas check-in after the holiday break. Mixed results: Emma spent time at her mum Bev\'s house where Bev cooked meat dishes and commented repeatedly on Emma\'s vegetarian choices. Emma felt judged and defensive. However, she maintained canal walks with Lily (3 times over the break), and sleep improved significantly during the holidays — 7+ hours without school stress. IBS flared on Christmas Day (combination of emotional stress and rich food). Key insight from Emma: "the holiday proved that when I\'m not stressed, everything works better." New term starting — agreed to establish a sustainable routine.',
        keyDiscussionPoints: 'Christmas at Bev\'s — Bev cooked meat dishes, made comments about vegetarian diet. Emma felt judged. Maintained canal walks with Lily over break (3 times). Sleep improved to 7+ hours during holidays. IBS flared on Christmas Day — stress plus rich food. Emma\'s insight: stress is the root cause. New term routine needed.',
        emotionalState: 'reflective and determined',
        clientCommitments: 'Establish new term routine in first week back — meal prep, sleep schedule, walk schedule. Batch cook on Sunday evenings for the week ahead. Have a boundary conversation with Bev about food comments.',
        progressAssessment: 'Holiday provided a natural experiment — removing work stress improved sleep and gut symptoms dramatically. This confirms stress management as the primary lever.',
        notes: `TRANSCRIPT — Session 8 (2026-01-06)

Coach: Happy new year, Emma! How was the break?

Emma: Happy new year! The break was... illuminating. Good and bad. The good: I slept. Like, actually slept. Seven hours most nights. Without the school alarm and the lesson planning stress, my body just... recovered. The canal walks with Lily were gorgeous — we did three over the break and she\'s started a "nature journal" where she draws everything she sees. She drew a heron that looked like a dinosaur. It was brilliant.

Coach: Seven hours! That\'s incredible. And how was the IBS during the break?

Emma: Mostly better. Except Christmas Day, which was a disaster. We were at Mum\'s — Bev\'s. She cooked a full roast with all the trimmings and made a big thing about how there was "nothing proper" for me to eat because I\'m vegetarian. She\'d made a nut roast but kept saying "I don\'t know how you can eat that, it looks like cat food." In front of Lily.

Coach: How did that feel?

Emma: Like being fifteen again. Mum has never accepted the vegetarian thing. She thinks I\'m doing it to be difficult. She kept saying "you\'d have more energy if you ate proper protein" — which, yes, is technically partly true, but coming from her it feels like an attack. I had stomach cramps for the rest of the day.

Coach: The Christmas Day flare — do you think that was the food or the emotional stress?

Emma: Both. Rich food I wouldn\'t normally eat, plus Mum making comments, plus Marcus texted to say he\'d be late picking Lily up on the 27th which threw off my whole plan. It was a perfect storm.

Coach: You said something interesting — "the holiday proved that when I\'m not stressed, everything works better." Can you tell me more about that?

Emma: When there\'s no school, I sleep better. When I sleep better, I eat better. When I eat better, my gut is calmer. When my gut is calm, I have more energy. It\'s all connected. The holiday proved that I\'m not broken — I\'m just overwhelmed.

Coach: That\'s a really powerful insight, Emma. So the question for this new term is: how do we protect some of that holiday calm in the middle of a normal week?

Emma: Routine, I think. I need a system. Batch cooking on Sundays — Lily and I already do the overnight oats together, maybe we add a big pot of soup or a curry. And I need to get back to the 9:30 screens-off. I slipped over Christmas — my phone was back in the bedroom.

Coach: Phone back to the kitchen?

Emma: Phone back to the kitchen. And one more thing — I need to talk to Mum about the food comments. I know it\'s going to be awful but I can\'t have another Christmas like that.

Coach: We can work on how to approach that conversation. Would that be helpful for next session?

Emma: Yes. I need a script. Left to my own devices I\'ll either say nothing or explode.`,
      },
      // ── SESSION 9 ──
      {
        contact_id: contactId,
        title: 'Navigating Food Conversations with Family',
        date_time: '2026-01-13T10:00:00Z',
        duration: 45,
        status: 'completed',
        platform: 'Google Meet',
        aiSessionSummary: 'Difficult session. Emma attempted the boundary conversation with her mum Bev about food comments. It went "terribly" — Bev cried and said she was "just trying to help." Emma felt extreme guilt. Explored the concept of boundaries as self-care rather than selfishness. Role-played alternative phrases for future conversations. Additionally, Marcus changed the Friday pickup schedule without consulting Emma — now collecting Lily directly from school, which means Emma doesn\'t get to say goodbye. She\'s upset but hasn\'t addressed it. Discussed Emma\'s conflict avoidance pattern and how it affects both her relationships and her gut health.',
        keyDiscussionPoints: 'Boundary conversation with Bev backfired — Bev cried, Emma felt guilty. Discussed boundaries as self-care not selfishness. Role-played alternative phrases. Marcus changed Friday schedule unilaterally — picks Lily from school directly. Emma doesn\'t get goodbye. Avoidance pattern identified: Emma suppresses needs to avoid conflict, which drives gut symptoms. Journaling introduced as processing tool.',
        emotionalState: 'guilty and upset',
        clientCommitments: 'Write down (not send) what she wants to say to Marcus about the schedule change. Practice one boundary phrase with Bev at next visit ("I love that you care, and I need you to trust my choices"). Journal for 5 minutes daily about feelings — she has never done this before.',
        progressAssessment: 'Emotional boundaries are the next major growth area. The avoidance pattern is deeply entrenched and directly impacts gut health. Gentle, sustained work needed.',
        notes: `TRANSCRIPT — Session 9 (2026-01-13)

Coach: How did the conversation with Bev go?

Emma: [long pause] Terribly. I mean, I tried. I said "Mum, when you comment on my food choices it makes me feel like I\'m not doing a good enough job." And she just... crumbled. Started crying. Said she was just trying to help, that she worries about me and Lily, that she doesn\'t understand why I won\'t eat properly. I felt like the worst daughter in the world.

Coach: That sounds really painful. How are you feeling about it now?

Emma: Guilty. And angry at myself for feeling guilty. She\'s the one who keeps making comments but somehow I\'m the villain for asking her to stop. How does that work?

Coach: It\'s a very common dynamic. When you set a boundary with someone who\'s used to not having one, their initial reaction is often distress. That doesn\'t mean you did something wrong.

Emma: I know that intellectually. But in the moment, when your mum is crying in the kitchen, intellectual understanding goes out the window.

Coach: Let\'s work on a softer approach for next time. Something like: "I love that you care about me and Lily. I need you to trust that I\'m making good choices for us." How does that feel?

Emma: Better. Less confrontational. I could try that. Maybe.

Coach: There\'s no rush. Now, you mentioned something about Marcus in your text this week?

Emma: He\'s changed the Friday arrangement. He used to pick Lily up from our house, so I\'d get to say goodbye, do the handover, make sure she has everything. Now he\'s picking her up directly from school. He just told me. Didn\'t ask. And Lily went along with it because of course she did — she gets to leave school with Daddy, it\'s exciting.

Coach: How does that feel?

Emma: Like I don\'t matter. Like my feelings about the transition don\'t count. But with Marcus, I just... I don\'t want to be difficult. He\'ll say I\'m being controlling. He\'ll say I should be grateful he\'s involved. And he\'s right, some dads aren\'t. So I should just shut up about it.

Coach: I notice you said "should" three times in that answer.

Emma: [pause] I did, didn\'t I? "Should be grateful. Should shut up. Should be easier." That\'s basically my internal monologue.

Coach: What would happen if you told Marcus how the schedule change makes you feel?

Emma: He\'d sigh. He\'d say I\'m overthinking it. And I\'d apologise for bringing it up. I can see the whole conversation already.

Coach: Here\'s what I\'d like you to try. Don\'t have the conversation yet. Instead, write down what you want to say to Marcus. Just for yourself. Not to send. The act of putting feelings into words can help you process them.

Emma: Like journaling?

Coach: Exactly. Would you be open to five minutes of journaling every day this week? It doesn\'t have to be about Marcus — anything you\'re feeling.

Emma: I\'ve never journaled before. I\'m an English teacher and I\'ve never written in a journal. The irony. But yes, I\'ll try.

Coach: How\'s everything else? Sleep, gut, walking?

Emma: Sleep is okay — back to the kitchen phone rule. Six and a half hours. Gut had two bad days this week — both after the Bev conversation, which is not a coincidence. Canal walks continuing — Lily and I went in the rain on Monday and it was actually magical. She said the canal looked like "silver soup."

Coach: Silver soup. She should be the writer in the family.

Emma: Don\'t tell her that or she\'ll start a podcast.`,
      },
      // ── SESSION 10 ──
      {
        contact_id: contactId,
        title: 'Gut Health Reassessment & Next Steps',
        date_time: '2026-01-20T10:00:00Z',
        duration: 45,
        status: 'completed',
        platform: 'Google Meet',
        aiSessionSummary: 'Significant progress review session. IBS flares down from 4-5 per week to an average of 1 per week — major improvement. Energy at 2pm now consistently 6/10, up from the original 3/10 baseline. Overnight oats are "non-negotiable now." Canal walks with Lily happening 4 times per week. Sleep averaging 6.5 hours, still below target of 7+. Ferritin retest with Dr Okafor is upcoming — Emma is nervous about results. Discussed introducing fermented foods — sauerkraut and kefir — but Emma is cautious after a bad experience with kombucha. Emma shared a powerful reflection: "Something shifted. I used to feel like health was this massive mountain. Now it feels like I\'m just walking up a hill. A manageable hill." Lily told Marcus that "mummy does science walks now" — deeply meaningful to Emma.',
        keyDiscussionPoints: 'IBS flares down to 1/week average. Energy at 2pm: 6/10 (was 3/10). Canal walks 4/week with Lily. Sleep 6.5 hours average. Ferritin retest upcoming — nervous. Introducing fermented foods — sauerkraut, kefir. Previous bad kombucha experience. Journaling helping with Marcus situation. Lily told Marcus about "science walks." Emma\'s mountain-to-hill metaphor.',
        emotionalState: 'confident and emotional',
        clientCommitments: 'Start with one tablespoon sauerkraut every other day. Book ferritin retest with Dr Okafor. Continue journaling — finding it helpful for processing the Marcus situation.',
        progressAssessment: 'Remarkable 10-session progress. IBS reduction, energy improvement, movement habit established, emotional processing developing. Sleep and boundaries remain work-in-progress. Emma is in maintenance-and-deepen phase.',
        notes: `TRANSCRIPT — Session 10 (2026-01-20)

Coach: Emma, welcome back. How has the week been?

Emma: Good, actually. Properly good, not "it\'s fine" good. I had one IBS flare day — Monday, after a stressful staff meeting — but the rest of the week was calm. I went to the loo like a normal person. I can\'t believe I\'m excited about that but here we are.

Coach: That\'s huge progress. From 4-5 flares a week to one. How about energy?

Emma: Consistently about a 6 at 2pm now. Still not amazing but I\'m not reaching for the staffroom biscuits in desperation anymore. I brought lentil soup and a satsuma today. Past Emma would not recognise present Emma.

Coach: And the canal walks?

Emma: Four this week! Lily is obsessed. She\'s started a nature journal — properly documenting everything. She even asked me to identify a bird and I had to download a bird identification app. I know nothing about birds. But we figured out it was a grey wagtail and she was thrilled.

Coach: That\'s amazing. How about the journaling?

Emma: Surprisingly helpful. I wrote the Marcus letter — the one I\'m not sending. It was three pages long. I didn\'t realise I had that much to say. But getting it on paper made me feel less... stuck about it. I might talk to him eventually. But for now, the journal is enough.

Coach: Sleep?

Emma: Six and a half hours average. Phone stays in the kitchen — that\'s locked in now. The murder mystery book helps. I\'m reading two a week, it\'s like rediscovering an old friend.

Coach: Now, I wanted to discuss something new. You mentioned your ferritin retest is coming up?

Emma: Yes, Dr Okafor booked it for next week. I\'m nervous, honestly. What if the supplements haven\'t worked? What if I need injections?

Coach: Whatever the result, it\'s information, not a verdict. We\'ll work with what we learn. In the meantime, I wanted to explore introducing some fermented foods. Sauerkraut, kefir, tempeh — these can support your gut microbiome alongside all the other changes you\'ve made.

Emma: I\'m willing to try but I need to tell you about the kombucha incident. Last time I tried kombucha I was in the bathroom all afternoon. It was at a work thing. In a school. I will never live it down.

Coach: [laughs] That\'s a valid concern. Kombucha can be strong. We\'d start much gentler — one tablespoon of sauerkraut every other day. Not a whole bottle of kombucha.

Emma: One tablespoon. I can handle that. Monty will want to sniff it.

Coach: Let\'s let Monty be the quality control. Emma, I want to step back for a moment. You started here ten weeks ago feeling exhausted, sceptical, and overwhelmed. Where are you now?

Emma: [pause] Something shifted. I used to feel like health was this massive mountain. Now it feels like... I\'m just walking up a hill. A manageable hill. I\'m not at the top yet — sleep is still rubbish, the Marcus thing is ongoing, Mum is... Mum. But I\'m walking. And Lily is walking with me.

Coach: That\'s beautifully put.

Emma: Oh, and she told Marcus that mummy does "science walks" now. I nearly cried. She\'s proud of me, coach. My seven-year-old is proud of me.

Coach: She has every reason to be.

Emma: Right, I need to go before I actually cry. Sauerkraut, ferritin test, journaling. Got it.

Coach: You\'ve got this, Emma.`,
      },
    ];

    const sessions = [];
    for (const s of sessionData) {
      const created = await base44.asServiceRole.entities.Session.create(s);
      sessions.push(created);
    }

    // ── Step 3: Create 5 Notes (2 pinned, 3 not) ─────────────────────────
    const noteData = [
      {
        title: 'Key Motivator — Lily',
        content: 'Everything comes back to Lily. Emma\'s primary drive is being present and energetic for her daughter. "Grumpy mummy time" was a turning point — she doesn\'t want Lily to associate afternoons with an exhausted parent. Use this anchor when motivation dips.',
        noteType: 'Insight',
        isPinned: true,
        linkedContact: contactId,
      },
      {
        title: 'IBS Trigger Pattern',
        content: 'IBS flares correlate strongly with emotional stress, not just food. Friday evenings (Marcus handover anxiety) and Sunday nights (school week dread) are peak times. The gut-brain connection resonated deeply with Emma — she processes best when she understands the mechanism behind what\'s happening.',
        noteType: 'Clinical',
        isPinned: true,
        linkedContact: contactId,
        linkedSession: sessions[1]?.id,
      },
      {
        title: 'Bev Relationship Dynamic',
        content: 'Emma\'s mum Bev is well-meaning but critical about diet. Comments about vegetarian choices make Emma feel like she\'s failing. Boundary conversation in session 9 backfired — Bev cried, Emma felt guilty. Tread carefully — Emma carries guilt about asserting herself with her mum. Don\'t push too fast on this.',
        noteType: 'Insight',
        isPinned: false,
        linkedContact: contactId,
        linkedSession: sessions[8]?.id,
      },
      {
        title: 'Movement Reframe Success',
        content: 'Emma went from "I hate exercise" to walking 40+ minutes daily without realising it. The reframe from "exercise" to "movement" was key. Canal walks with Lily are now a bonded habit — protect this. Lily\'s frog wellies, nature journals, "science walks" label. Do not suggest gym or structured exercise — it triggers negative associations.',
        noteType: 'Insight',
        isPinned: false,
        linkedContact: contactId,
        linkedSession: sessions[3]?.id,
      },
      {
        title: 'Marcus Co-Parenting Stress',
        content: 'Marcus is amicable but makes unilateral schedule changes. Emma avoids conflict — "I don\'t want to be difficult." This avoidance pattern affects her gut symptoms directly. She wrote a 3-page unsent letter to Marcus which helped process feelings. Boundary work is ongoing — journaling is the current processing tool. Don\'t push for direct confrontation yet; she\'s building capacity gradually.',
        noteType: 'Insight',
        isPinned: false,
        linkedContact: contactId,
        linkedSession: sessions[8]?.id,
      },
    ];

    const notes = [];
    for (const n of noteData) {
      const created = await base44.asServiceRole.entities.Note.create(n);
      notes.push(created);
    }

    // ── Step 4: Create 4 Tasks ──────────────────────────────────────────
    const taskData = [
      {
        title: 'Book ferritin retest with Dr Okafor',
        description: 'Emma needs to book a ferritin blood test with Dr Okafor at Southmead Practice. She is nervous about the results — reassure her that the result is information, not a verdict. Follow up on whether supplements have moved the needle from baseline 18 ug/L.',
        due_date: '2026-01-27',
        status: 'open',
        priority: 'high',
        contact_id: contactId,
        session_id: sessions[9]?.id,
      },
      {
        title: 'Prepare 10-session progress summary',
        description: 'Create a comprehensive 10-session progress summary for Emma covering: IBS frequency reduction (4-5/week to 1/week), energy improvement (3/10 to 6/10 at 2pm), movement habits established (canal walks 4/week, school commute walk), nutrition changes (overnight oats, protein at lunch, wheat reduction), sleep progress (6 to 6.5 hours, phone in kitchen). Emma responds well to seeing her progress quantified.',
        due_date: '2026-01-27',
        status: 'open',
        priority: 'medium',
        contact_id: contactId,
      },
      {
        title: 'Send Emma journaling prompts resource',
        description: 'Emma started journaling in session 9 and is finding it helpful. Send her a structured journaling prompts guide — focus on emotion processing, gratitude, and daily reflection. Keep it simple and time-efficient (5 minutes). She\'s an English teacher so she\'ll appreciate good writing prompts.',
        due_date: '2026-01-24',
        status: 'in_progress',
        priority: 'medium',
        contact_id: contactId,
        session_id: sessions[8]?.id,
      },
      {
        title: 'Research vegetarian ferritin-rich meal ideas',
        description: 'Compile a list of affordable, easy vegetarian meals high in iron/ferritin for Emma. Must be budget-friendly (teacher salary, single income). She already likes lentil soup, overnight oats with peanut butter, and egg sandwiches. Avoid tofu — she dislikes it. Consider vitamin C pairing for iron absorption.',
        due_date: '2026-01-24',
        status: 'open',
        priority: 'low',
        contact_id: contactId,
      },
    ];

    const tasks = [];
    for (const t of taskData) {
      const created = await base44.asServiceRole.entities.Task.create(t);
      tasks.push(created);
    }

    // ── Step 5: Create Journey + ContactJourney ──────────────────────────
    const journey = await base44.asServiceRole.entities.Journey.create({
      title: '16-Week Energy & Gut Health Programme',
      status: 'active',
      duration: '16 weeks',
      is_template: false,
      category: 'Gut Health & Energy',
    });

    const contactJourney = await base44.asServiceRole.entities.ContactJourney.create({
      contact_id: contactId,
      journey_id: journey.id,
      status: 'in_progress',
      started_at: '2025-11-04T10:00:00Z',
      progress_percentage: 69,
      current_step_number: 11,
      notes: 'Emma is 10 sessions into her 16-week programme. IBS flares reduced from 4-5/week to 1/week. Energy at 2pm improved from 3/10 to 6/10. Canal walks with Lily established as a bonded movement habit (4/week). Sleep improving but still below target. Boundary work with mum (Bev) and ex-husband (Marcus) ongoing. Ferritin retest pending.',
    });

    // ── Verification ────────────────────────────────────────────────────
    // Count transcript words
    const transcriptWordCounts = sessionData.map((s, i) => ({
      session: i + 1,
      title: s.title,
      wordCount: (s.notes || '').split(/\s+/).length,
      hasTranscript: !!(s.notes && s.notes.length > 500)
    }));

    const namedPeople = ['Lily', 'Marcus', 'Bev', 'Jen', 'Monty', 'Dr Okafor'];
    const specificDetails = ['frog wellies', 'canal path', 'overnight oats', 'staffroom biscuits',
      'kombucha', 'drama club', 'Christmas show', 'science walks', 'Monty', 'grumpy mummy',
      'silver soup', 'grey wagtail', 'murder mystery', 'Macbeth', 'Shakespeare'];

    const allTranscriptText = sessionData.map(s => s.notes || '').join(' ');
    const foundPeople = namedPeople.filter(name => allTranscriptText.includes(name));
    const foundDetails = specificDetails.filter(detail => allTranscriptText.toLowerCase().includes(detail.toLowerCase()));

    return new Response(JSON.stringify({
      success: true,
      seed_time_ms: Date.now() - startTime,
      contact_id: contactId,
      created: {
        contact: contact.full_name,
        sessions: sessions.length,
        notes: notes.length,
        tasks: tasks.length,
        journey: journey.title,
        contact_journey: contactJourney.id,
      },
      ids: {
        contact: contactId,
        sessions: sessions.map(s => s.id),
        notes: notes.map(n => n.id),
        tasks: tasks.map(t => t.id),
        journey: journey.id,
        contact_journey: contactJourney.id,
      },
      verification: {
        session_count: sessions.length,
        transcript_word_counts: transcriptWordCounts,
        notes_count: notes.length,
        pinned_notes: noteData.filter(n => n.isPinned).length,
        tasks_count: tasks.length,
        journey_step: '11/16',
        journey_progress: '69%',
        named_people_found: foundPeople,
        named_people_missing: namedPeople.filter(n => !foundPeople.includes(n)),
        specific_details_found: foundDetails,
        specific_details_missing: specificDetails.filter(d => !foundDetails.includes(d)),
      }
    }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack?.slice(0, 500),
      seed_time_ms: Date.now() - startTime,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
