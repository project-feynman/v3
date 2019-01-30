self.addEventListener('install', function(event) {
	console.log('worked')
})
self.addEventListener('push', function(event) {
  console.log(event.data.json())
	const data = event.data.json()
	if(data.type && data.type === 'message') {
		registration.showNotification(data.senderName + " sent you a message...", {
			body: data.body
		})
	}
})
