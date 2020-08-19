<template>
<!-- this component essentially exists so that RealtimeAudio isn't as cluttered -->
    <v-dialog :value="popupOpen">
			<v-card>
				<v-card-title>
					Media Connection Error
				</v-card-title>
				<v-card-text>
					Hmmm... Your video or audio failed to connect. Usually this is a problem with your browser permissions.
					If you're on Chrome, look for a camera icon inside of the right side of your url bar. If you don't see that,
					there should be a lock icon at the left of your url bar. Clicking on either of these will hopefully allow 
					you to change your permissions for your Camera and Microphone. You'll have to <b>refresh your page </b> after 
					changing any permissions. 
					Here are some support links for more info on changing your Media permissions:
					<v-spacer/>
					<a href="https://support.google.com/chrome/answer/2693767?co=GENIE.Platform%3DDesktop&hl=en">Chrome</a>
					<v-spacer/>
					<a href="https://support.apple.com/guide/safari/websites-ibrwe2159f50/mac">Mac</a>
					<v-spacer/>
					<a href="https://help.daily.co/en/articles/3388632-unblock-your-camera-microphone-on-mobile-android-and-ios">iOS/Android</a>
					<v-spacer/>
					If you're pretty sure that your permissions are enabled but your video is still not working, feel free to click the Give Feedback at the top right to explain your issue!
				</v-card-text>
				<v-card-actions>
					<v-spacer/>
					<v-btn @click="$emit('exit')">
						exit
					</v-btn>
				</v-card-actions>
			</v-card>
		</v-dialog>
</template>

<script>
export default {
	props :{
		popupOpen: Boolean
	}
}
</script>