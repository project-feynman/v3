<template>
	<v-dialog v-model="show" fullscreen hide-overlay transition="dialog-bottom-transition">
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
			show: true,
		}
	},
}
</script>