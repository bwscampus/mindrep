// data/lessons.js — All module & lesson content

export const MODULES = [
  {
    id: 1,
    title: "The Mental Game Begins",
    emoji: "🧠",
    color: "#8B93A3",
    description: "Discover why mindset is the secret weapon every athlete needs.",
    locked: false,
    lessons: [
      {
        id: "1.1",
        title: "Why Your Mind Matters",
        duration: 5,
        xp: 50,
        sections: [
          {
            type: "hook",
            label: "Hook",
            emoji: "⚡",
            content: {
              title: "One moment. Two outcomes.",
              body: `It's the final seconds of the game. The score is tied. You step up to take the shot.\n\nTwo athletes are in this exact situation. One is thinking: <strong>"What if I miss? Everyone is watching. I always blow the big moments."</strong>\n\nThe other is thinking: <strong>"This is what I train for. One shot. Focus."</strong>\n\nSame game. Same pressure. Same shot.\n\nDifferent minds. Different results.`,
              question: "Which athlete's mindset sounds more like yours right now?"
            }
          },
          {
            type: "instruction",
            label: "Lesson",
            emoji: "📖",
            content: {
              title: "Your Mind is a Muscle",
              body: `Here's something most athletes don't know: <strong>mental skills are trainable</strong> — just like speed, strength, or technique.\n\nTrevor Moad, one of the world's top mental performance coaches, worked with NFL players, Olympians, and elite military units. His #1 finding?\n\n<strong>The mind controls the body — and you can train your mind.</strong>\n\nResearch shows that athletes who practice mental skills perform better under pressure, recover faster from mistakes, and feel more confident on game day.\n\nThis app is your 30-day mental training camp. A few minutes a day. Real results.`,
              highlight: "\"The most important muscle you develop is the one between your ears.\" — Sports Psychology Research"
            }
          },
          {
            type: "activity",
            label: "Activity",
            emoji: "✏️",
            content: {
              title: "Your Mental Starting Point",
              description: "Rate yourself right now (0 = never, 5 = always):",
              sliders: [
                { id: "s1", label: "I stay calm after a mistake", emoji: "😤→😌" },
                { id: "s2", label: "I believe in myself before big games", emoji: "💪" },
                { id: "s3", label: "I focus on what I can control", emoji: "🎯" },
                { id: "s4", label: "I bounce back quickly", emoji: "⚡" }
              ]
            }
          },
          {
            type: "quiz",
            label: "Quiz",
            emoji: "🧪",
            content: {
              questions: [
                {
                  q: "Mental skills in sports are:",
                  options: ["Gifts you're born with and can't change", "Trainable skills that improve with practice ✓", "Less important than physical skills", "Only for professional athletes"],
                  correct: 1,
                  explanation: "Mental skills are 100% trainable! Just like lifting weights builds muscles, practicing mental techniques builds your mental game."
                },
                {
                  q: "What did Trevor Moad find about elite athletes?",
                  options: ["They never feel nervous", "They avoid pressure situations", "They train their minds just like their bodies ✓", "They rely only on natural talent"],
                  correct: 2,
                  explanation: "Elite athletes consistently use mental training as a core part of their preparation."
                },
                {
                  q: "About how long is each lesson in this app?",
                  options: ["30 minutes", "1 hour", "5 to 10 minutes ✓", "15 minutes"],
                  correct: 2,
                  explanation: "A few minutes a day is all it takes. Small daily habits lead to massive mental gains!"
                }
              ]
            }
          },
          {
            type: "tiein",
            label: "Game Prep",
            emoji: "🏆",
            content: {
              title: "Your First Mental Rep",
              body: "Before your next practice or game, take 30 seconds and ask yourself: <strong>\"What is ONE thing my mind does well?\"</strong>\n\nWrite it down. Speak it out loud. This is your first mental rep.\n\nCome back tomorrow for Lesson 1.2 — where you'll learn the skill that separates good athletes from great ones.",
              action: "journal",
              journalPrompt: "What is ONE mental strength I already have as an athlete?"
            }
          }
        ]
      },
      {
        id: "1.2",
        title: "Neutral Thinking",
        duration: 5,
        xp: 60,
        sections: [
          {
            type: "hook",
            label: "Hook",
            emoji: "⚡",
            content: {
              title: "The Mistake Spiral",
              body: `You miss a shot. Your brain immediately says: <strong>"I'm terrible. Why does this always happen to me?"</strong>\n\nThat thought leads to tension. Tension leads to another mistake. The spiral begins.\n\nBut what if there was a way to <strong>stop the spiral before it starts?</strong>\n\nThat's exactly what <strong>Neutral Thinking</strong> does — and it's the #1 tool of world-class athletes.`,
              question: "When was the last time a mistake made you spiral during a game?"
            }
          },
          {
            type: "instruction",
            label: "Lesson",
            emoji: "📖",
            content: {
              title: "Think Neutral, Not Negative",
              body: `Trevor Moad's most powerful concept: <strong>Neutral Thinking</strong>.\n\nHere's how it works:\n\n❌ <strong>Negative:</strong> "I missed that shot. I'm the worst. This team deserves better than me."\n\n😐 <strong>Neutral:</strong> "I missed that shot. The next one is all that matters."\n\n✅ <strong>Positive:</strong> (Can work but sometimes feels fake under pressure)\n\nNeutral thinking is powerful because it's <strong>factual and forward-moving</strong>. You don't pretend the mistake didn't happen. You just don't let it write your story.\n\nThe past is not predictive. <strong>The next moment is all you control.</strong>`,
              highlight: "Facts → Accept → Next Action. That's the neutral loop."
            }
          },
          {
            type: "activity",
            label: "Activity",
            emoji: "✏️",
            content: {
              title: "Swipe to Neutral",
              description: "Tap each negative thought to flip it to a neutral response:",
              swipeCards: [
                { negative: "\"I always choke in big games.\"", neutral: "\"That's one moment. The next play is mine.\"", emoji: "😤" },
                { negative: "\"I'm the worst player on the team.\"", neutral: "\"I'm working on my game every day.\"", emoji: "😞" },
                { negative: "\"Why does this always happen to me?\"", neutral: "\"What's my next move right now?\"", emoji: "🤯" },
                { negative: "\"Everyone is watching me fail.\"", neutral: "\"Focus on the ball, not the crowd.\"", emoji: "😰" }
              ]
            }
          },
          {
            type: "quiz",
            label: "Quiz",
            emoji: "🧪",
            content: {
              questions: [
                {
                  q: "Which response best shows Neutral Thinking after a bad play?",
                  options: ["\"I'm terrible, I ruined everything\"", "\"Everything is perfect, no worries!\"", "\"That happened. What's my next move?\" ✓", "\"I'm going to quit if this keeps up\""],
                  correct: 2,
                  explanation: "Neutral thinking acknowledges the mistake without judgment and immediately focuses forward."
                },
                {
                  q: "Why is neutral thinking more effective than forced positivity?",
                  options: ["It feels better emotionally", "It's based on facts and keeps you action-focused ✓", "It's easier to do", "Coaches prefer it"],
                  correct: 1,
                  explanation: "Forced positivity can feel fake under pressure. Neutral thinking is grounded in reality and keeps your brain focused on what's next."
                },
                {
                  q: "\"The past is not predictive\" means:",
                  options: ["You should forget your mistakes", "One bad moment doesn't determine your future ✓", "Stats don't matter", "Only practice matters"],
                  correct: 1,
                  explanation: "A mistake doesn't define you. Each moment is a fresh opportunity to perform."
                }
              ]
            }
          },
          {
            type: "tiein",
            label: "Game Prep",
            emoji: "🏆",
            content: {
              title: "Your Neutral Phrase",
              body: "Create your personal <strong>neutral reset phrase</strong> — a short statement you say after a mistake to snap back to the present.\n\nExamples:\n• \"Next play.\"\n• \"Move on. I got this.\"\n• \"Facts. Focus. Forward.\"\n\nThis phrase will live in your Pre-Game Checklist for quick access during games.",
              action: "journal",
              journalPrompt: "Write your personal neutral reset phrase (keep it short — 3 words max!):"
            }
          }
        ]
      },
      {
        id: "1.3",
        title: "The Reset Button",
        duration: 5,
        xp: 70,
        sections: [
          {
            type: "hook",
            label: "Hook",
            emoji: "⚡",
            content: {
              title: "3 seconds that change everything",
              body: `The world's best athletes have a hidden weapon they use after every mistake.\n\nIt takes just <strong>3 seconds</strong>.\n\nIt resets their brain, stops the spiral, and gets them back in the zone.\n\nIt's called a <strong>Reset Routine</strong> — and after today's lesson, you'll have your own.`,
              question: "What do you currently do right after making a mistake in a game?"
            }
          },
          {
            type: "instruction",
            label: "Lesson",
            emoji: "📖",
            content: {
              title: "The 3R Reset Method",
              body: `Elite athletes use a 3-step reset between plays:\n\n<strong>1. Recognize</strong> — Notice the mistake. One breath. Don't judge it.\n\n<strong>2. Release</strong> — Physical cue: shake your hands, take a deep breath, adjust your gear. Signal to your brain: "That moment is done."\n\n<strong>3. Refocus</strong> — Speak your neutral phrase. Lock eyes on the next play. Go.\n\nThe physical cue is KEY. Your body and brain are connected. A physical release signal breaks the mental loop.\n\nNFL quarterbacks do this between every play. Tennis players do it between every point. Now it's your turn.`,
              highlight: "Recognize → Release → Refocus. The 3R Reset."
            }
          },
          {
            type: "activity",
            label: "Activity",
            emoji: "✏️",
            content: {
              title: "Build Your Reset",
              description: "Choose one option from each step to create your personal reset routine:",
              builder: {
                steps: [
                  {
                    step: "Release Signal",
                    label: "Pick your physical cue:",
                    options: ["Take a deep breath 💨", "Shake my hands 🤲", "Tap my chest ✋", "Adjust my gear 🏅"]
                  },
                  {
                    step: "Neutral Phrase",
                    label: "Your reset phrase (from lesson 1.2):",
                    options: ["\"Next play.\"", "\"Move on.\"", "\"Facts. Focus. Forward.\"", "My own phrase ✏️"]
                  },
                  {
                    step: "Lock In",
                    label: "How you refocus:",
                    options: ["Eyes on the ball 👀", "Find my position 📍", "Look at a teammate 🤝", "Deep scan of the field 🏟️"]
                  }
                ]
              }
            }
          },
          {
            type: "quiz",
            label: "Quiz",
            emoji: "🧪",
            content: {
              questions: [
                {
                  q: "What is the purpose of a physical release signal?",
                  options: ["To look calm to your opponents", "To signal to your brain that the moment is done ✓", "To tire out your muscles", "To get a coach's attention"],
                  correct: 1,
                  explanation: "The body-brain connection is powerful. A physical cue tells your nervous system to move on from the previous moment."
                },
                {
                  q: "Put the 3Rs in the correct order:",
                  options: ["Refocus → Release → Recognize", "Recognize → Refocus → Release", "Recognize → Release → Refocus ✓", "Release → Recognize → Refocus"],
                  correct: 2,
                  explanation: "First you notice the mistake (Recognize), then you break the loop physically (Release), then you focus forward (Refocus)."
                },
                {
                  q: "Why do elite athletes use reset routines between every play?",
                  options: ["To slow down the game", "It's a superstition", "To prevent mistake spirals and stay present ✓", "To make opponents nervous"],
                  correct: 2,
                  explanation: "Reset routines keep athletes mentally fresh and prevent one mistake from snowballing into many."
                }
              ]
            }
          },
          {
            type: "tiein",
            label: "Game Prep",
            emoji: "🏆",
            content: {
              title: "Module 1 Complete! 🎉",
              body: "You now have three powerful tools:\n\n✅ <strong>Understanding</strong> that mental skills are trainable\n✅ <strong>Neutral Thinking</strong> — facts, not judgments\n✅ <strong>The 3R Reset</strong> — Recognize, Release, Refocus\n\nPractice your reset routine at your next training session. Notice when you need it. Use it.\n\n<strong>Module 2 is now unlocked:</strong> \"It Takes What It Takes\" — Building the No-Excuses Work Ethic.",
              action: "complete_module"
            }
          }
        ]
      }
    ]
  },
  {
    id: 2,
    title: "It Takes What It Takes",
    emoji: "💪",
    color: "#8B93A3",
    description: "Build the no-excuses work ethic that separates good from great.",
    locked: false,
    lessons: [
      {
        id: "2.1",
        title: "No Excuses, No Limits",
        duration: 6,
        xp: 65,
        sections: [
          {
            type: "hook",
            label: "Hook",
            emoji: "⚡",
            content: {
              title: "The athlete who had every reason to quit.",
              body: `Kyle Long was cut from four college football rosters. Division I coaches told him he was too slow. Too soft. Not built for the next level.\n\nHe didn't argue. He didn't blame anyone.\n\nHe just showed up — every single day — and did the work.\n\nThree years later, he was a <strong>first-round NFL draft pick</strong>.\n\nThe difference wasn't talent. It was a mindset Moad calls <strong>"It Takes What It Takes."</strong>`,
              question: "Have you ever used an excuse — weather, teammates, coaches — to explain a bad performance?"
            }
          },
          {
            type: "instruction",
            label: "Lesson",
            emoji: "📖",
            content: {
              title: "Excuses Kill Potential",
              body: `Trevor Moad identified a pattern among athletes who never reach their potential: <strong>they outsource their results.</strong>\n\nExcuses sound like:\n❌ "The ref was unfair."\n❌ "My teammates didn't show up."\n❌ "I didn't sleep well."\n\nNone of these are necessarily false. But the moment you give them power over your performance, <strong>you give away your control.</strong>\n\n"It Takes What It Takes" means this: whatever the circumstances, <strong>you still choose your response.</strong>\n\nThe conditions don't decide. You decide.`,
              highlight: "Trevor Moad's core teaching: take responsibility for what you can control — no matter the circumstances."
            }
          },
          {
            type: "activity",
            label: "Activity",
            emoji: "✏️",
            content: {
              title: "Excuse vs. Ownership",
              description: "Tap each excuse to flip it into an ownership statement:",
              swipeCards: [
                { negative: '"The coach never plays me enough."', neutral: '"I\'m going to make it impossible to ignore me in practice."', emoji: "😤" },
                { negative: '"My team doesn\'t try hard enough."', neutral: '"I\'ll lead by example. My effort is contagious."', emoji: "😞" },
                { negative: '"I\'m not as talented as the other guys."', neutral: '"I out-work talent with effort every day."', emoji: "💭" },
                { negative: '"The conditions weren\'t right."', neutral: '"I train for all conditions. I\'m built for this."', emoji: "🌧️" }
              ]
            }
          },
          {
            type: "quiz",
            label: "Quiz",
            emoji: "🧪",
            content: {
              questions: [
                {
                  q: "What does 'outsourcing your results' mean?",
                  options: ["Paying someone to train for you", "Blaming external factors for your performance ✓", "Working with a coach", "Analyzing game tape"],
                  correct: 1,
                  explanation: "When you give excuses power over your performance, you hand control of your results to things outside yourself."
                },
                {
                  q: "Kyle Long was cut from how many college football rosters before being drafted?",
                  options: ["One", "Two", "Three", "Four ✓"],
                  correct: 3,
                  explanation: "Four rejections. He didn't quit. He showed up. That's what 'It Takes What It Takes' looks like."
                },
                {
                  q: "When conditions are unfair, a mentally strong athlete:",
                  options: ["Complains to their coach", "Waits for things to improve", "Chooses their response regardless ✓", "Shuts down to protect their confidence"],
                  correct: 2,
                  explanation: "You can't always control the conditions. You always control your response."
                }
              ]
            }
          },
          {
            type: "tiein",
            label: "Game Prep",
            emoji: "🏆",
            content: {
              title: "Your Ownership Statement",
              body: `Before your next practice, write one sentence that starts with:\n\n<strong>"No matter what, I will ___."</strong>\n\nExamples:\n• "No matter what, I will sprint every rep."\n• "No matter what, I will stay locked in for all 4 quarters."\n• "No matter what, I will encourage my teammates."\n\nThis is your <strong>no-excuses commitment</strong> for the week.`,
              action: "journal",
              journalPrompt: 'Write your "No matter what, I will ___" statement for this week:'
            }
          }
        ]
      },
      {
        id: "2.2",
        title: "Effort Over Talent",
        duration: 6,
        xp: 65,
        sections: [
          {
            type: "hook",
            label: "Hook",
            emoji: "⚡",
            content: {
              title: "The most gifted player on the team — who quit.",
              body: `Every team has one. The kid who's naturally faster, stronger, and more skilled than everyone else.\n\nBy sophomore year, coaches were calling him a future Division I star.\n\nBy senior year, he was off the team.\n\nNot because he lost his talent. Because <strong>he stopped working</strong>.\n\nMeanwhile, the kid who got cut from JV twice made varsity on effort alone.\n\nTrevor Moad's coaching experience makes it clear: <strong>talent without work is just potential. Effort is what turns potential into results.</strong>`,
              question: "Have you ever been out-worked by someone less talented than you? What happened?"
            }
          },
          {
            type: "instruction",
            label: "Lesson",
            emoji: "📖",
            content: {
              title: "Effort is a Superpower",
              body: `Here's the truth about talent that no one tells you:\n\n<strong>Talent is common. Maximum effort is rare.</strong>\n\nIn Moad's work with elite teams, the athletes who stuck around longest weren't always the most gifted. They were the ones who:\n\n✅ Stayed an extra 15 minutes after every practice\n✅ Showed up when they didn't feel like it\n✅ Competed in practice the same way they competed in games\n\nNFL data backs this up: players who showed elite effort metrics in practice outperformed equally talented players in games by a measurable margin.\n\n<strong>Effort is the one performance variable you control 100% of the time.</strong>`,
              highlight: '"Hard work beats talent when talent doesn\'t work hard." — Tim Notke (popularized by Kevin Durant)'
            }
          },
          {
            type: "activity",
            label: "Activity",
            emoji: "✏️",
            content: {
              title: "Your Effort Score",
              description: "Rate your effort in each area this week (0 = none, 5 = maximum):",
              sliders: [
                { id: "e1", label: "Physical effort in practice", emoji: "🏋️" },
                { id: "e2", label: "Mental focus during drills", emoji: "🧠" },
                { id: "e3", label: "Preparation before sessions", emoji: "📋" },
                { id: "e4", label: "Attitude when things go wrong", emoji: "💪" }
              ]
            }
          },
          {
            type: "quiz",
            label: "Quiz",
            emoji: "🧪",
            content: {
              questions: [
                {
                  q: "According to Trevor Moad's coaching experience, what do the athletes who last longest have in common?",
                  options: ["The most natural talent", "The best coaches", "Consistent maximum effort ✓", "The most experience"],
                  correct: 2,
                  explanation: "Consistent effort outlasts natural talent. The ones who keep showing up and working hard build careers."
                },
                {
                  q: "Why is effort the best performance variable to focus on?",
                  options: ["It's the easiest to improve", "You can control it 100% of the time ✓", "Coaches notice it more than results", "It requires no skill"],
                  correct: 1,
                  explanation: "You can't always control outcomes, weather, opponents, or referees. Your effort level is always your choice."
                },
                {
                  q: "Talent without consistent work is best described as:",
                  options: ["A guaranteed path to success", "Just potential ✓", "Enough to succeed at the highest level", "The same as trained skill"],
                  correct: 1,
                  explanation: "Talent is the ceiling. Effort is what actually gets you there. Untrained talent stays as potential."
                }
              ]
            }
          },
          {
            type: "tiein",
            label: "Game Prep",
            emoji: "🏆",
            content: {
              title: "The Extra Rep",
              body: `This week, commit to <strong>one extra rep</strong> at every practice.\n\nNot ten. Not a whole extra session.\n\nJust one more than you would have done.\n\n• One extra sprint at the end of conditioning.\n• One extra throw after catch drills.\n• One extra review of your playbook.\n\nSmall extra reps, compounded over a season, build elite athletes.`,
              action: "journal",
              journalPrompt: "What's the ONE extra rep you'll commit to this week at practice?"
            }
          }
        ]
      },
      {
        id: "2.3",
        title: "Own Your Role",
        duration: 6,
        xp: 70,
        sections: [
          {
            type: "hook",
            label: "Hook",
            emoji: "⚡",
            content: {
              title: "The backup who won the Super Bowl.",
              body: `In 2014, Malcolm Butler was an undrafted rookie cornerback. He barely made the team.\n\nIn Super Bowl XLIX, with the game on the line, he was the one on the field.\n\nHe intercepted a pass that won the championship.\n\nButler wasn't the starter. He wasn't the star. But he <strong>owned his role so completely</strong> that when his moment came, he was ready.\n\nMoad's lesson: <strong>the athlete who masters their role — no matter how small — earns bigger roles.</strong>`,
              question: "Do you sometimes feel like your role on your team is too small? What does that feel like?"
            }
          },
          {
            type: "instruction",
            label: "Lesson",
            emoji: "📖",
            content: {
              title: "Master the Role You Have",
              body: `Every team has a star. But teams win because of the athletes who <strong>own the roles no one else wants.</strong>\n\nYour role might be:\n• Coming off the bench with energy\n• Being the defensive stopper\n• Setting the screen so someone else scores\n\nTake Steve Kerr — a player who averaged just 7 points per game — but shot the biggest shots of his career when it mattered. Why? Because Steve knew his role, prepared for it completely, and executed it without ego.\n\n<strong>Ego fights the role. Excellence masters it.</strong>`,
              highlight: "Trevor Moad's core teaching: your role is your responsibility — own it completely."
            }
          },
          {
            type: "activity",
            label: "Activity",
            emoji: "✏️",
            content: {
              title: "Define Your Role",
              description: "Tap the statements that describe your current role on the team:",
              swipeCards: [
                { negative: '"I should be playing more minutes than I get."', neutral: '"I\'ll maximize every minute I get and make the coach want to play me more."', emoji: "⏱️" },
                { negative: '"My job is boring — I just set screens."', neutral: '"Every screen I set creates a scoring chance. That\'s real impact."', emoji: "🤝" },
                { negative: '"I don\'t get credit for what I contribute."', neutral: '"The scoreboard doesn\'t measure everything I bring to this team."', emoji: "📊" },
                { negative: '"I wish I had their role, not mine."', neutral: '"I\'m going to be the best version of my role — and earn the next one."', emoji: "🎯" }
              ]
            }
          },
          {
            type: "quiz",
            label: "Quiz",
            emoji: "🧪",
            content: {
              questions: [
                {
                  q: "Malcolm Butler won the Super Bowl as:",
                  options: ["The starting quarterback", "An undrafted backup cornerback ✓", "The head coach's top pick", "A first-round draft pick"],
                  correct: 1,
                  explanation: "He owned his backup role so completely that when his moment came, he delivered the biggest play of the game."
                },
                {
                  q: "What separates athletes who master their role from those who fight it?",
                  options: ["Better physical talent", "Ego vs. excellence ✓", "More playing time", "Better coaching"],
                  correct: 1,
                  explanation: "Ego says 'I deserve more.' Excellence says 'I'll be the best at what I have.' Excellence earns more."
                },
                {
                  q: "According to Moad, what do athletes who master small roles eventually earn?",
                  options: ["A contract", "Bigger roles ✓", "Immediate starting positions", "Media attention"],
                  correct: 1,
                  explanation: "Coaches trust athletes who handle responsibility well. Small role mastery leads to bigger opportunities."
                }
              ]
            }
          },
          {
            type: "tiein",
            label: "Game Prep",
            emoji: "🏆",
            content: {
              title: "Module 2 Complete! 🎉",
              body: `You've built the no-excuses foundation:\n\n✅ <strong>No Excuses</strong> — You own your response to every circumstance\n✅ <strong>Effort Over Talent</strong> — The one variable you control 100% of the time\n✅ <strong>Own Your Role</strong> — Excellence in your role earns you the next one\n\nNext week, bring "It Takes What It Takes" energy to every practice.\n\n<strong>Module 3 is now unlocked:</strong> "Control the Controllables" — the mental skill that elite athletes use every single play.`,
              action: "complete_module"
            }
          }
        ]
      }
    ]
  },
  {
    id: 3,
    title: "Control the Controllables",
    emoji: "🎯",
    color: "#8B93A3",
    description: "Focus your energy where it counts — and release what you can't change.",
    locked: false,
    lessons: [
      {
        id: "3.1",
        title: "Your Circle of Control",
        duration: 6,
        xp: 65,
        sections: [
          {
            type: "hook",
            label: "Hook",
            emoji: "⚡",
            content: {
              title: "The athlete who wasted 3 years being angry at the wrong things.",
              body: `Marcus was one of the best quarterbacks in his state. Recruited. Talented. Hungry.\n\nHe spent two years furious at his offensive line. They missed blocks. They cost him sacks. He was constantly distracted by what they did wrong.\n\nHis stats tanked. His frustration grew.\n\nThen a mental coach gave him one question that changed everything:\n\n<strong>"Which of those things can you actually control?"</strong>\n\nZero. He couldn't control a single one. He had been burning energy on powerless problems.`,
              question: "What's something in your sport that you spend energy worrying about but can't actually control?"
            }
          },
          {
            type: "instruction",
            label: "Lesson",
            emoji: "📖",
            content: {
              title: "Two Circles. One Choice.",
              body: `Moad teaches athletes to divide everything into two circles:\n\n<strong>🎯 Circle of Control:</strong> Your effort, attitude, preparation, focus, how you respond to mistakes.\n\n<strong>🚫 Outside Your Control:</strong> Weather, referees, opponents, coaches' decisions, crowd, teammates' performance.\n\nHere's the key insight from sports psychology: <strong>athletes who focus energy inside their circle perform better under pressure.</strong>\n\nEvery mental rep you spend worrying about what's outside your control is a rep wasted. Your brain only has so much focus. <strong>Spend it where it counts.</strong>`,
              highlight: '"Focus where you have power. Release where you don\'t." — Sports Psychology Principle'
            }
          },
          {
            type: "activity",
            label: "Activity",
            emoji: "✏️",
            content: {
              title: "Sort the Circle",
              description: "Tap each item — does it belong In Your Control or Outside Your Control?",
              swipeCards: [
                { negative: "The referee's calls during the game", neutral: "Outside your control — release it. Focus forward.", emoji: "🏁" },
                { negative: "Your pre-game preparation routine", neutral: "Inside your control — own it completely.", emoji: "✅" },
                { negative: "Whether it rains on game day", neutral: "Outside your control — you train for all conditions.", emoji: "🌧️" },
                { negative: "Your attitude when things go wrong", neutral: "Inside your control — this is your biggest weapon.", emoji: "💪" }
              ]
            }
          },
          {
            type: "quiz",
            label: "Quiz",
            emoji: "🧪",
            content: {
              questions: [
                {
                  q: "Which of these is inside an athlete's Circle of Control?",
                  options: ["The referee's decisions", "Their attitude and effort ✓", "The weather conditions", "Their opponent's skill level"],
                  correct: 1,
                  explanation: "Attitude and effort are always yours. No external condition can take those from you."
                },
                {
                  q: "Why does focusing on uncontrollable things hurt performance?",
                  options: ["It makes athletes angry", "It wastes mental energy that could go toward controllables ✓", "Coaches don't like it", "It causes physical fatigue"],
                  correct: 1,
                  explanation: "Your brain has limited mental bandwidth. Every worry about the uncontrollable steals focus from what you can actually impact."
                },
                {
                  q: "What happened to Marcus when he focused on his offensive line's mistakes?",
                  options: ["His line improved", "His own stats got better", "His performance declined ✓", "Nothing changed"],
                  correct: 2,
                  explanation: "Burning energy on uncontrollable things doesn't fix them — it just drains the focus you need for your own performance."
                }
              ]
            }
          },
          {
            type: "tiein",
            label: "Game Prep",
            emoji: "🏆",
            content: {
              title: "Your Control List",
              body: `Before your next game or practice, write down:\n\n<strong>3 things you WILL control today:</strong>\n• My pre-game routine\n• My effort on every rep\n• My response to mistakes\n\n<strong>3 things you're RELEASING:</strong>\n• What others think\n• Officiating\n• Conditions\n\nThis mental sorting takes 60 seconds. It frees up hours of mental energy.`,
              action: "journal",
              journalPrompt: "List 3 things you're committed to controlling at your next game or practice:"
            }
          }
        ]
      },
      {
        id: "3.2",
        title: "Let Go of the Scoreboard",
        duration: 6,
        xp: 65,
        sections: [
          {
            type: "hook",
            label: "Hook",
            emoji: "⚡",
            content: {
              title: "The tennis player who stopped watching the score.",
              body: `It was match point. Down two sets. The crowd was silent.\n\nShe had one choice: watch the scoreboard spiral — or play tennis.\n\nShe told herself: <strong>"One ball. One point. That's all that exists."</strong>\n\nShe won that point. Then the next. Then the set. Then the match.\n\nNobody remembers the score at halftime. They remember who played their best game <strong>at the moment it mattered most.</strong>\n\nMoad calls this <strong>Process Focus</strong> — and it's what separates clutch athletes from those who shrink.`,
              question: "Have you ever gotten so focused on the score that you forgot to just play your game?"
            }
          },
          {
            type: "instruction",
            label: "Lesson",
            emoji: "📖",
            content: {
              title: "Process Over Outcome",
              body: `Here's a counterintuitive truth that elite coaches know:\n\n<strong>The athletes most obsessed with winning often perform worst under pressure.</strong>\n\nWhy? Because the scoreboard is an outcome — and outcomes are outside your circle of control.\n\nYou don't control whether the ball goes in. You control:\n• Your footwork\n• Your release\n• Your follow-through\n• Your mental state\n\nTrevor Moad has trained elite athletes to forget the scoreboard in-game. Their cue: <strong>play the next play perfectly.</strong>\n\nThe scoreboard takes care of itself when you execute the process.`,
              highlight: "Trevor Moad's core teaching: win the play in front of you. The scoreboard takes care of itself."
            }
          },
          {
            type: "activity",
            label: "Activity",
            emoji: "✏️",
            content: {
              title: "Process vs. Outcome",
              description: "Flip each outcome-focused thought to a process-focused one:",
              swipeCards: [
                { negative: '"We have to win this game."', neutral: '"Execute this play. Win this rep."', emoji: "🏆" },
                { negative: '"I need to score to help my team."', neutral: '"Stay in position. Read the play. React."', emoji: "⚽" },
                { negative: '"If we lose, the season is over."', neutral: '"The next possession is the only one that matters right now."', emoji: "⏱️" },
                { negative: '"I need a big game for the scouts."', neutral: '"Play my game, one rep at a time. Let the clips speak."', emoji: "👀" }
              ]
            }
          },
          {
            type: "quiz",
            label: "Quiz",
            emoji: "🧪",
            content: {
              questions: [
                {
                  q: "Why can focusing on the score hurt performance?",
                  options: ["It motivates too much", "The score is an outcome outside your direct control ✓", "Coaches discourage it", "It creates positive pressure"],
                  correct: 1,
                  explanation: "You don't directly control the score — you control your actions. When you focus on the scoreboard, you lose focus on what you can actually influence."
                },
                {
                  q: "What is 'Process Focus'?",
                  options: ["Focusing on statistics", "Concentrating on executing each action correctly in the moment ✓", "Watching your opponent's strategy", "Reviewing game film during the game"],
                  correct: 1,
                  explanation: "Process focus means your full attention is on the next action — footwork, positioning, release — not the result."
                },
                {
                  q: "According to Moad, what happens when teams focus on process instead of score?",
                  options: ["They lose track of the game", "They make more mistakes", "Their execution improves and results follow ✓", "It has no measurable impact"],
                  correct: 2,
                  explanation: "Process focus leads to better execution. Better execution leads to better results. The scoreboard follows the work."
                }
              ]
            }
          },
          {
            type: "tiein",
            label: "Game Prep",
            emoji: "🏆",
            content: {
              title: "Your Process Cue",
              body: `Create a <strong>process focus cue</strong> — a short phrase you say to yourself when you notice you're scoreboard-watching.\n\nExamples:\n• "Next play."\n• "Win this rep."\n• "Ball. Position. React."\n\nEvery time you catch yourself thinking about the score, say your cue out loud and lock back in.`,
              action: "journal",
              journalPrompt: "Write your process focus cue — the phrase you'll use when you catch yourself scoreboard-watching:"
            }
          }
        ]
      },
      {
        id: "3.3",
        title: "The 90-Second Rule",
        duration: 6,
        xp: 70,
        sections: [
          {
            type: "hook",
            label: "Hook",
            emoji: "⚡",
            content: {
              title: "Your brain gives you 90 seconds.",
              body: `Neuroscientist Dr. Jill Bolte Taylor discovered something remarkable:\n\nWhen a stressful thing happens, your brain fires an emotional response. Stress hormones flood your system.\n\n<strong>That surge lasts exactly 90 seconds.</strong>\n\nAfter 90 seconds, the chemicals clear — <strong>unless you keep the thought alive</strong>.\n\nEvery time you replay the mistake, complain about the call, or relive the bad moment — you restart the 90-second clock.\n\nElite athletes know this. Moad teaches it to every team he works with. <strong>Let the 90 seconds pass. Then move.</strong>`,
              question: "Think about your last tough game. How long did you stay upset after a mistake — 30 seconds? 5 minutes? The whole game?"
            }
          },
          {
            type: "instruction",
            label: "Lesson",
            emoji: "📖",
            content: {
              title: "The 90-Second Reset Protocol",
              body: `Here's the science-backed process Moad adapts for athletes:\n\n<strong>0–90 seconds:</strong> Feel it. Don't suppress the emotion. Breathe. Let the stress chemicals clear.\n\n<strong>At 90 seconds:</strong> Ask yourself ONE question: <strong>"What's the next controllable?"</strong>\n\n<strong>After 90 seconds:</strong> All mental energy shifts forward. The past moment is done.\n\nThis isn't ignoring your feelings. It's <strong>respecting the biology and then choosing to move forward</strong>.\n\nThe athletes who master this technique average significantly fewer mental errors in the second half of games.`,
              highlight: "The 90-Second Rule: feel it for 90 seconds, then choose your next move. (Adapted from Dr. Jill Bolte Taylor's research and Trevor Moad's coaching.)"
            }
          },
          {
            type: "activity",
            label: "Activity",
            emoji: "✏️",
            content: {
              title: "Your 90-Second Scorecard",
              description: "Rate how quickly you typically recover from these situations (0 = stuck all game, 5 = back in 90 seconds):",
              sliders: [
                { id: "r1", label: "After a major mistake in a game", emoji: "😤" },
                { id: "r2", label: "After a referee makes a bad call", emoji: "🏁" },
                { id: "r3", label: "After a teammate makes an error", emoji: "🤝" },
                { id: "r4", label: "After a coach criticism in front of the team", emoji: "📢" }
              ]
            }
          },
          {
            type: "quiz",
            label: "Quiz",
            emoji: "🧪",
            content: {
              questions: [
                {
                  q: "According to Dr. Taylor's research, how long does a stress response naturally last?",
                  options: ["30 seconds", "5 minutes", "90 seconds ✓", "10 minutes"],
                  correct: 2,
                  explanation: "The chemical stress response lasts 90 seconds. After that, you choose whether to keep it going by replaying the moment."
                },
                {
                  q: "What extends the stress response beyond 90 seconds?",
                  options: ["Physical exertion", "Replaying and reliving the stressful moment ✓", "Competing under pressure", "Talking to a coach"],
                  correct: 1,
                  explanation: "Every time you re-think the mistake or unfair call, you restart the stress chemical cycle."
                },
                {
                  q: "After the 90 seconds clear, Moad's athletes ask themselves:",
                  options: ['"What went wrong?"', '"What\'s the score?"', '"What\'s the next controllable?" ✓', '"Why did this happen to me?"'],
                  correct: 2,
                  explanation: "Forward-focused questions shift your mental energy immediately. 'What's the next controllable?' pulls your brain into action mode."
                }
              ]
            }
          },
          {
            type: "tiein",
            label: "Game Prep",
            emoji: "🏆",
            content: {
              title: "Module 3 Complete! 🎉",
              body: `You've built a complete control framework:\n\n✅ <strong>Circle of Control</strong> — Energy goes where you have power\n✅ <strong>Process Over Scoreboard</strong> — Win each rep, the result follows\n✅ <strong>The 90-Second Rule</strong> — Feel it, then choose to move forward\n\nTest this in your next game. After every mistake, give yourself <strong>exactly 90 seconds</strong> — then ask "What's my next controllable?"\n\n<strong>Module 4 unlocks:</strong> "Power of Language" — the words you use shape your reality.`,
              action: "complete_module"
            }
          }
        ]
      }
    ]
  },
  {
    id: 4,
    title: "Power of Language",
    emoji: "🗣️",
    color: "#8B93A3",
    description: "The words you use shape your reality — clean up your self-talk.",
    locked: true,
    lessons: [
      { id: "4.1", title: "Clean Language", duration: 5, xp: 65, locked: true },
      { id: "4.2", title: "Your Victory Chant", duration: 5, xp: 65, locked: true },
      { id: "4.3", title: "Team Talk Matters", duration: 5, xp: 70, locked: true }
    ]
  },
  {
    id: 5,
    title: "Consistency Beats Motivation",
    emoji: "🔥",
    color: "#8B93A3",
    description: "Daily habits beat occasional inspiration every time.",
    locked: true,
    lessons: [
      { id: "5.1", title: "Why Motivation Fades", duration: 5, xp: 65, locked: true },
      { id: "5.2", title: "Build Your Routine", duration: 5, xp: 65, locked: true },
      { id: "5.3", title: "Mind Reps Daily", duration: 5, xp: 70, locked: true }
    ]
  },
  {
    id: 6,
    title: "Game-Day Application",
    emoji: "🏟️",
    color: "#8B93A3",
    description: "Apply everything in real competition — handle pressure like a pro.",
    locked: true,
    lessons: [
      { id: "6.1", title: "Pre-Game Routine", duration: 5, xp: 65, locked: true },
      { id: "6.2", title: "In-Game Recovery", duration: 5, xp: 65, locked: true },
      { id: "6.3", title: "Post-Game Mindset", duration: 5, xp: 70, locked: true }
    ]
  },
  {
    id: 7,
    title: "Your Mental Playbook",
    emoji: "📋",
    color: "#8B93A3",
    description: "Consolidate everything into your personalized mental performance system.",
    locked: true,
    lessons: [
      { id: "7.1", title: "Your Playbook Blueprint", duration: 5, xp: 80, locked: true },
      { id: "7.2", title: "30-Day Review", duration: 5, xp: 80, locked: true },
      { id: "7.3", title: "Mental Captain 🏆", duration: 5, xp: 100, locked: true }
    ]
  }
];

