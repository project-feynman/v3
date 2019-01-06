self.addEventListener('install', function(event) {
	//TODO: create registering the push subcription to the database here
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
