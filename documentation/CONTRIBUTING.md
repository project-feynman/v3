## Tips to understand the codebase
1. Refer to the ExplainMIT videos (TODO: add links)
2. Always read the View components first, then read children components recursively as needed. 
3. All database logic reside in View components i.e. those that reside in src/views/... Other components are stateful but will always emit an event to the parent if a CRUD (Create Read Update Delete) operation has to be performed. 

## How to contribute
1. Choose a task on [Trello](https://trello.com/b/2VdWvqBJ/explainmit) such as "Fix bug X" 
2. Create a new branch called X 
3. Use the [documentation](/documentation) folder on this repository and collaborate with us on [Discord](https://discord.gg/dypDkaq) and [ExplainMIT](https://explain.mit.edu/ExplainMIT%20Team/questions)
3. When you finish coding, create a Pull Request and await a code review
4. Voila!

## Testing
Because the specs constantly change, we use manual checklist testing (like the checks done before an airplane flies).

**Q&A**
1. Create a question with text, image and video 
2. Check that you receive an email notification about the new question if you're enrolled in class 
3. View the new question and drag the slider on the audio
4.  Create an answer with text, image and video 
5. Check the question asker receives a notification

**Real-time blackboard**
1. Create some drawings, then save it as a silent animation
2. Check in VideoGallery that it works 
3. Create some drawings (as initial drawing setup), then press record, then make more drawings, then check the video
4. Check in VideoGallery and drag the slider on the audio to see if it works

**Video Gallery** 
1. Switch between the tabs, noting that different sets of videos will be fetched
2. Edit the title, description and tab of a particular video 
3. Check if they update correctly

# Miscellaneous

## Coding style
- Don't use a linter because it causes lots of noisy changes for code review (e.g. indentation and semicolons) 
- Don't use semicolons because it doesn't improve readability (think Python) and its absence doesn't cause bugs for our stack

**Hall of Fame**
- Hubert Wasilewski was the backend engineer back in the early days 
- Tony Wang built the slider for traversing any video freely 
- Yang Yang worked on email notifications
- John Lin built a live group chat, voice chat and copy-image-to-chat feature
- Kirill Zabrodin improved the README, set up deployment tests and added the copy-to-clipboard feature for sharing video links
- Kyle Xiao worked extensively the Q&A feature

## Recommended setup
1. **Node and NPM**: Version 10.10.0 (we require 10.10+, version 11+ has known bugs) 
2. **Code edtior**: Microsoft Visual Studio Code 
3. **Code editor extensions**: Vetur (syntax highlighting for Vue files), PDF viewer (enables PDF to be directly previewed) 
3. **URL navigator** [Short (made by Harry Liu!)](https://chrome.google.com/webstore/detail/short/hoobjcdfefnngjeepgjkiojpcicciihc)
