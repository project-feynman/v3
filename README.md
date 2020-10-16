# Feynman
Updated plan: https://docs.google.com/document/d/15d4Ne4K5kRBuu-1EAcrBSDLQqzLtuVP3zg6iujNnEdE/edit#
Our mission is to make MIT a vibrant place where everyone helps each other, so nobody has to stay up late studying alone. In doing so, we will accelerate the world's transition into open education. 

High-level plan: 
1. Build a website with blackboards for people to explain things to each other
2. Use the explanations made from the blackboards to build a visual library
3. Use the visual library to draw more users to the platform, causing even more explanations to be made. 

Low-level plan: 
1. Build a website with open spaces, each equipped with real-time blackboards
2. Give it to 8.01, 18.01 and ESG (TEAL and ESG format where students solve problems in small groups) 
3. Build a messenger that automatically connects all the students and staff together
4. Replace all pset activities and Office Hours for 8.01, 18.01 and ESG
5. Develop the visual library and visual Q&A. 
6. Messenger --> People bump into each other often --> Use open spaces more --> More explanations are made --> Library is visited more --> People bump into each other more...
7. Meanwhile, expand in parallel to other classes
8. In the end, we become the single, de facto platform that replaces Zoom, Messenger/Slack, Piazza, and Canvas.

## Inspirations
The project was inspired by many things. [The Number Devil](https://booksjar.com/pdf-epub-the-number-devil-a-mathematical-adventure-download/), [Surely You're Joking Mr Feynman](https://b-ok.global/book/1673299/ae9bd9?regionChanged=&redirect=20279758), Dr Hiluluk from One Piece, Discord, ExplainEverything, Piazza and Maplestory. 

Everything starts with a question. "What is the intuition behind P = NP?". The Number Devil responds, and invites you to a classroom. The devil draws on the whiteboard, and soon the doodles come to life.

The devil focuses on the thought process: "Notice that the complexity class of the oracle machine is ... that's exactly the same as ..." "Why do the sets intersect there?" "Ah, I'm glad that you asked that, it's because..." ... ... ... "There's a very interesting quote about the concept if you want to hear:

"If P = NP, then the world would be a profoundly different place...There would be no special value in "creative leaps,"...Everyone who could appreciate a symphony would be Mozart; everyone who could follow a step-by-step argument would be Gauss..."

 "Ah, everything makes sense now!"

That magical Eureka moment, the inexplicable journey from chaos to clarity that you just undertook - how wonderful.

"Thank you for that - my friends and I really struggled with the last few lectures..." "Happy to help. If your friends still have problems with this, just try explaining to them the same thing. Remember what Richard Feynman said - if you can't explain it simply, you don't understand it." "Yes." "And, one more thing, in case you forget what I said..."

The devil presses a button, and right before their eyes, the messy scribbles on the whiteboard clear up. Then strokes start reappearing and rearranging themselves. Venn diagrams, Directed Acylic Graphs and equations, everything that the devil talked about and scribbled came back to life - like a vivid dance of words and numbers, moving in harmony to convey meaning in the most elegant of ways. It was as if they relived the journey towards clarity once more.

"Good luck for your midterm. Remember, always spread the joy of learning to the people around you!"

And just like that, the devil disappears. 

## Engineering Hall of Fame

<p float="left">
 
### Prabhakar Kafle (UI/UX)
 
<img src="documentation/Prabhakar.jpg" alt="member photo" height="170"/> 
 
 <b>Contributions:</b>
 - When Prabhakar first joined, he redesigned the home page logo, the blackboard toolbar and the sidedrawer UI 
 - Prabhakar's favorite color is orange, and that has since been Explain's main highlight color. 
 - Back then, we noticed the importance of being able to upload an image or PDF to the background and annotate on top of it. Prabhakar had the idea to use 2 HTML canvas, a front canvas for displaying strokes and a back canvas for rendering the PDF, which keeps the code modular and easy to reason about.
 - As Explain was started to be used for, the posts were disorganized and chaotic and unmanagable. "Untitled 1", "Untitled 2", "Untitled n". He implemented the ability to organize posts in folders and by date, which led to better organized content for 8.02 and for our internal knowledge base. 

### Winston Fee (Audio/Visual)
 
<img src="documentation/Winston.jpg" alt="member photo" height="170"/> 

<b>Contributions:</b>
  - Winston introduced audio chat, video chat, screenshare, rich-text editor, and others. 
  - Back then, videos would be fetched in its entirety. Every time we load 10 videos, that's about 1000 document reads. Winston instead take an image snapshot 
    of the blackboard when its uploaded, and so we can use that image as the preview for the video without fetching the audio and the pen strokes. 
  - Winston started a lot of the infrastructure work for video and audio communications in the collaborative rooms, as well as the participants updating logic
</p>

### Tony Wang (Helper)
  - Tony helped stabilized features during an extremely stressful time - 1 week before Fall 2020. I never had to test the code he wrote - they simply worked, which made it so much easier for me to sleep. Features Tony fixed included voice chat, shuffle, announcement, mute all, etc.

### Early contributors
  - Jing Lin
  - Hubert Wasilewski
  - Lujing Cen 
  - John Lin
  - Hong Qian Tan
  
## Instructors and TAs: 

### Dr Peter Dourmashkin
Without Dr Dourmashkin, the Feynman project would never see the light of day. Back then, I told him that he should use Zoom because Explain is not great for real-time communications. Instead, he decided to screenshare his iPad and use Explain's blackboard. After 6 weeks, there were hundreds of visual animations in 8.01. 

Since then, Dr Dourmashkin introduced other faculty members to explain.mit.edu, convinced Prof. Krishna to provide iPads to all students for Fall 2020, and persuaded his colleagues in 8.01 to collectively trust in using an experimental prototype for Fall 2020. 

Special thanks to: 
  - Prof. Paola Rebusco
  - Prof. Jason Ku
  - Prof. Krishna Rajagopal 
  - Prof. Peter Fischer
  - Prof. Gilbert Strang
  - Prof. Bill Aulet
  - Stephanie Yuen
  - Kristen Surrao
  - Deborah Wen 
  - Anuj Apte

## Other helpers: 
### The Net Ninja
Almost everything I learnt about Vue was from his Udemy course "Fullstack Development with Vue Firestore"

Special thanks to: 
  - Evan You for inventing Vue.js
  - Google for launching Firestore
  - MIT Sandbox for funding a scrappy project even when there was no clear evidence it would work

## Technology
Our frontend is Vue.js, Firebase for almost everything else, and Twilio-Video for real-time communications. 

Technical milestones: 
  - Feynman videos are 10-120x lighter than normal videos. 
 
See [CONTRIBUTING.md](documentation/CONTRIBUTING.md) for more details. 
