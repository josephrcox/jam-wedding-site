const container = document.querySelector('#wishlistContainer');

document.addEventListener('DOMContentLoaded', async () => {
	const response = await fetch('/api/get/wishlist');
	const data = await response.json();

	if (data.tasks !== undefined && data.tasks.length !== 0) {
		container.innerHTML = '';
	}

	data.tasks.sort((a, b) => {
		if (a.status.type == 'closed') {
			return 1;
		} else {
			return -1;
		}
	});

	for (let i = 0; i < data.tasks.length; i++) {
		let item = data.tasks[i];
		const itemContainer = document.createElement('div');
		itemContainer.classList.add('wishlistItem');
		if (item.status.type == 'closed') {
			itemContainer.classList.add('purchasedItem');
		}

		const nameLink = document.createElement('a');
		nameLink.href = item.custom_fields[1].value;
		nameLink.target = '_blank';
		nameLink.classList.add('itemLink');

		const name = document.createElement('span');
		name.classList.add('itemName');
		if (item.name.length > 20) {
			name.innerHTML = `${item.name.substring(0, 20)}...`;
		} else {
			name.innerText = item.name;
		}
		nameLink.appendChild(name);

		const domain = document.createElement('span');
		domain.classList.add('itemDomain');
		domain.innerText = new URL(item.custom_fields[1].value).hostname;
		nameLink.appendChild(domain);

		const status = document.createElement('span');
		status.classList.add('itemStatus');
		status.innerText =
			item.status.type == 'closed' ? '✅ Purchased' : 'Available';

		const purchaseButton = document.createElement('button');
		purchaseButton.classList.add('purchaseButton');
		purchaseButton.innerText = 'I bought this';
		purchaseButton.addEventListener('click', async () => {
			const confirmPurchase = window.confirm(
				'Are you sure you want to mark this item as purchased?',
			);
			if (!confirmPurchase) {
				return;
			}

			const response = await fetch('/api/wishlist/closeitem', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					id: item.id,
				}),
			});

			const responseData = await response.json();
			if (responseData.err !== undefined) {
				alert(responseData.err);
			} else {
				alert('Item marked as purchased!');
				status.innerText = '✅ Purchased';
				itemContainer.classList.add('purchasedItem');
				const purchases = localStorage.getItem('purchases') ?? '[]';
				const purchasesArray = JSON.parse(purchases);
				purchasesArray.push(item.id);
				purchaseButton.remove();
				localStorage.setItem('purchases', JSON.stringify(purchasesArray));
			}
		});

		itemContainer.appendChild(nameLink);
		itemContainer.appendChild(status);
		if (item.status.type !== 'closed')
			itemContainer.appendChild(purchaseButton);
		container.appendChild(itemContainer);
	}
});
