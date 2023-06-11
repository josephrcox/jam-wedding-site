const page_rsvp = document.querySelector('.page_rsvp');
const guest_name = document.getElementById('guest_name');
const rsvp_yes = document.getElementById('rsvp-yes');
const rsvp_no = document.getElementById('rsvp-no');
const rsvp_buttons = document.getElementById('rsvp-buttons');
const loading = document.getElementById('loading');

let guest;

if (window.location.href.includes('rsvp')) {
	// get ?id= from url
	let id = window.location.href.split('?id=')[1];
	if (id === undefined || id.lenght === 0) {
		if (localStorage.weddingGuestID === undefined) {
			window.location.href = '/';
		} else {
			id = localStorage.weddingGuestID;
		}
	} else {
		localStorage.setItem('weddingGuestID', id);
	}
	localStorage.setItem('id', id);
	fetchData(id);
}

async function fetchData(id) {
	loading.style.display = '';
	if (id.includes('#')) {
		id = id.split('#')[1];
	}
	let response = await fetch(`/api/get/guest/${id}`);
	let data = await response.json();
	if (data.length === 0) {
		return (window.location.href = '/');
	}
	console.log(data);
	guest = data;

	document.title = `RSVP for ${data.name}`;
	guest_name.innerText = data.name;
	page_rsvp.style.display = 'flex';
	handleStatus();
}

function handleStatus() {
	let status = guest.status.status.toLowerCase();
	console.log(status);

	if (status === 'will invite' || status === 'invited') {
		rsvp_buttons.style.display = '';
	} else if (status === 'denied invite' || status === 'accepted invite') {
		window.location.href = `/rsvp/submitted?id=${guest.id}`;
	} else {
		window.location.href = '/';
	}
	loading.style.display = 'none';
}

rsvp_yes.addEventListener('click', async () => {
	await fetch(`/api/update/guest/${guest.id}`, {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			status: 'accepted invite',
		}),
	});

	window.location.href = `/rsvp/submitted/?id=${guest.id}`;
});

rsvp_no.addEventListener('click', async () => {
	await fetch(`/api/update/guest/${guest.id}`, {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			status: 'denied invite',
		}),
	});

	window.location.href = `/rsvp/submitted?id=${guest.id}`;
});
