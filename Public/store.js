//const apiBase = 'http://localhost:3000';
const apiBase = `${window.location.protocol}//${window.location.hostname}:3000`;
let removeCartItemButtons = document.getElementsByClassName('btn-cart');
let purchaseButtons = document.getElementsByClassName('btn-purchase');
let addToCartButtons = document.getElementsByClassName('store-item-btn');
let cartInputFields = document.getElementsByClassName('cart-input');

// update cart total when quantity changes
increaseDecreaseQuantity();
function increaseDecreaseQuantity() {
    for (let i = 0; i < cartInputFields.length; i++) {
        let inputField = cartInputFields[i];
        inputField.addEventListener('change', function (event) {
            let input = event.target;
            if (isNaN(input.value) || input.value <= 0) {
                input.value = 1;
            } else {
                updateCartTotal();
            }
        })
    }
}
// remove cart item 
addRemoveCartItemEventListeners();
function addRemoveCartItemEventListeners() {
    for (let i = 0; i < removeCartItemButtons.length; i++) {
        let button = removeCartItemButtons[i];
        button.addEventListener('click', function (event) {
            let buttonClicked = event.target;
            buttonClicked.parentElement.parentElement.remove();

            updateCartTotal();
        });

    }
}

// finalize purchase
for (let i = 0; i < purchaseButtons.length; i++) {
    let button = purchaseButtons[i];
    button.addEventListener('click', function (event) {
        event.preventDefault();
        finalizePurchase();
    });
}

async function finalizePurchase() {
    const amountText = document.getElementsByClassName('purchase-total-amount')[0].innerText;
    const total = parseFloat(amountText.replace(/[^0-9.]/g, '')) || 0;

    if (total <= 0) {
        alert('Your cart is empty.');
        return;
    }

    try {
        const keyResponse = await fetch(`${apiBase}/razorpay-key`);
        const keyData = await keyResponse.json();

        if (!keyData.key) {
            alert('Razorpay public key is not configured.');
            return;
        }

        const response = await fetch(`${apiBase}/create-order`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ amount: Math.round(total * 100), currency: 'INR', receipt: 'receipt#1', notes: {} })
        });

        if (!response.ok) {
            throw new Error('Unable to create order.');
        }

        const order = await response.json();

        const options = {
            key: keyData.key,
            amount: order.amount,
            currency: order.currency,
            name: 'The Indian Ocean Band',
            description: 'Store purchase',
            order_id: order.id,
            handler: function (response) {
                alert('Payment successful.');
                removeCartItems();
            },
            prefill: {
                name: 'Guest User',
                email: 'guest@example.com',
                contact: '9999999999'
            },
            theme: {
                color: '#F37254'
            },
            modal: {
                ondismiss: function () {
                    alert('Payment cancelled.');
                }
            }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
    } catch (error) {
        console.error(error);
        alert('Unable to open Razorpay checkout.');
    }
}

// fetch store items from server and display them
async function loadStoreItems() {
    try {
        const response = await fetch(`${apiBase}/items`);
        if (!response.ok) {
            throw new Error('Unable to fetch store items.');
        }

        const itemsData = await response.json();
        displayStoreItems(itemsData);
    } catch (error) {
        console.error('Error fetching store items:', error);
        alert('Unable to fetch store items.');
    }
}

loadStoreItems();

