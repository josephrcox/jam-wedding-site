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
	})
);
app.use(bodyParser.text({ limit: '200mb' }));
app.use(express.json());

// VARIABLES
const guest_list_id = '900601161684';
const API_KEY = process.env.API_KEY;

// Document routes

app.get('/api/get/guest/:id', async (req, res) => {
	let guest = await fetchGuests(req.params.id);
	res.json(guest);
});

app.put('/api/update/guest/:id', async (req, res) => {
	// Updates status of guest
	let guest = await fetchGuests(req.params.id);
	let status = req.body.status;
	let body = {
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
		}
	);
	const data = await response.json();

	res.json(data);
});

app.get('/rsvp/submitted', async (req, res) => {
  let id = req.query.id;

  if (id === undefined) {
    return res.redirect('/');
  }
  let guest = await fetchGuests(id);
  console.log(guest.status.status)
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

app.get('/rsvp', async (req, res) => {
	res.render('rsvp.ejs');
});

app.get('/', async (req, res) => {
	res.render('home.ejs');
});

app.get('*', (req, res) => {
	res.redirect('/');
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
	console.log('Listening on port', port);
});

async function fetchGuests(optionalID) {
	let guest_list = [];

	const query = new URLSearchParams({
		archived: 'false',
		page: '0',
		include_closed: 'false',
	}).toString();

	const resp = await fetch(
		`https://api.clickup.com/api/v2/list/${guest_list_id}/task?${query}`,
		{
			method: 'GET',
			headers: {
				Authorization: API_KEY,
			},
		}
	);

	let data = await resp.json();
	for (let i = 0; i < data.tasks.length; i++) {
		if (optionalID) {
			if (data.tasks[i].id !== optionalID) {
				continue;
			} else {
				return data.tasks[i];
			}
		}
		let g = Object.create(guestObject);
		g.id = data.tasks[i].id;
		g.name = data.tasks[i].name;
		g.status = data.tasks[i].status.status;
		guest_list.push(g);
	}

	return guest_list;
}

// guest object

const guestObject = {
	id: '',
	name: '',
	status: '',
};
