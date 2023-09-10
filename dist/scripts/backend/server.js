if (process.env.NODE_ENV !== 'production') {
	require('dotenv').config();
}
const express = require('express');
const app = express();
const { response } = require('express');
const path = require('path');
const fs = require('fs');

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

app.use(express.static('dist'));

// VARIABLES
const guest_list_id = '900601161684';
const wishlist_list_id = '901002344671';
const API_KEY = process.env.API_KEY;

// Document routes

app.get('/api/get/wishlist', async (req, res) => {
	// Get all wishlist items from the wishlist list in ClickUp, and return them to the frontend if they are not closed status
	const requestBody = {
		include_closed: false,
		archived: false,
	};

	const resp = await fetch(
		`https://api.clickup.com/api/v2/list/${wishlist_list_id}/task?include_closed=true&archived=false`,
		{
			method: 'GET',
			headers: {
				Authorization: API_KEY,
				contentType: 'application/json',
			},
		},
	);

	const data = await resp.json();

	res.json(data);
});

app.put('/api/wishlist/closeitem', async (req, res) => {
	const { id } = req.body;

	const query = new URLSearchParams({
		custom_task_ids: 'false',
		team_id: '8651601',
	}).toString();

	const resp = await fetch(
		`https://api.clickup.com/api/v2/task/${id}?${query}`,
		{
			method: 'PUT',
			headers: {
				Authorization: API_KEY,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				status: 'complete',
			}),
		},
	);
	const data = await resp.json();
	res.json(data);
});

app.get('/api/get/guest/:id', async (req, res) => {
	const id = req.params.id;
	if (id.includes('#')) {
		id = req.params.id.replace('#', '');
	}
	const guest = await fetchGuests(id);
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

app.get('/', async (req, res) => {
	res.sendFile(path.join(__dirname, '../../index.html'));
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
