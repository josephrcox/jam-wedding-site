const page_rsvp = document.querySelector('.page_rsvp');
const guest_name = document.getElementById('guest_name');
const rsvp_yes = document.getElementById('rsvp-yes');
const rsvp_no = document.getElementById('rsvp-no');
const rsvp_buttons = document.getElementById('rsvp-buttons');
const plus1 = document.getElementById('plus1');

const followUpQsModal = document.getElementById('followUpQsModal');
const followUpQsModalNum = document.getElementById('followUpQsModalNum');
const followUpQsAddGuestsInput = document.getElementById(
	'followUpQsAddGuestsInput',
);
const followUpQsModalSubmit = document.getElementById('followUpQsModalSubmit');
const fuq_additionalGuests = document.getElementById('fuq_additionalGuests');
const followUpQsSongInput = document.getElementById('followUpQsSongInput');
const followUpQsDiet = document.getElementById('followUpQsDiet');

let guest;
let plus1Count = 0;

if (window.location.href.includes('rsvp')) {
	// get ?id= from url
	let id = window.location.href.split('?id=')[1];
	if (id === undefined || id.length === 0) {
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
	localStorage.setItem('weddingGuestName', guest.name);

	document.title = `RSVP for ${data.name}`;
	guest_name.innerText = data.name;
	document.getElementById('loading').remove();
	page_rsvp.style.display = 'flex';
	handleStatus();
	handlePlus1();
}

function handleStatus() {
	let status = guest.status.toLowerCase();

	if (status === 'will invite' || status === 'invited') {
		rsvp_buttons.style.display = '';
	} else if (status === 'denied invite' || status === 'accepted invite') {
		window.location.href = `/rsvp/submitted?id=${guest.id}`;
	} else {
		window.location.href = '/';
	}
}

function handlePlus1() {
	if (guest.totalGuests > 1) {
		plus1.style.display = 'block';
		plus1Count = guest.totalGuests - 1;
		if (plus1Count == 1) {
			plus1.innerHTML = plus1.innerHTML.replace('guests.', 'guest.');
		}
		document.getElementById('plus1number').innerText = plus1Count;

		plus1people();
		setInterval(function () {
			plus1people();
		}, 1000);
	}
}

function plus1people() {
	document.getElementById('plus1people').innerHTML = '🫵 (you) + ';
	for (let i = 0; i < plus1Count; i++) {
		const randomDancer = Math.random() < 0.5 ? '🕺' : '💃';
		document.getElementById('plus1people').innerHTML += randomDancer;
	}
}

rsvp_yes.addEventListener('click', async () => {
	let commentString = '';
	let additionalGuestsConfirmed = 0;
	followUpQsModal.style.display = 'flex';
	if (plus1Count > 0) {
		fuq_additionalGuests.style.display = '';
		followUpQsModalNum.innerText = plus1Count;
		followUpQsAddGuestsInput.focus();
		followUpQsAddGuestsInput.max = plus1Count;
		followUpQsAddGuestsInput.value = plus1Count;
	} else {
		fuq_additionalGuests.style.display = 'none';
	}
});

followUpQsAddGuestsInput.addEventListener('input', () => {
	if (followUpQsAddGuestsInput.value > plus1Count) {
		followUpQsAddGuestsInput.value = plus1Count;
	}
});

followUpQsModalSubmit.addEventListener('click', async () => {
	let commentString = '';
	if (plus1Count > 0) {
		commentString +=
			'Additional guests confirmed: ' + followUpQsAddGuestsInput.value + '\n';
	}
	commentString += 'Song request: ' + followUpQsSongInput.value + '\n';
	commentString += 'Dietary restrictions: ' + followUpQsDiet.value + '\n';

	await fetch(`/api/comment/guest/${guest.id}`, {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			comment: commentString,
		}),
	});
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
