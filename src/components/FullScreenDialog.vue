<template>
	<v-dialog 
		:value="true" 
		fullscreen 
		hide-overlay 
		persistent 
		transition="slide-y-transition"
	>
		<v-card>
			<slot>

			</slot>
		</v-card>
	</v-dialog>
</template>

<script>
export default {
	data () {
		return {
			show: true
		}
	}
}
</script>