function displayStoreItems(storeItems) {
    try {
        const musicContainer = document.getElementsByClassName('store-items-music')[0];
        const merchContainer = document.getElementsByClassName('store-items-merch')[0];

        if (!musicContainer || !merchContainer) {
            return;
        }

        musicContainer.innerHTML = '';
        (storeItems.music || []).forEach(item => {
            const title = item.title || 'Untitled Item';
            const storeItem = `<div class="store-item-box">
                <div class="store-item">
                    <span class="store-item-title">${title}</span>
                    <img class="store-item-img" src="Images/${item.image}" alt="${title}">
                    <div class="add-to-cart">
                        <span class="store-item-price" data-price="${item.price || 0}">Price:${item.currency || '₹'} ${item.price || 0}</span>
                        <button class="btn btn-tours store-item-btn" type="button">Add to Cart</button>
                    </div>
                </div>
            </div>`;
            musicContainer.appendChild(document.createRange().createContextualFragment(storeItem));
        });

        merchContainer.innerHTML = '';
        (storeItems.merch || []).forEach(item => {
            const title = item.name || item.title || 'Untitled Item';
            const storeItem = `<div class="store-item-box">
                <div class="store-item">
                    <span class="store-item-title">${title}</span>
                    <img class="store-item-img" src="Images/${item.image}" alt="${title}">
                    <div class="add-to-cart">
                        <span class="store-item-price" data-price="${item.price || 0}">Price:${item.currency || '₹'} ${item.price || 0}</span>
                        <button class="btn btn-tours store-item-btn" type="button">Add to Cart</button>
                    </div>
                </div>
            </div>`;
            merchContainer.appendChild(document.createRange().createContextualFragment(storeItem));
        });
    } catch (error) {
        console.error('Error displaying store items:', error);
        alert('Unable to display store items. Please refresh the page.');
    }
}

// add to cart
addToCart();
function addToCart() {
    document.addEventListener('click', function (event) {
        if (!event.target.classList.contains('store-item-btn')) {
            return;
        }

        const buttonClicked = event.target;
        const storeItem = buttonClicked.parentElement.parentElement;
        const itemTitle = storeItem.getElementsByClassName('store-item-title')[0].innerText;
        const itemsinCart = document.getElementsByClassName('item-title');
        const isExisting = Array.from(itemsinCart).some(element => element.innerText === itemTitle);

        if (isExisting) {
            alert('This item is already in the cart');
            return;
        }

        const itemPriceElement = storeItem.getElementsByClassName('store-item-price')[0];
        const itemPrice = itemPriceElement.dataset.price || itemPriceElement.innerText;
        const itemImageSrc = storeItem.getElementsByClassName('store-item-img')[0].src;
        const cartItemsContainer = document.getElementsByClassName('cart-items-container')[0];

        const cartItem = `<div class="cart-items">
            <span class="cart-items-item cart-column">
                <img class="cart-image" src="${itemImageSrc}" alt="${itemTitle}">
                <span class="item-title">${itemTitle}</span>
            </span>
            <span class="cart-items-price cart-column">${itemPrice}</span>
            <span class="cart-items-quantity cart-column">
                <input class="cart-input" type="number" value="1" title="price"></input>
                <button class="btn btn-cart btn-tours" type="button">Remove</button>
            </span>
        </div>`;
        cartItemsContainer.appendChild(document.createRange().createContextualFragment(cartItem));

        addRemoveCartItemEventListeners();
        increaseDecreaseQuantity();
        updateCartTotal();
        alert('Item added to cart');
    });
}

function updateCartTotal() {
    let cartItems = document.getElementsByClassName('cart-items');
    let total = 0;
    for (let i = 0; i < cartItems.length; i++) {
        let cartItem = cartItems[i];
        let priceElement = cartItem.getElementsByClassName('cart-items-price')[0];
        let quantityElement = cartItem.getElementsByClassName('cart-input')[0];
        let price = parseFloat(priceElement.innerText.replace(/[^0-9.]/g, '')) || 0;
        let quantity = parseInt(quantityElement.value, 10) || 1;
        total = total + (price * quantity);
    }
    document.getElementsByClassName('purchase-total-amount')[0].innerText = '₹' + total.toFixed(2);
}

function removeCartItems() {
    let cartItemsContainer = document.getElementsByClassName('cart-items-container')[0];
    let cartItems = cartItemsContainer.getElementsByClassName('cart-items');
    Array.from(cartItems).forEach(element => {
        element.remove();
    });
    updateCartTotal();
}

