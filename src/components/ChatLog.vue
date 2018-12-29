<template>
  <div class="chat-log">
    <v-card>
      <v-card-text>
        <v-layout>
          <span class="teal--text">Alice:</span>
          <span class="grey--text text--darken--3 mx-1">Hello, I'd like to ask about...</span>
        </v-layout>
        <span class="grey--text time">6:00 pm, January 1st</span>
      </v-card-text>

      <v-card-text>
        <v-layout>
          <span class="teal--text">Vishesh:</span>
          <span class="grey--text text--darken--3 mx-1">This is a common misunderstanding. Here, have a look...</span>
        </v-layout>
        <span class="grey--text time">6:05 pm, January 1st</span>
      </v-card-text>

      <!-- <v-card-text v-if="owner" v-for="message in messages" :key="message['.key']">
        <v-layout>
          <span v-if="owner.name" class="teal--text">{{ firstName(owner.name) }}:</span>
          <span class="grey--text text--darken--3 mx-1">{{ message.content }}</span>
        </v-layout>
        <span class="grey--text time">6:00 pm, January 1st</span> -->
    
    </v-card>
  </div>
</template>