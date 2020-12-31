<template>
  <v-main>
    <v-card v-if="!isFetchingUser" fluid class="mx-auto" elevation="0" tile>
      <v-container class="py-5">
        <div class="central-title d-flex justify-center align-center my-4">
          <img src="/logo.png" class="mt-5">
          <div>
            <h1 class="text--primary ml-5">
              explain.mit.edu
            </h1>
            <h3 class="headline font-weight-normal ml-5" style="opacity: 70%">
              A warm, electrifying place where everybody helps each other
            </h3>
          </div>
        </div>
        
        <!-- Log in / Sign up -->
        <v-row class="my-5 pt-2" justify="center">
          <template v-if="user">
            <!-- Do NOT split the URL to multiple lines, it will be interpreted as %20%20%20...etc -->
            <v-btn @click="$router.push(`class/${user.mostRecentClassID || 'lvzQqyZIV1wjwYnRV9hn'}/section/${user.mostRecentClassID || 'lvzQqyZIV1wjwYnRV9hn'}`)" 
              large class="mr-5 green darken-1 white--text"
            >
              <v-icon class="mr-2">mdi-emoticon-wink-outline</v-icon>
              GO TO CLASS
            </v-btn>

            <v-btn large class="grey darken-1 white--text mx-5">
              <v-icon class="mr-2">mdi-gitlab</v-icon>
              <a target="_blank" href="https://github.com/project-feynman/explain-mit" class="white--text">GITHUB</a>
            </v-btn>

            <v-btn large @click="$_signOut()" class="mx-5 grey darken-1 white--text">
              <v-icon class="mr-2">mdi-logout</v-icon>
              SIGN OUT
            </v-btn>          
          </template>
        
          <template v-else>
            <v-btn @click="$_logInWithTouchstone()" large class="green darken-1 white--text mx-5">
              <v-icon class="mr-2">mdi-school</v-icon>
              LOG IN WITH TOUCHSTONE
            </v-btn>

            <v-btn large class="grey darken-1 white--text mx-5">
              <v-icon class="mr-2">mdi-gitlab</v-icon>
              <a target="_blank" href="https://github.com/project-feynman/explain-mit" class="white--text">GITHUB</a>
            </v-btn>

            <!-- Email Sign Up -->
            <BasePopupButton actionName="Sign up with email" 
              :inputFields="['first name', 'last name', 'email', 'password']" 
              @action-do="user => $_signUp(user)"
            >
              <template v-slot:activator-button="{ on }">
                <v-btn v-on="on" large class="ml-5 mr-2 grey darken-1 white--text">
                  <v-icon class="mr-2">mdi-email</v-icon>
                  EMAIL SIGNUP
                </v-btn>
              </template>

              <template v-slot:message-to-user>
                Email sign-up is a back-up option if you have trouble with MIT Touchstone. 
                To prevent unexpected behavior, use a <u>non-MIT</u> email address to sign up. 
              </template>
            </BasePopupButton>

            <!-- Email Log In -->
            <BasePopupButton actionName="Log in with email" 
              :inputFields="['email', 'password']" 
              @action-do="user => $_logIn(user)"
            >
              <template v-slot:activator-button="{ on }">
                <v-btn v-on="on" large class="grey darken-1 white--text">
                  <v-icon class="mr-2">mdi-email</v-icon>
                  EMAIL LOGIN
                </v-btn>
              </template>
            </BasePopupButton>
          </template>
        </v-row>
      </v-container>
    </v-card>
    
    <!-- TODO: <HomeNextUpdateCountdownTimer/> -->
      <v-card elevation="5">
        <!-- color="accent" makes the slider indicator orange -->
        <v-tabs vertical touchless color="accent" class="ml-1">
          <!-- active-class="accent--text" makes the current tab's title go orange -->
          <v-tab>Overview</v-tab>
          <v-tab>Problem</v-tab>
          <v-tab>Solution</v-tab>

          <!-- Overview -->
          <v-tab-item>
            <v-row no-gutters>
              <v-col md="7">
                <v-card>
                  <v-card-title>Overview</v-card-title>
                  <v-card-subtitle>
                    <b class="subtitle-1 font-weight-medium">
                      <!-- explain.mit.edu is designed like a lounge area with blackboards for students and instructors explain things.  -->
                    
                      <!-- My goal is to: 
                        1. Recruit instructors to use the Visual Forum and Lounge Area for Spring 2021
                        2. Recruit co-founder(s) by end of 2021 
                        2. License explain.mit.edu schoolwide to achieve financial sustainability -->

                      <!-- The forum the more people pass by each other
                        - Pset collaboration: every class has one centralized lounge area for students
                        - Forum discussions: instead of text, the forum is re-designed for blackboard explanations
                        - Synchronous problem-solving: students can split into groups and staff can move freely -->
                    </b>
                  </v-card-subtitle>
                  <v-card-text class="grey--text text--darken-3">
                    <b>Goal:</b> Enable radical open collaboration within MIT, then transition the world towards open education<br>
                    <b>Product:</b> A web app that lets you collaborate on blackboards and share video explanations efficiently<br>
                    <b>Users:</b> 800 students/instructors from 8.01, 18.01 and ESG in Fall 2020<br>
                    <b>Use-cases:</b> Forum Q&A, pset collaboration, synchronous problem-solving<br>
                    <b>Disadvantages:</b> Experimental, needs more testing<br>
                    <b>Advantages:</b> MIT-centric design, 10-100x lighter videos<br>
                    <b>Developer:</b> Elton Lin (6-14, 2020, eltonlin@mit.edu)<br>
                  </v-card-text>
                </v-card>
              </v-col>

              <v-col md="5">
                <v-card class="mx-auto"
                >
                  <v-card-text>
                    <v-timeline dense>
                      <v-timeline-item color="teal lighten-3" small>
                        <v-row class="mt-5">
                          <v-col cols="4">
                            <strong>Spring 2020</strong>
                          </v-col>
                          <v-col>
                            <strong>8.02 Pilot</strong>
                            <div class="caption">
                              Dr Peter Dourmashkin
                            </div>
                          </v-col>
                        </v-row>
                      </v-timeline-item>

                      <v-timeline-item color="orange" small>
                        <v-row class="pt-5 mt-5">
                          <v-col cols="4">
                            <strong>Summer 2020</strong>
                          </v-col>
                          <v-col>
                            <strong>
                              Receives official support
                            </strong>
                            <div class="caption">
                              Winston Fee, Prabhakar Kafle, Tony Wang, Krishna Rajagopal, Mark Silis
                            </div>
                          </v-col>
                        </v-row>
                      </v-timeline-item>

                      <v-timeline-item color="purple" small>
                        <v-row class="pt-5">
                          <v-col cols="4">
                            <strong>Fall 2020</strong>
                          </v-col>
                          <v-col>
                            <strong>8.01, 18.01, ESG pilot</strong>
                            <div class="caption">
                              800 weekly active users
                            </div>
                          </v-col>
                        </v-row>
                      </v-timeline-item>

                      <v-timeline-item color="cyan" small>
                        <v-row class="pt-1">
                          <v-col cols="4">
                            <strong>Spring 2021</strong>
                          </v-col>
                          <v-col>
                            <strong>Expand schoolwide</strong>
                            <div class="caption">
                              
                            </div>
                          </v-col>
                        </v-row>
                      </v-timeline-item>
                    </v-timeline>
                  </v-card-text>
                </v-card>
              </v-col>

              <!-- TIMELINE HERE -->
              <!-- VISION FOR THE PLATFORM -->
              <!-- <v-col md="6">
                <ExplanationDisplay v-if="demoVideo2" 
                  :expl="demoVideo2" 
                  :hasDate="false"
                />
              </v-col> -->
            </v-row>
          </v-tab-item>



          <!-- Problem -->
          <v-tab-item>
            <v-row no-gutters>
              <v-col md="5">
                <v-card>
                  <v-card-title>Problem</v-card-title>
                  <v-card-text class="grey--text text--darken-3">
                    <div class="subtitle-1 font-weight-medium">
                      If you don't understand fundamental concepts, it's hard to recover
                    </div>
                    <ul>
                      <li>
                        Office Hours can have long queues, so the TA can't explain concepts thoroughly just to you
                      </li>
                      <li>
                        Forums are not useful if you don't understand the fundamentals
                      </li>
                      <li>
                        Friends have limited time and capability to re-teach concepts to you
                      </li>
                    </ul>

                    <br>

                    <div class="subtitle-1 font-weight-medium">
                      It's hard to have pset friends
                    </div>
        
                    <ul>
                      <li>
                        It's hard to coordinate schedules
                      </li>
                      <li>
                        It's hard to know pset friends in the first place
                      </li>
                    </ul>

                    <br>

                    <div class="subtitle-1 font-weight-medium">
                      If you face both problems, you enter a negative spiral of compounding inefficiencies
                    </div>
                    
                    <ul>
                      <li>Your happiness and physical health decreases</li>
                      <li>It becomes even harder to learn and make friends</li>
                    </ul>
                  </v-card-text>
                </v-card>
              </v-col>

              <v-col md="6">
                <v-img src="https://i.imgur.com/Z60ZcYK.jpg">
                </v-img>
              </v-col>
            </v-row>
          </v-tab-item>

          <v-tab-item>
            <v-row no-gutters>
              <v-col md="6">
                <v-card>
                  <v-card-title>Solution</v-card-title>
                  <!-- Detailed Walkthrough -->
                  <div class="mx-auto">
                    <iframe id="player" type="text/html"
                      src="https://www.youtube.com/embed/k-3VRsXXzCY"
                      frameborder="0"
                      allowfullscreen="true"
                      style="display: block; margin: auto;"
                    >
                    </iframe>
                  </div>

                  <v-card-text class="grey--text text--darken-3">
                    <div class="subtitle-1 font-weight-medium">A visual forum for students to review fundamental concepts</div>
                    <ol>
                      <li>Student asks question</li>
                      <li>Instructor answers by drawing and talking on a blackboard</li>
                      <li>Any student can view the resultant video explanation at any time</li>
                    </ol>

                    <br>

                    <div class="subtitle-1 font-weight-medium">
                      A lounge area for unplanned collaboration between any classmates
                    </div>
                    <ul>
                      <li>
                        The more students use the forum, the more likely they encounter each other in the lounge
                      </li>
                      <li>
                        Any students can collaborate with each other without having to coordinate
                      </li>
                      <div class="text--secondary">Tip: If voice chat isn't working, <u>close your browser tab</u> then come back.</div>
                    </ul>

                    <!-- <br> -->

                    <!-- <div class="subtitle-1 font-weight-medium">
                      Open Library
                    </div>
                    <ul>
                      <li>
                        Any great explanation made in the lounge is saved to the library
                      </li>
                      <li>
                        Explanations are organized and benefit everyone
                      </li>
                    </ul> -->
                    <br>
                  </v-card-text>
                </v-card>
                
              </v-col>

              <v-col md="6">
                <ExplanationDisplay v-if="highLevelIdeaOfExplain" :expl="highLevelIdeaOfExplain" :hasDate="false"/>
              </v-col>
            </v-row>

          </v-tab-item>

          
          <!-- <v-tab-item>
            <v-row no-gutters>
              <v-col md="6">
                <v-card>
                  <v-card-text>
                    <div class="subtitle-1 font-weight-medium">This website saves instructors' time / helps students collaborate</div>
                    <ol>
                      <li><b>Visual Forum:</b> It's time-consuming to answer questions over text. It's faster to draw and talk.</li>
                      <li><b>Lounge Area:</b> It's hard to coordinate schedules. It's easier to join classmates who are psetting already.</li>
                    </ol>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-tab-item> -->

          <!-- Problem I -->
          <v-tab-item>
            <v-row no-gutters>
              <v-col md="6">
                <v-card>
                  <v-card-text class="grey--text text--darken-3">
                    <div class="subtitle-1 font-weight-medium">MIT is hard:</div>
                    <ul>
                      <li>30% of students "often stayed up all night"</li>
                      <li>32% of students "often felt very sad"</li>
                      <li>18% of students "often felt so depressed it was difficult to function"</li>
                    </ul>

                    <br>

                    <div class="subtitle-1 font-weight-medium">
                      Existing solutions fail:
                    </div>
                    <ul>
                      <li>
                        <b>Office Hours:</b> The more students need it, the more overcrowded it gets.
                      </li>
                      <li>
                        <b>Forums:</b> The more concepts you don't understand, the less helpful it is.
                      </li>
                    </ul>

                    <br>
                    
                    <div class="subtitle-1 font-weight-medium">
                      Insights:
                    </div>
                    <ul>
                      <li>
                        <b>Explanations don't scale:</b> Staff members have limited impact and time 
                      </li>
                      <li>
                        <b>Short explanations are ineffective:</b> Students who are truly behind need hours of help
                      </li>
                    </ul>
                    <br>
                  </v-card-text>
                </v-card>
              </v-col>

              <v-col md="6">
                <v-img src="https://i.imgur.com/uyuipkK.jpg">
                </v-img>
              </v-col>
            </v-row>
          </v-tab-item>

          <!-- Problem -->
          <v-tab-item>
            <v-row no-gutters>
              <v-col md="6">
                <v-card>
                  <v-card-title>Problem</v-card-title>
                  <v-card-subtitle>
                    <b class="subtitle-1 font-weight-medium">
                      The problem is that it's hard for struggling students to break out of vicious cycles
                    </b>
                  </v-card-subtitle>
                  <v-card-text class="grey--text text--darken-3">
                    <div class="subtitle-1 font-weight-medium">Consequences of the problem (according to 2018 undergraduate survey):</div>
                    <ul>
                      <li>30% of students "often stayed up all night to finish an academic assignment or prepare for an exam"</li>
                      <li>32% of students "often felt very sad"</li>
                      <li>18% of students "often felt so depressed it was difficult to function"</li>
                    </ul>

                    <br>

                    <div class="subtitle-1 font-weight-medium">Existing solutions fail: the more behind you are, the less useful they become.</div>
                    <ul>
                      <li>Office Hours: 
                          The more dysfunctional your schedule is, the less likely you can successfully attend. 
                          The harder the class, the more overcrowded it is, and the less time with TA you get. 
                      </li>
                      <li>
                        Forums: 
                          The less you understand about the fundamental concepts, the less useful the text answers.
                          The more last-minute you are doing the pset, the less you can afford the delay in response time. 
                      </li>
                      <li>
                        Friends: 
                          The more sleep-deprived and dysfunctional you are because you fell behind, the harder it is to make friends. 
                      </li>
                    </ul>

                    <br>

                  <div class="subtitle-1 font-weight-medium">Key observations</div>
                    <ol>
                      <li>
                        The best way to break out of the vicious cycle is to receive a clear, thorough explanation that fills your knowledge gap,

                        
                        Clear, thorough explanations are what truly matters helping students break out of the vicious cycle
                        
                        but no existing solutions provide that reliably and efficiently.
                        Forum explanations are reusable but limited in value. Office Hour explanations have high value but are not reusable. 
                      </li>
                      <li>
                        Friendship and collaboration is a key part to happiness, but no existing solutions 
                        provide an easy way for classmates who don't already know each other to collaborate efficiently <u>without scheduling</u>. 
                      </li>
                    </ol>
                  </v-card-text>
                </v-card>
              </v-col>

              <v-col md="6">
                <v-img src="https://i.imgur.com/uyuipkK.jpg">
                </v-img>
              </v-col>
            </v-row>
          </v-tab-item>

          <!-- Visual Forum -->
          <v-tab-item>
            <v-row no-gutters>
              <v-col md="6">
                <v-card >
                  <v-card-title>Visual Forum</v-card-title>
                  <v-card-subtitle>
                    <b class="subtitle-1 font-weight-medium">
                      The visual forum enables people to share <u>blackboard explanations</u> efficiently.
                    </b>
                  </v-card-subtitle>

                  <v-card-text>
                    <div class="subtitle-1 font-weight-medium">How to use</div>
                    <ol>
                      <li>Read the question.</li>
                      <li>Record a video.</li>
                      <li>Press "SUBMIT".</li>
                      <li>Done. No file transfers, no compression, no upload times, no embeddings.</li>
                    </ol>
                  </v-card-text>
                </v-card>
              </v-col>

              <v-col md="6">
                <iframe id="player" type="text/html" width="640" height="390"
                  src="https://www.youtube.com/embed/863cDSgoVEw"
                  frameborder="0">
                </iframe>
              </v-col>
            </v-row>
          </v-tab-item>

          <!-- Lounge Area -->
          <v-tab-item>
            <v-row no-gutters>
              <v-col md="6">
                <v-card>
                  <v-card-title>Lounge Area</v-card-title>
                  <v-card-text style="font-size: 0.95rem;">
                    <p>
                      The lounge area unifies all the different, separate study locations 
                      into a centralized place, so even students who don't know each other can collaborate easily <u>without scheduling</u>. 
                    </p>

                    <div class="subtitle-1 font-weight-medium">Existing solutions fail:</div>
                    <ul>
                      <li>Lounges have a limited pool of people</li>
                      <li>No easy way to talk to classmates after class </li>
                      <li>Physical distance: have to walk to a different place</li>
                      <li>Hard to schedule: commpatible schedule / pset progress is rare</li>
                      <li>Reduces to friendship problem</li>
                    </ul>

                    <br>
                    
                    How to use if nobody is in the Lounge Area:
                    <ul>
                      <li>
                        Work in the common room by yourself or with friends - see if other people show up.
                      </li>
                      <li>
                        Hold Office Hours in the Common Area and allow people to work in surrounding rooms.
                      </li>
                      <li>
                        As more and more people join, it becomes easier to find study partners and have fun.
                      </li>
                      <li>
                        Alternatively, wait until the visual forum naturally brings a critical threshold of people to explain.mit.edu.
                      </li>
                    </ul>
                    <br>
                  </v-card-text>
                </v-card>
              </v-col>
                
              <v-col md="6">
                <ExplanationDisplay v-if="demoVideo" :expl="demoVideo" :hasDate="false"/>
              </v-col>
            </v-row>
          </v-tab-item>

          <v-tab-item>
            <!-- <v-card>
              <v-card-title>Insights</v-card-title>
              <v-card-subtitle>Why didn't anyone do this?</v-card-subtitle>
              <v-card-text>
                Because Explain sounds like something that already exists. Smart critics will mention a list of collaborative whiteboard apps [ExplainEverything, ConceptBoard, Microsoft Whiteboard],
                community apps [Gather, Comingle, Sococo]. 

                The reason it's easy to underestimate Explain is because it's a platform built fundamentally for blackboard videos.
                <ul>
                  <li>Text Editors already exists. But when laptops became widespread, StackOverflow grew exponentially.</li>
                  <li>Camera apps already exist. But when smartphones became widespread, Instagram grew exponentially. </li>
                  <li>Collaborative Whiteboards already exist. But when stylus-tablets became widespread, Feynman will grow exponentially. </li>
                </ul>
              </v-card-text>
            </v-card> -->
          </v-tab-item>


          <!-- <v-tab-item>
            <ExplanationDisplay v-if="demoVideo" :expl="demoVideo" :hasDate="false"/>
          </v-tab-item> -->
   
    
          <!-- TODO: <HomeNextUpdateCountdownTimer/> -->
          <!-- <v-tab-item>
            <v-card height="600">
              <v-card-title>News</v-card-title>
              <v-card-text style="font-size: 0.95rem;">
                <ul>
                  <li><b>Update</b>: The next major update is scheduled for December 1st</li>
                  <li><b>Internship</b>: If you want to change education together, email eltonlin@mit.edu</li>
                  <li><b>Users</b>: Explain currently serves ~800 weekly active users in 8.01, ESG classes and 18.01</li>
                  <li><b>Startup</b>: Explain has advanced to the interview round with Y-Combinator</li>
                  <li><b>IAP 2021</b>: I'm holding a web dev course called: "Lightweight Fullstack".
                    The goal is to teach fundamental concepts and modern frameworks with simple and visual explanations (more details coming soon).
                  </li>
                </ul>
              </v-card-text>
            </v-card>
          </v-tab-item> -->
        </v-tabs>
      </v-card>
  </v-main>
