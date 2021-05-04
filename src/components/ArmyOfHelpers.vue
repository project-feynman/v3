<template>
  <div>
    <h1>Army of Helpers</h1>

    <p style="margin-top: 10px; margin-bottom: 0"><b>How it works</b></p>
    <ol style="font-size: 1.5rem;">
      <li>If you want timely help but it's 11 pm with no Office Hours, press the help button</li>
      <li>Your peers who signed up as helpers (currently 15 people) will be notified, and if nobody shows up within 30 seconds, it means nobody was available</li>
      <li>Use the room chat, collaborative blackboard and audio-video to explain things</li>
      <li>Any explanation can be recorded and shared to the open library to benefit your classmates</li>
    </ol>
    <br>
  
    <p>
      University is hard because it's a brutal game of efficiency. 
    
      If you have a question, press "HELP". Your peers who have signed up to be helpers will be notified,
      and ideally someone will join your Explain workspace within 30 seconds. 

      Sometimes, nobody is available, but give it a shot (and you can also defer the question to the visual forum).

      When the helper comes, he/she can record the explanation. If it's an explanation done many times, then it can probably be one-sided and wtih voice. 
      If it's a new explanation, you can save it just as a silent animation so the back-and-forth verbal exchanges don't get saved. 

      Counterintuitively, when you ask for help, you can actually have potential to help many other classmates, because your question led to 
      an explanation that ends up helping many people. To capture this concept, everyone has "assisted views" - that is, the number of views on explanation videos
      that were made by someone who was originally trying to answer just your question. 

      Recording explanation is the key to efficiency. Time is very scarce in school, and the pace is relentless. Everyone has very finite resources. When you record 
      key explanations, you scale it indefinitely, and there is only a finite number of concepts, etc. To capture this concept and encourage people to record their explanations 
      (it's unlike YouTube - it's all about informal yet helpful explanations rather than polished videos), everyone has "views" and "upvotes"
    </p>
    <br>
    

    <h2>Your statistics</h2>
    <div style="display: flex; justify-content: space-around; margin-top: 20px;">
      <div style="display: flex;">
        <p style="margin-bottom: 0; margin-right: 10px;">Videos shared</p>
        <h1>2</h1>
      </div>

      <div style="display: flex;">
        <p style="margin-bottom: 0; margin-right: 10px;">Animations shared</p>
        <h1>5</h1>
      </div>

      <div style="display: flex;">
      <p style="margin-bottom: 0; margin-right: 10px;">Assisted upvotes</p>
      <h1>360</h1>
      </div>

      <div style="display: flex;">
        <p style="margin-bottom: 0; margin-right: 10px;">Upvotes</p>
        <h1>60</h1>
      </div>

    </div>

    <div style="display: flex; justify-content: center; margin-top: 20px;">
      <v-btn block large dark color="purple">
        Help! (8 people will be notified)
      </v-btn>
    </div>
    <div style="display: flex; justify-content: center; margin-top: 5px;">
      <v-btn block large dark color="purple">
        <!-- Help! -->
        Sign up as a helper
        <!-- <v-icon>mdi-chat</v-icon> -->
      </v-btn>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";

export default {
  data () {
    return {};
  },
  computed: {
    ...mapState([
      "mitClass",
      "user"
    ])
  },
  created () {

  }
};
</script>