if (process.env.NODE_ENV !== 'production') {
	require('dotenv').config();
}
const express = require('express');
const app = express();
const expressLayouts = require('express-ejs-layouts');
const { response } = require('express');
const path = require('path');
const fs = require('fs');
const cookieParser = require('cookie-parser');

app.use(cookieParser());

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));

app.use(express.static(path.join(__dirname, '../../../')));
app.set('views', path.join(__dirname, '../../', '/views'));
app.set('layout', 'layouts/layout');

app.use(expressLayouts);
const bodyParser = require('body-parser');
app.use(bodyParser.json({ limit: '50mb', extended: true }));
app.use(
	bodyParser.urlencoded({
		limit: '50mb',
		extended: true,
		parameterLimit: 50000,
	}),
);
app.use(bodyParser.text({ limit: '200mb' }));
app.use(express.json());

// VARIABLES
const guest_list_id = '900601161684';
const API_KEY = process.env.API_KEY;

// Document routes

app.get('/api/get/guest/:id', async (req, res) => {
	const id = req.params.id;
	if (id.includes('#')) {
		id = req.params.id.replace('#', '');
	}
	const guest = await fetchGuests(id);
	console.log(guest);
	res.json(guest);
});

app.put('/api/comment/guest/:id', async (req, res) => {
	// get body
	const comment = req.body.comment;

	const requestBody = {
		comment_text: comment,
		assignee: null,
		notify_all: true,
	};

	const response = await fetch(
		`https://api.clickup.com/api/v2/task/${req.params.id}/comment`,
		{
			method: 'POST',
			headers: {
				Authorization: API_KEY,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(requestBody),
		},
	);
	const data = await response.json();
	res.json(data);
});

app.put('/api/update/guest/:id', async (req, res) => {
	// Updates status of guest
	const guest = await fetchGuests(req.params.id);
	const status = req.body.status;
	const body = {
		status: status,
	};

	const response = await fetch(
		`https://api.clickup.com/api/v2/task/${guest.id}`,
		{
			method: 'PUT',
			headers: {
				Authorization: API_KEY,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(body),
		},
	);
	const data = await response.json();

	res.json(data);
});

app.get('/rsvp/submitted', async (req, res) => {
	const id = req.query.id;

	if (id === undefined) {
		return res.redirect('/');
	}
	let guest = await fetchGuests(id);
	console.log(guest.status.status);
	if (guest.status.status === 'accepted invite') {
		return res.render('rsvp-accepted.ejs');
	} else if (guest.status.status === 'denied invite') {
		return res.render('rsvp-denied.ejs');
	} else if (guest.status.status === 'will invite') {
		return res.redirect(`/rsvp?id=${id}`);
	} else {
		return res.redirect('/');
	}
});

app.get('/admin/:pw', async (req, res) => {
	if (req.params.pw !== process.env.ADMIN_PW) {
		return res.redirect('/');
	}
	const guest_list = await fetchGuests();
	res.render('admin.ejs', { guest_list: guest_list });
});

app.get('/rsvp', async (req, res) => {
	res.render('rsvp.ejs');
});

app.get('/aboutus', async (req, res) => {
	res.render('aboutus.ejs');
});

app.get('/', async (req, res) => {
	res.render('home.ejs');
});

app.get('*', (req, res) => {
	res.redirect('/');
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
	console.log('Listening on http://localhost:8080', port);
});

async function fetchGuests(optionalID) {
	let guest_list = [];

	const query = new URLSearchParams({
		archived: 'false',
		page: '0',
		include_closed: 'false',
	}).toString();

	let resp;
	if (optionalID) {
		resp = await fetch(
			`https://api.clickup.com/api/v2/task/${optionalID}/?${query}`,
			{
				method: 'GET',
				headers: {
					Authorization: API_KEY,
				},
			},
		);
	} else {
		resp = await fetch(
			`https://api.clickup.com/api/v2/list/${guest_list_id}/task?${query}`,
			{
				method: 'GET',
				headers: {
					Authorization: API_KEY,
				},
			},
		);
	}

	let data = await resp.json();
	console.log(data);
	if (optionalID) {
		let g = Object.create(guestObject);
		g.id = data.id;
		g.name = data.name;
		g.status = data.status.status;
		g.status_type = data.status.type;
		for (let c = 0; c < data.custom_fields.length; c++) {
			if (data.custom_fields[c].id == '487bc19e-aacd-4f60-802a-770d6a3bab2a') {
				g.totalGuests = data.custom_fields[c].value;
			}
		}

		return g;
	} else {
		for (let i = 0; i < data.tasks.length; i++) {
			let g = Object.create(guestObject);
			g.id = data.tasks[i].id;
			g.name = data.tasks[i].name;
			g.status = data.tasks[i].status.status;
			g.status_type = data.tasks[i].status.type;
			for (let c = 0; c < data.tasks[i].custom_fields.length; c++) {
				if (
					data.tasks[i].custom_fields[c].id ==
					'487bc19e-aacd-4f60-802a-770d6a3bab2a'
				) {
					g.totalGuests = data.tasks[i].custom_fields[c].value;
				}
			}
			guest_list.push(g);
		}
	}

	return guest_list;
}

const guestObject = {
	id: '',
	name: '',
	status: '',
	status_type: '', // "custom" means active
	totalGuests: 1,
};