</template>

<script>
import { mapState } from "vuex";
import firebase from "firebase/app";
import "firebase/firestore";
import "firebase/auth";
import db from "@/database.js";
import TheAppBar from "@/components/TheAppBar.vue";
import TheDropdownMenu from "@/components/TheDropdownMenu.vue";
import TheSearchBar from "@/components/TheSearchBar.vue";
import RenderlessAsync from "@/components/RenderlessAsync.vue";
import BasePopupButton from "@/components/BasePopupButton.vue";
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js";
import AuthHelpers from "@/mixins/AuthHelpers.js";
import ExplanationDisplay from "@/components/ExplanationDisplay.vue";
import ExplanationCreate from "@/components/ExplanationCreate.vue";
import { demoVideo, demoVideo2, DefaultEmailSettings } from "@/CONSTANTS.js";
import HomeNextUpdateCountdownTimer from "@/components/HomeNextUpdateCountdownTimer.vue"; 
import HomeUserGrowthMoneyBurnGraph from "@/components/HomeUserGrowthMoneyBurnGraph.vue";

export default {
  name: "HomePage",
  components: {
    RenderlessAsync, 
    BasePopupButton,
    ExplanationDisplay,
    ExplanationCreate,
    TheAppBar,
    TheDropdownMenu,
    TheSearchBar,
    HomeNextUpdateCountdownTimer,
    HomeUserGrowthMoneyBurnGraph
  },
  mixins: [
    AuthHelpers,
    DatabaseHelpersMixin
  ],
  data () {
    return {
      model: "",
      
      schoolClasses: [],
      demoVideo: null,
      demoVideo2: null,
      highLevelIdeaOfExplain: null,

      welcomeMessage: "Welcome to ExplainMIT!",
      classSecurityPopup: false,
      classPassword: "",
      attemptToJoinClassId: "",
      attemptToJoinClassName: "",
      hasEnteredPassword: false
    };
  },
  computed: {
    ...mapState([
      "user", 
      "isFetchingUser"
    ]),
    userRef () { 
      return db.collection("users").doc(this.user.uid); 
    }
  },
  async created () { 
    // vision of a vibrant place where people talk around blackboards
    const demoVideoRef = db.doc(`classes/FVdgjuywaFgxvyylISt2/posts/aHaV1yIyaDR4n88pmzDk`);

    // const demoVideoRef3 = db.doc("classes/mDbUrvjy4pe8Q5s5wyoD/posts/I1viW7kVl5UFkfeYZVZy");
    const demoVideoRef4 = db.doc("classes/lvzQqyZIV1wjwYnRV9hn/posts/LOCgTA76qXcTaW6vgJAc");
    
    // visual comparison of normal videos vs doodle videos
    // const demoVideoRef2 = db.doc(`classes/mDbUrvjy4pe8Q5s5wyoD/posts/R0BgFgLe8BPvUfrfLmCq`);
    
    const visualForumWithinLoungeArea = db.doc(`classes/mDbUrvjy4pe8Q5s5wyoD/posts/V9BkHVZnJpYKN0RYLUbp`); 
    this.$_getDoc(visualForumWithinLoungeArea).then(video => this.highLevelIdeaOfExplain = video);

    // this.$_getDoc(demoVideoRef).then(demoVideo => this.demoVideo = demoVideo);
    // // note this is videoRef3!
    // this.$_getDoc(demoVideoRef4).then(demoVideo2 => this.demoVideo2 = demoVideo2);
  },
  methods: {
    handleClassPassword () {
      if (["explainphysics", "physics"].includes(this.classPassword.toLowerCase())) {
        this.hasEnteredPassword = true;
        this.enrollInClass({ 
          name: this.attemptToJoinClassName,
          id: this.attemptToJoinClassId
        });
        this.$root.$emit("show-snackbar", "Password is correct, joining...");
      } else {
        this.$root.$emit("show-snackbar", "Incorrect password.")
      }
      // reset everything
      this.attemptToJoinClassName = "";
      this.attemptToJoinClassId = "";
      this.hasEnteredPassword = false;
      this.classPassword = "";
      this.classSecurityPopup = false;
    },
    getMitClassRef (classId) { 
      return db.collection("classes").doc(classId); 
    },
    async fetchClasses () {
      const ref = db.collection("classes");
      this.schoolClasses = await this.$_getCollection(ref);
    },
    async enrollInClass ({ name, id }) {    
      // check if it is password protected
      if (!this.hasEnteredPassword) {
        if (["8.02", "8.011"].includes(name)) {
          this.attemptToJoinClassName = name;
          this.attemptToJoinClassId = id;
          this.classSecurityPopup = true;
          return;
        }
      }
      if (this.user.enrolledClasses) {
        for (const classObj of this.user.enrolledClasses) {
          if (classObj.id === id) return; 
        }
      }
      // update the user document to reflect the class enrollment
      const userUpdateObject = {};
      userUpdateObject.enrolledClasses = firebase.firestore.FieldValue.arrayUnion({
        id, 
        name
      });
      // for (let [emailOption, isEnabled] of Object.entries(DefaultEmailSettings)) {
      //   if (isEnabled) {
      //     userUpdateObject[emailOption] = firebase.firestore.FieldValue.arrayUnion(id);
      //   }
      // }
      await db.collection("users").doc(this.user.uid).update(userUpdateObject);
    },
    async updateSettings (payload) {
      this.userRef.update({ enrolledClasses: payload })
    },
    async createClass ({ "class name": name, "class description": description }) {
      if (!name) {
        this.$root.$emit("show-snackbar", "Error: new class must have a name");
        return;
      }
      this.fetchClasses();
      for (const c of this.schoolClasses) {
        if (c.name === name) return; 
      }
      // TODO: parallelize with Promise.all()
      const classDoc = await db.collection("classes").add({
        name,
        description: description || "No description yet",
        tags: [],
        roomTypes: ["Blackboard Rooms"]
      });
      await this.userRef.update({
        enrolledClasses: firebase.firestore.FieldValue.arrayUnion({
          id: classDoc.id,
          name
        })
      });
      this.fetchClasses();
    }
  }
};
</script>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.7s;
}
.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
  opacity: 0;
}
#home-page .app-banner {
  border-bottom: none !important;
}
.central-title h1 {
  font-size: 3.4em;
  font-weight: 600;
  font-family: "Raleway", sans-serif;
  /* text-decoration: underline; */
  text-decoration-color: #eee;
}
@media (max-width: 400px) {
  .central-title h1 {
    font-size: 2.5em;
  }
}
#home-page .app-banner .home-logo {
  display: none;
}
#home-page.scrolled .app-banner .home-logo {
  display: unset;
}
.enrolled-classes .v-card__title {
  word-break: unset;
  font-size: 1.1em;
}
/* latin-ext */
@font-face {
  font-family: 'Raleway';
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: local('Raleway SemiBold'), local('Raleway-SemiBold'), url(https://fonts.gstatic.com/s/raleway/v14/1Ptrg8zYS_SKggPNwPIsWqhPAMif.woff2) format('woff2');
  unicode-range: U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF;
}
/* latin */
@font-face {
  font-family: 'Raleway';
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: local('Raleway SemiBold'), local('Raleway-SemiBold'), url(https://fonts.gstatic.com/s/raleway/v14/1Ptrg8zYS_SKggPNwPIsWqZPAA.woff2) format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
</style>
