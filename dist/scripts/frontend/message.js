const messages = document.getElementById('messages');
const input = document.getElementById('postMessageInput');
const messageContainer = document.querySelector('#messageContainer');

document.addEventListener('DOMContentLoaded', async () => {
	// get messages from /api/get/messages
	const response = await fetch('/api/get/messages');
	const data = await response.json();

	// data is in an array of strings, post those strings in messages

	// on input change, send a request to /api/post/
	messages.innerHTML = '';
	data.forEach((message) => {
		messages.innerHTML += `
            <div class="message">
                <p>${message[1]} - ${message[0]}</p>
            </div>
        `;
	});
	messageContainer.style.display = 'block';
});

input.addEventListener('keydown', async (e) => {
	// enter
	if (e.keyCode === 13) {
		// todays date in this format 9/13/2023
		const todaysDate = new Date().toLocaleDateString();
		messages.innerHTML =
			`
            <div class="message new">
                <p>${todaysDate} - ${input.value}</p>
            </div>
        ` + messages.innerHTML;
		const value = input.value;
		input.value = '';

		const response = await fetch('/api/post/message', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ message: value }),
		});
		const data = await response.json();
	}
});