export const BADGES = [
  { id: "first_lesson", icon: "🌟", name: "First Step", desc: "Completed your first lesson", unlocked: false },
  { id: "module_1", icon: "🧠", name: "Mind Awakened", desc: "Finished Module 1", unlocked: false },
  { id: "streak_3", icon: "🔥", name: "On Fire", desc: "3-day streak", unlocked: false },
  { id: "streak_7", icon: "⚡", name: "Weekly Warrior", desc: "7-day streak", unlocked: false },
  { id: "neutral_thinker", icon: "😐", name: "Neutral Thinker", desc: "Completed Neutral Thinking lesson", unlocked: false },
  { id: "reset_master", icon: "🔄", name: "Reset Master", desc: "Built your reset routine", unlocked: false },
  { id: "journal_1", icon: "📝", name: "First Reflection", desc: "Logged your first game", unlocked: false },
  { id: "quiz_perfect", icon: "🎯", name: "Perfect Mind", desc: "Got 100% on a quiz", unlocked: false },
  { id: "breathwork", icon: "💨", name: "Breath Control", desc: "Completed a breathing session", unlocked: false },
  { id: "no_excuses", icon: "💪", name: "No Excuses", desc: "Finished Module 2", unlocked: false },
  { id: "captain", icon: "👑", name: "Mental Captain", desc: "Completed all 7 modules", unlocked: false },
  { id: "xp_500", icon: "💎", name: "Diamond Mind", desc: "Earned 500 XP", unlocked: false },
  // Locked In mode — long-haul badges for life after Foundations
  { id: "streak_30", icon: "🌋", name: "Locked In", desc: "30-day streak", unlocked: false },
  { id: "reps_10", icon: "🔟", name: "Rep Regular", desc: "Completed 10 Daily Reps", unlocked: false },
  { id: "reps_30", icon: "🥇", name: "Rep Master", desc: "Completed 30 Daily Reps", unlocked: false },
  { id: "checkin_1", icon: "🗓️", name: "Weekly Habit", desc: "Completed your first Weekly Check-In", unlocked: false }
];

