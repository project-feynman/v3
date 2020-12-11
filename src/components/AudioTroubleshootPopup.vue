 <!-- Library -->
          <!-- Cannot use v-on because it doesn't stop event propagation to the list item, see https://github.com/vuetifyjs/vuetify/issues/3333 -->
            <!-- <v-btn small @click.prevent.stop="isHelpPopupOpen = true">
              Help guide
            </v-btn> -->

            <!-- <v-dialog v-model="isHelpPopupOpen">
              <template v-slot:activator>
              
              </template>

              <v-card>
                <v-card-title>
                  No audio? 
                </v-card-title>

                <v-card-text>
                  <p>Ways to fix:</p>
                  <ol>
                    <p>Ways to fix</p>
                    <li>Reload the page [~50% success rate]</li>
                    <li>Close the page, then open a fresh page [~90% success rate]</li>
                    <li>Clear the browser cache (laptop) or force quit Safari (iPad) [~99% success rate]</li>
                    <li>
                      If there's still no audio, use your laptop for audio instead.
                    </li>
                  </ol>

                  <p>Other tips</p>
                    <ul>
                      <li>If there are echoes, make sure you have only <u>one unmuted device</u> at any given time.</li>
                      <li>If problems persist, you can email me eltonlin@mit.edu or Facetime me at +503 250 3868 and we can solve it together.</li>
                    </ul>
                </v-card-text>
              </v-card>
            </v-dialog> -->

          <!-- </v-row>
        </portal> -->