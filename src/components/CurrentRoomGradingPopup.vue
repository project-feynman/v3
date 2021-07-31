<template>
  <v-dialog :value="value" @input="newVal => $emit('input', newVal)" width="600">
    <v-card>
      <v-card-title>

      </v-card-title>
        <v-subheader class="headline">Total Points: {{ totalPoints }}</v-subheader> 
        <v-list two-line>
          <template v-for="(rubric, n) in rubrics">
            <v-list-item
              :key="n"
            >
              <v-checkbox :input-value="n === 0 ? (totalPoints === 1 || totalPoints === 4) : (totalPoints === 3 || totalPoints === 4)"
                @change="newVal => $emit('total-points-changed', newVal ? rubric.points : -rubric.points)" 
                class="pa-0 ma-0" hide-details
              />
              <div style="display: flex; align-content: center;">
                <b class="pa-0 my-0 mx-1">({{ rubric.points }} point{{ rubric.points >= 2 ? 's' : '' }})</b>
                  <div style="margin-left: 5px;">{{ rubric.description }}</div>
              </div>
            </v-list-item>

           <v-divider
              v-if="n !== 6"
              :key="`divider-${n}`"
              inset
            />
          </template>
        </v-list> 

        <v-subheader>Comments</v-subheader>

        <v-list two-line>
          <template v-for="n in 2">
            <v-list-item
              :key="n"
            >
              <v-list-item-avatar color="grey darken-1">
              </v-list-item-avatar>

              <v-list-item-content>
                <v-list-item-title>Comments {{ n }}</v-list-item-title>

                <v-list-item-subtitle>
                  Lorem ipsum dolor sit amet, consectetur adipisicing elit. Nihil repellendus distinctio similique
                </v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>

           <v-divider
              v-if="n !== 6"
              :key="`divider-${n}`"
              inset
            />
          </template>
        </v-list>

      <v-card-actions>
        <v-spacer/>
        <v-btn @click="$emit('input', false)">CLOSE</v-btn>
        <v-btn @click="$emit('board-graded'); $emit('input', false)">SAVE</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  props: {
    value: {
      type: Boolean,
      required: true
    },
    totalPoints: {
      type: Number,
      required: true
    }
  },
  data () {
    return {
      rubrics: [
        { points: 1, description: "Correctly state Biot-Savart Law" },
        { points: 3, description: 'Correct answer' }
      ]
    }
  }
}
</script>