export const SPORTS = [
  { id: "soccer", name: "Soccer", emoji: "⚽" },
  { id: "basketball", name: "Basketball", emoji: "🏀" },
  { id: "football", name: "Football", emoji: "🏈" },
  { id: "baseball", name: "Baseball", emoji: "⚾" },
  { id: "volleyball", name: "Volleyball", emoji: "🏐" },
  { id: "swimming", name: "Swimming", emoji: "🏊" },
  { id: "track", name: "Track", emoji: "🏃" },
  { id: "tennis", name: "Tennis", emoji: "🎾" },
  { id: "wrestling", name: "Wrestling", emoji: "🤼" },
  { id: "gymnastics", name: "Gymnastics", emoji: "🤸" },
  { id: "lacrosse", name: "Lacrosse", emoji: "🥍" },
  { id: "other", name: "Other", emoji: "🏅" }
];

export const AGE_GROUPS = [
  { id: "10-12", label: "10–12", sublabel: "Middle School", emoji: "🌱" },
  { id: "13-15", label: "13–15", sublabel: "High School Jr", emoji: "⚡" },
  { id: "16-18", label: "16–18", sublabel: "High School Sr", emoji: "🔥" }
];

export const COACH_RESPONSES = {
  nervous:    "Feeling nervous is normal — it means you care. Try this: take 3 slow box breaths (4 counts in, 4 hold, 4 out, 4 hold). Your nervous system will calm within 60 seconds. You've prepared for this. 💪",
  mistake:    "One mistake doesn't define your game. Remember the 3R Reset: Recognize the mistake, Release it with a physical cue, and Refocus on the next play. The past is not predictive. What's your next move?",
  pressure:   "Pressure is a privilege — it means you're in a situation that matters. Narrow your focus to just THIS play, THIS moment. Breathe. What's one thing you can control right now?",
  confidence: "Confidence comes from preparation, not inspiration. Think back: you've put in the work. Your training has prepared you for exactly this moment. Trust the process you've built.",
  reset:      "Here's your 3R Reset: (1) Recognize — notice what happened, take one breath. (2) Release — shake your hands, tap your chest, or say 'next play' out loud. (3) Refocus — lock your eyes on where you need to be. That's it. 3 seconds to a fresh start.",
  pregame:    "Night before a big game: (1) Lay out everything you need so your morning is calm. (2) Spend 3 minutes visualizing one clean play — not the whole game, just one good moment. (3) Review your neutral reset phrase. (4) Get 8 hours of sleep. That's it. Don't overthink it. 🎯",
  default:    "I'm Coach Neutral — I use Trevor Moad's neutral thinking framework to help you perform better. Ask me about nerves, pressure, mistakes, confidence, or any mental challenge you're facing. What's on your mind? 🧠"
};

