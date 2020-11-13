<template>
  <div v-if="randomMusicURL"> 
    <youtube v-show="false"
      :video-id="getIDfromURL(randomMusicURL)" 
      ref="youtube"
    />
    <div class="text-center">
      <v-bottom-sheet inset hide-overlay>
        <template v-slot:activator="{ on, attrs }">
          <BaseButton :on="on" icon="mdi-music-clef-treble" color="secondary">
            Music
          </BaseButton>
        </template>
        
        <v-card tile>
          <v-progress-linear
            :value="50"
            class="my-0"
            height="3"
          />
          <v-list>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title>Raindrop Forest</v-list-item-title>
                <v-list-item-subtitle>Maplestory OST</v-list-item-subtitle>
              </v-list-item-content>

              <v-spacer></v-spacer>

              <v-list-item-icon>
                <v-btn icon>
                  <v-icon>mdi-rewind</v-icon>
                </v-btn>
              </v-list-item-icon>

              <v-list-item-icon :class="{ 'mx-5': $vuetify.breakpoint.mdAndUp }">
                <v-btn v-if="isPaused" @click="play()" icon>
                  <v-icon>mdi-play</v-icon> 
                </v-btn>

                <v-btn v-else @click="pause()" icon>
                  <v-icon>mdi-pause</v-icon>
                </v-btn> 
              </v-list-item-icon>

              <v-list-item-icon
                class="ml-0"
                :class="{ 'mr-3': $vuetify.breakpoint.mdAndUp }"
              >
                <v-btn icon>
                  <v-icon>mdi-fast-forward</v-icon>
                </v-btn>
              </v-list-item-icon>
            </v-list-item>
          </v-list>
        </v-card>
      </v-bottom-sheet>
    </div>
    <!-- <slot :play="play" :pause="pause" :isPaused="isPaused">
    
    </slot> -->
  </div>
</template>

<script>
import BaseButton from "@/components/BaseButton.vue";

export default {
  components: {
    BaseButton
  },
  data () {
    return {
      isPaused: false,
      favoriteMusicPieces: [
        "https://www.youtube.com/watch?v=DhUdOO9UNwY", // raindrop forest
        "https://www.youtube.com/watch?v=DmPMZGBBmxk" // sarabande Holberg Suite
        // "https://www.youtube.com/watch?v=j1wQ8ZMZq60", // Holberg Suite
        // "https://www.youtube.com/watch?v=QAxz16D4BlE", // Schubert Impromptu No. 3
      ],
    };
  },
  computed: {
    player () {
      return this.$refs.youtube.player; 
    },
    randomMusicURL () {
      const n = this.favoriteMusicPieces.length; 
      const randomNumber = Math.floor(Math.random() * (n + 1));
      return this.favoriteMusicPieces[randomNumber];
    }
  },
  mounted () {
    this.player.playVideo(); 
  }, 
  methods: {
    play () {
      this.player.playVideo(); 
      this.isPaused = false; 
    },
    pause () {
      this.player.pauseVideo(); 
      this.isPaused = true; 
    },
    getIDfromURL (url) {
      return this.$youtube.getIdFromUrl(url);
    }
  }
};
</script>