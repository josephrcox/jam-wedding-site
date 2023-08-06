document.addEventListener('DOMContentLoaded', async () => {
	if (localStorage.getItem('weddingGuestID')) {
		const response = await fetch(
			`/api/get/guest/${localStorage.getItem('weddingGuestID')}`,
		);
		const data = await response.json();
		console.log(data);
		if (data.status.status === 'accepted invite') {
			showAttendeeInformation();
		}
	}
});

function showAttendeeInformation() {}

// on document scroll
document.addEventListener('scroll', () => {
	const header = document.querySelector('.header');
	const logo = document.querySelector('.logo');
	const bgHeader = document.querySelector('.bgHeader');
	const screenWidth = window.innerWidth;
	if (screenWidth < 551) {
		if (window.scrollY > 80) {
			logo.style.transform = 'scale(0.7) translateY(-25px)';
			logo.style.marginBottom = '-30px';
			bgHeader.style.marginBottom = '-100px';
			bgHeader.style.transform = 'scale(0.8) translateY(-55px)';
			// add bottom shadow to header
			header.classList.add('bottomShadow');
		} else {
			logo.style.transform = 'scale(1)';
			logo.style.marginBottom = '3px';
			bgHeader.style.marginBottom = '-81px';
			bgHeader.style.transform = 'scale(1)';
			// translateY(-35px);
			bgHeader.style.transform = 'scale(1.0) translateY(-35px)';
			header.classList.remove('bottomShadow');
		}
	}
});

const clickableSections = document.querySelectorAll('.clickableSection');

for (let i = 0; i < clickableSections.length; i++) {
	clickableSections[i].addEventListener('click', () => {
		// get 2nd child of clickableSection and make it visible
		const section = clickableSections[i].children[1];
		if (section.style.maxHeight != '0px' && section.style.maxHeight != '') {
			console.log(section.style.maxHeight);
			section.style.maxHeight = '0px';
			section.style.margin = '0';
		} else {
			section.style.display = 'block';
			section.style.maxHeight = '80px';
			section.style.marginBottom = '20px';
		}
		clickableSections[i].classList.toggle('active');
	});
}

const countdown = document.querySelector('#countdown');

const weddingDate = new Date('2024-09-07T16:00:00');

const currentDate = new Date();
const diff = weddingDate - currentDate;

const days = Math.floor(diff / 1000 / 60 / 60 / 24);
const hours = Math.floor(diff / 1000 / 60 / 60) % 24;
const minutes = Math.floor(diff / 1000 / 60) % 60;

countdown.innerHTML = ` 
		<div>${days} <span>days - </span>${hours} <span>hours - </span> ${minutes} <span>minutes</span> left to go!</div>
	`;
