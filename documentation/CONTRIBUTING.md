# CONTRIBUTING.md

## Get Started
The App uses secret API keys, which we cannot share for open source contributors. 
To prevent your compiler from throwing errors, create 2 new files:
  src/algoliaCreds.js
  src/twilioCreds.js
  
export const algoliaCreds = { 
  APP_SID: "THIS-IS-A-DUMMY-STRING-TO-PREVENT-ERROR",
  ADMIN_API_KEY: "THIS-IS-A-DUMMY-STRING-TO-PREVENT-ERROR"
};
  
export const twilioCreds = {
  ACCOUNT_SID: "THIS-IS-A-DUMMY-STRING-TO-PREVENT-ERROR",
  API_KEY_SID: "THIS-IS-A-DUMMY-STRING-TO-PREVENT-ERROR",
  API_KEY_SECRET: "THIS-IS-A-DUMMY-STRING-TO-PREVENT-ERROR",
};

## Finding tasks
- **Documentation:**  [ExplainMIT](https://explain.mit.edu/vzAnPh3xFS1xCjt1aQo3/questions/)
- **Task coordination:** [Github Projects](https://github.com/feynman-project/explain-mit/projects) 

**Hall of Fame** 
- Tony Wang: built the first DoodleVideo by syncing blackboard strokes to audio. 
- Lujing Cen: optimized the DoodleVideo sliding algorithm to sync blackboard points to audio. 

**Contributors (>1 accepted Pull Request)**
- Hubert Wasilewski: My first ever collaborator on Feynman. Him and I worked backend/frontend during 2018 June-September. 
- Yang Yang: worked on email notifications
- Kirill Zabrodin: setup DevOps and well-formated documentation
- John Lin: built the message chats for Feynman v2
- Kyle Xiao: worked on Q&A
- Rob Sullivan: made the text editor more powerful with code syntax highlighting, images, undo/redo, etc.
