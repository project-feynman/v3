self.addEventListener('push', function(event) {
  console.log(event.data.json())
	const data = event.data.json()
	if(data.type && data.type === 'notification') {
		registration.showNotification(data.title, {
			body: data.body
		})
	}
})
