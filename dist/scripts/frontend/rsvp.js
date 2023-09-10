const rsvp_invite = document.querySelector('.rsvp_invite');
const rsvp_accepted = document.querySelector('.rsvp_accepted');
const rsvp_denied = document.querySelector('.rsvp_denied');
const guest_name = document.getElementById('guest_name');
const rsvp_yes = document.getElementById('rsvp-yes');
const rsvp_no = document.getElementById('rsvp-no');
const rsvp_buttons = document.getElementById('rsvp-buttons');
const plus1 = document.getElementById('plus1');
const loading = document.getElementById('loading');

const followUpQsModal = document.getElementById('followUpQsModal');
const followUpQsModalNum = document.getElementById('followUpQsModalNum');
const followUpQsAddGuestsInput = document.getElementById(
	'followUpQsAddGuestsInput',
);
const followUpQsModalSubmit = document.getElementById('followUpQsModalSubmit');
const fuq_additionalGuests = document.getElementById('fuq_additionalGuests');
const fuq_whoscoming = document.getElementById('fuq_whoscoming');
const followUpQsSongInput = document.getElementById('followUpQsSongInput');
const followUpQsGuestsInput = document.getElementById('followUpQsGuests');
const followUpQsDiet = document.getElementById('followUpQsDiet');

let guest;
let plus1Count = 0;

function init() {
	let id = window.location.href.split('?id=')[1];

	showOrHideElementsBasedOnLocalData();
	// If id is not provided or is empty, default to the one in localStorage.
	if (id == undefined || id.length == 0) {
		id = localStorage.weddingGuestID;
	}

	// If id is now set (either from the URL or localStorage), use it.
	if (id !== undefined && id.length !== 0) {
		localStorage.setItem('weddingGuestID', id);
		fetchData(id);
	}
}
init();

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

	guest_name.innerText = data.name;
	let status = guest.status.toLowerCase();
	loading.style.display = 'none';
	if (guest.status_type === 'custom') {
		rsvp_invite.style.maxHeight = '500px';
		rsvp_invite.style.padding = '20px';
		rsvp_buttons.style.display = '';
		handlePlus1();
	} else if (status == 'accepted invite') {
		rsvp_accepted.style.maxHeight = '500px';
		rsvp_accepted.style.padding = '20px';
		rsvp_accepted.innerHTML = `We are SOO excited to have you, ${
			guest.name
		}! ❤️ <br />You are allowed to bring ${guest.totalGuests - 1} guests.`;
		localStorage.setItem('weddingGuestAttendance', 'true');
	} else if (status === 'denied invite') {
		rsvp_denied.style.maxHeight = '500px';
		rsvp_denied.style.padding = '20px';
		rsvp_denied.innerHTML =
			'You have declined the invitation. If this was a mistake, please reach out to us. ';
		localStorage.setItem('weddingGuestAttendance', 'false');
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
	followUpQsModal.style.display = 'flex';
	if (plus1Count > 0) {
		fuq_additionalGuests.style.display = '';
		followUpQsModalNum.innerText = plus1Count;
		followUpQsAddGuestsInput.focus();
		followUpQsAddGuestsInput.max = plus1Count;
		followUpQsAddGuestsInput.value = plus1Count;
	} else {
		fuq_additionalGuests.style.display = 'none';
		fuq_whoscoming.style.display = 'none';
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
	commentString += 'Who is coming: ' + followUpQsGuestsInput.value + '\n';

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
	localStorage.setItem('weddingGuestAttendance', 'true');
	window.location.href = `/`;
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
	localStorage.setItem('weddingGuestAttendance', 'false');
	window.location.href = `/`;
});

function showOrHideElementsBasedOnLocalData() {
	const attendance = localStorage.getItem('weddingGuestAttendance') == 'true';
	const attendanceWalledElements = document.getElementsByClassName('walled');
	for (let i = 0; i < attendanceWalledElements.length; i++) {
		if (attendance) attendanceWalledElements[i].style.display = '';
		else attendanceWalledElements[i].style.display = 'none';
	}
}
