const $ = s => document.querySelector(s);
const app = $('#app');

/* ESTILOS DEL FORMULARIO DE PAGO */

const payStyles = document.createElement('style');

payStyles.textContent = `
    #cart {
        max-height: 90vh;
        overflow-y: auto;
        max-width: min(520px, 94vw);
    }

    .pay h3 {
        margin: 1.4rem 0 0.4rem;
    }

    .pay label {
        display: block;
        margin: 0.7rem 0;
    }

    .pay input,
    .pay select {
        display: block;
        width: 100%;
        margin-top: 0.3rem;
        padding: 0.6rem 0.7rem;
        font: inherit;
        box-sizing: border-box;
    }

    .pay-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.8rem;
    }

    .summary {
        margin: 1rem 0;
    }

    .summary div {
        display: flex;
        justify-content: space-between;
        padding: 0.2rem 0;
    }

    .summary .total {
        font-weight: bold;
        border-top: 1px solid currentColor;
        margin-top: 0.4rem;
        padding-top: 0.5rem;
    }

    .pay-error {
        color: #b3261e;
        min-height: 1.2em;
    }
`;

document.head.appendChild(payStyles);

/* PRODUCTOS */

const products = [
    {
        id: 'cloud',
        name: 'Cloud Paint',
        cat: 'Mejillas',
        price: 520,
        colors: ['#d97880', '#b34f65', '#e99b83']
    },
    {
        id: 'balm',
        name: 'Balm Dotcom',
        cat: 'Labios',
        price: 390,
        colors: ['#bc657d', '#e4a0ae', '#a16a58']
    },
    {
        id: 'glaze',
        name: 'Lip Glaze',
        cat: 'Labios',
        price: 520,
        colors: ['#df879d', '#ad536a', '#d9a28c']
    },
    {
        id: 'brow',
        name: 'Boy Brow',
        cat: 'Cejas',
        price: 490,
        colors: ['#49332c', '#85634e', '#292323']
    }
];

/* ENVÍO */

const FREE_SHIPPING = 999;
const SHIPPING_COST = 99;

const STATES = [
    'Aguascalientes', 'Baja California', 'Baja California Sur',
    'Campeche', 'Chiapas', 'Chihuahua', 'Ciudad de México',
    'Coahuila', 'Colima', 'Durango', 'Estado de México',
    'Guanajuato', 'Guerrero', 'Hidalgo', 'Jalisco', 'Michoacán',
    'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca', 'Puebla',
    'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa',
    'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz',
    'Yucatán', 'Zacatecas'
];

/* ALMACENAMIENTO LOCAL */

function read(key, defaultValue) {
    try {
        return JSON.parse(localStorage.getItem(key))
            ?? defaultValue;
    } catch {
        return defaultValue;
    }
}

function save(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

let bag = read('bag', []);
let reviews = read('reviews', []);
let points = read('points', 0);
let profile = read('profile', 'Camila');
let favorites = read('favorites', []);
let selected = {};
let filter = 'Todo';
let stream = null;

const money = n => '$' + n.toLocaleString('es-MX') + ' MXN';

const esc = s => String(s).replace(
    /[&<>"']/g,
    c => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[c])
);

/* TARJETAS DE PRODUCTOS */

function cards() {

    return `
        <div class="grid">

            ${products
                .filter(p => filter === 'Todo' || p.cat === filter)
                .map(p => `

                <article class="product">

                    <img src="${p.id}.jpg" alt="${p.name}">

                    <span class="muted">${p.cat}</span>

                    <h3>${p.name}</h3>

                    ${money(p.price)}

                    <div class="swatches">

                        ${p.colors.map((c, i) => `
                            <button
                                aria-label="Tono ${i + 1}"
                                class="swatch ${
                                    (selected[p.id] || 0) === i
                                    ? 'selected' : ''
                                }"
                                style="background:${c}"
                                onclick="tone('${p.id}', ${i}, this)">
                            </button>
                        `).join('')}

                    </div>

                    <button onclick="add('${p.id}')">
                        Agregar a bolsa +
                    </button>

                    <button onclick="fav('${p.id}', this)">
                        ${favorites.includes(p.id) ? '♥' : '♡'}
                        Favorito
                    </button>

                </article>

            `).join('')}

        </div>
    `;
}

function tone(id, i, button) {

    selected[id] = i;

    button.parentNode
        .querySelectorAll('button')
        .forEach(x => x.classList.remove('selected'));

    button.classList.add('selected');
}

/* FAVORITOS */

function fav(id, button) {

    favorites = favorites.includes(id)
        ? favorites.filter(x => x !== id)
        : [...favorites, id];

    save('favorites', favorites);

    button.textContent =
        (favorites.includes(id) ? '♥' : '♡') + ' Favorito';
}

/* CARRITO */

function add(id) {

    bag.push({
        id,
        tone: selected[id] || 0
    });

    save('bag', bag);
    update();

    $('#bag').animate([
        { transform: 'scale(1)' },
        { transform: 'scale(1.12)' },
        { transform: 'scale(1)' }
    ], 250);
}

function update() {
    $('#count').textContent = bag.length;
}

function reward(n) {
    points += n;
    save('points', points);
}

const subtotal = () => bag.reduce(
    (s, x) => s + products.find(p => p.id === x.id).price, 0
);

const shipping = () =>
    bag.length === 0 || subtotal() >= FREE_SHIPPING
        ? 0
        : SHIPPING_COST;

const grandTotal = () => subtotal() + shipping();

function showCart() {

    const items = bag.map((x, i) => {

        let p = products.find(p => p.id === x.id);

        return `
            <div class="line">
                <span>
                    ${p.name} · Tono ${x.tone + 1}
                    <br>
                    ${money(p.price)}
                </span>

                <button onclick="removeItem(${i})">
                    Quitar
                </button>
            </div>
        `;

    }).join('');

    if (!bag.length) {

        $('#cartItems').innerHTML = 'Tu bolsa está vacía.';

    } else {

        $('#cartItems').innerHTML = items + `

            <div class="summary">

                <div>
                    <span>Subtotal</span>
                    <span>${money(subtotal())}</span>
                </div>

                <div>
                    <span>Envío</span>
                    <span>${shipping() ? money(shipping()) : 'Gratis'}</span>
                </div>

                <div class="total">
                    <span>Total</span>
                    <span>${money(grandTotal())}</span>
                </div>

                ${shipping() ? `
                    <p class="muted">
                        Envío gratis en compras desde ${money(FREE_SHIPPING)}.
                    </p>
                ` : ''}

            </div>

            <form id="payForm" class="pay" novalidate>

                <h3>Dirección de envío</h3>

                <label>
                    Nombre completo
                    <input id="shipName"
                        autocomplete="name"
                        value="${esc(profile)}">
                </label>

                <label>
                    Teléfono (10 dígitos)
                    <input id="shipPhone"
                        inputmode="numeric"
                        maxlength="10"
                        autocomplete="tel">
                </label>

                <label>
                    Calle y número
                    <input id="shipStreet"
                        autocomplete="address-line1">
                </label>

                <label>
                    Colonia
                    <input id="shipColony"
                        autocomplete="address-line2">
                </label>

                <div class="pay-row">

                    <label>
                        Código postal
                        <input id="shipZip"
                            inputmode="numeric"
                            maxlength="5"
                            autocomplete="postal-code">
                    </label>

                    <label>
                        Ciudad
                        <input id="shipCity"
                            autocomplete="address-level2">
                    </label>

                </div>

                <label>
                    Estado
                    <select id="shipState">
                        <option value="">Elige un estado</option>
                        ${STATES.map(s => `
                            <option>${s}</option>
                        `).join('')}
                    </select>
                </label>

                <label>
                    Referencias (opcional)
                    <input id="shipRefs"
                        placeholder="Entre qué calles, color de la casa…">
                </label>

                <h3>Método de pago</h3>

                <p class="notice">
                    Pago simulado. No escribas los datos de tu tarjeta real.
                    Puedes usar 4242 4242 4242 4242.
                </p>

                <label>
                    Nombre en la tarjeta
                    <input id="cardName" autocomplete="off">
                </label>

                <label>
                    Número de tarjeta
                    <input id="cardNumber"
                        inputmode="numeric"
                        maxlength="19"
                        placeholder="4242 4242 4242 4242"
                        autocomplete="off">
                </label>

                <div class="pay-row">

                    <label>
                        Vence (MM/AA)
                        <input id="cardExp"
                            inputmode="numeric"
                            maxlength="5"
                            placeholder="12/30"
                            autocomplete="off">
                    </label>

                    <label>
                        CVV
                        <input id="cardCvv"
                            inputmode="numeric"
                            maxlength="3"
                            placeholder="123"
                            autocomplete="off">
                    </label>

                </div>

                <p id="payError" class="pay-error" role="alert"></p>

                <button class="primary">
                    Pagar ${money(grandTotal())}
                </button>

            </form>
        `;

        const digits = (id, max) => {
            $(id).oninput = e => {
                e.target.value = e.target.value
                    .replace(/\D/g, '')
                    .slice(0, max);
            };
        };

        digits('#shipPhone', 10);
        digits('#shipZip', 5);
        digits('#cardCvv', 3);

        $('#cardNumber').oninput = e => {
            e.target.value = e.target.value
                .replace(/\D/g, '')
                .slice(0, 16)
                .replace(/(.{4})/g, '$1 ')
                .trim();
        };

        $('#cardExp').oninput = e => {
            let v = e.target.value.replace(/\D/g, '').slice(0, 4);
            e.target.value = v.length > 2
                ? v.slice(0, 2) + '/' + v.slice(2)
                : v;
        };

        $('#payForm').onsubmit = checkout;
    }

    if (!$('#cart').open) {
        $('#cart').showModal();
    }
}

function removeItem(i) {
    bag.splice(i, 1);
    save('bag', bag);
    update();
    showCart();
}

function checkout(e) {

    e.preventDefault();

    const error = $('#payError');

    const fail = (id, msg) => {
        error.textContent = msg;
        $(id).focus();
    };

    const ship = {
        name: $('#shipName').value.trim(),
        phone: $('#shipPhone').value,
        street: $('#shipStreet').value.trim(),
        colony: $('#shipColony').value.trim(),
        zip: $('#shipZip').value,
        city: $('#shipCity').value.trim(),
        state: $('#shipState').value,
        refs: $('#shipRefs').value.trim()
    };

    const cardName = $('#cardName').value.trim();
    const number = $('#cardNumber').value.replace(/\D/g, '');
    const [mm, yy] = $('#cardExp').value.split('/');
    const cvv = $('#cardCvv').value;

    const month = +mm;
    const year = 2000 + +yy;
    const now = new Date();

    /* VALIDAR ENVÍO */

    if (ship.name.length < 3)
        return fail('#shipName', 'Escribe tu nombre completo.');

    if (ship.phone.length !== 10)
        return fail('#shipPhone', 'El teléfono debe tener 10 dígitos.');

    if (ship.street.length < 3)
        return fail('#shipStreet', 'Escribe tu calle y número.');

    if (ship.colony.length < 2)
        return fail('#shipColony', 'Escribe tu colonia.');

    if (ship.zip.length !== 5)
        return fail('#shipZip', 'El código postal debe tener 5 dígitos.');

    if (ship.city.length < 2)
        return fail('#shipCity', 'Escribe tu ciudad.');

    if (!ship.state)
        return fail('#shipState', 'Elige tu estado.');

    /* VALIDAR TARJETA */

    if (cardName.length < 3)
        return fail('#cardName', 'Escribe el nombre que aparece en la tarjeta.');

    if (number.length !== 16)
        return fail('#cardNumber', 'El número de tarjeta debe tener 16 dígitos.');

    if (!month || month > 12 || !yy || yy.length !== 2)
        return fail('#cardExp', 'Escribe el vencimiento como MM/AA.');

    if (year < now.getFullYear()
        || (year === now.getFullYear() && month < now.getMonth() + 1))
        return fail('#cardExp', 'La tarjeta está vencida.');

    if (cvv.length !== 3)
        return fail('#cardCvv', 'El CVV debe tener 3 dígitos.');

    error.textContent = '';

    const brand = number[0] === '4' ? 'Visa'
        : number[0] === '5' ? 'Mastercard'
        : 'Tarjeta';

    const last4 = number.slice(-4);
    const total = grandTotal();
    const shipCost = shipping();
    const pointsEarned = Math.floor(subtotal() / 10);

    const orderId = 'GL-' + Math.floor(100000 + Math.random() * 900000);

    const button = $('#payForm button');
    button.disabled = true;
    button.textContent = 'Procesando pago…';

    setTimeout(() => {

        reward(pointsEarned);

        bag = [];

        save('bag', bag);
        update();

        $('#cartItems').innerHTML = `

            <h3>Pago simulado aprobado</h3>

            <p><b>Pedido ${orderId}</b></p>

            <p>
                ${esc(brand)} terminada en ${last4}<br>
                Total: ${money(total)}
                (envío ${shipCost ? money(shipCost) : 'gratis'})
            </p>

            <h3>Enviaremos a</h3>

            <p>
                ${esc(ship.name)}<br>
                ${esc(ship.street)}, ${esc(ship.colony)}<br>
                ${esc(ship.city)}, ${esc(ship.state)}, C.P. ${esc(ship.zip)}<br>
                Tel. ${esc(ship.phone)}
                ${ship.refs ? '<br>Ref.: ' + esc(ship.refs) : ''}
            </p>

            <p class="notice">
                Ganaste ${pointsEarned} puntos.
                No se realizó ningún cobro real y no se guardó
                ningún dato de tu tarjeta ni de tu dirección.
            </p>
        `;

    }, 1200);
}

$('#bag').onclick = showCart;

/* NAVEGACIÓN PRINCIPAL */

function render() {

    if (stream) {
        stream.getTracks().forEach(t => t.stop());
        stream = null;
    }

    let page = location.hash.slice(1) || 'inicio';

    document.querySelectorAll('nav a').forEach(a => {
        a.classList.toggle('active', a.hash === '#' + page);
    });

    filter = 'Todo';

    if (page === 'inicio') {

        app.innerHTML = `

            <section class="hero">

                <div class="cover-copy">

                    <span class="eyebrow">
                        México / Edición 01 — Belleza cotidiana
                    </span>

                    <h1>
                        La piel<br>es primero.
                    </h1>

                    <p class="script">
                        Beauty, in real life.
                    </p>

                    <p>
                        Una nueva forma de descubrir
                        tu belleza natural.
                    </p>

                    <a class="editor-link" href="#tienda">
                        Explorar colección ↗
                    </a>

                </div>

                <img src="editorial.jpg"
                    alt="Revistas editoriales de Glossier">

            </section>

            <div class="issue-line">
                <span>THE BEAUTY EDIT</span>
                <span>01 / LOS ESENCIALES</span>
                <span>GLOSSIER MX</span>
            </div>

            <div class="section-heading">

                <h2>Los favoritos.</h2>

                <a href="#tienda">
                    Ver todos ↗
                </a>

            </div>

            ${cards()}

            <section class="feature">

                <img src="archive.jpg"
                    alt="Archivo editorial de belleza y moda">

                <div class="panel">

                    <span class="eyebrow">
                        02 / El estudio de color
                    </span>

                    <p class="script">
                        Made for you.
                    </p>

                    <h2>
                        Tu tono.<br>
                        Tu manera.
                    </h2>

                    <p>
                        Descubre el color que va contigo
                        con nuestro probador virtual.
                    </p>

                    <a class="editor-link" href="#probador">
                        Entrar al estudio ↗
                    </a>

                </div>

            </section>

            <section class="issue-bottom">

                <div>

                    <span class="eyebrow">
                        03 / The community
                    </span>

                    <h2>La belleza se comparte.</h2>

                    <a class="editor-link" href="#comunidad">
                        Leer y compartir reseñas ↗
                    </a>

                </div>

                <div>

                    <span class="eyebrow">
                        04 / The club
                    </span>

                    <h2>Pequeños privilegios.</h2>

                    <a class="editor-link" href="#recompensas">
                        Mis recompensas ↗
                    </a>

                </div>

            </section>
        `;

    /* TIENDA */

    } else if (page === 'tienda') {

        app.innerHTML = `

            <p class="script">
                Your everyday essentials
            </p>

            <h2>Tienda</h2>

            <div class="tabs">

                ${['Todo', 'Labios', 'Mejillas', 'Cejas']
                    .map(c => `
                        <button onclick="
                            filter='${c}';
                            $('#catalog').innerHTML=cards()
                        ">
                            ${c}
                        </button>
                    `).join('')}

            </div>

            <div id="catalog">
                ${cards()}
            </div>
        `;

    /* PROBADOR VIRTUAL */

    } else if (page === 'probador') {

        app.innerHTML = `

            <p class="script">Made for you</p>

            <h2>Probador virtual</h2>

            <div class="split">

                <div>

                    <canvas id="face"
                        width="480"
                        height="480">
                    </canvas>

                    <video id="video" hidden playsinline>
                    </video>

                    <p class="muted">
                        Tu foto se procesa únicamente
                        en esta página.
                    </p>

                </div>

                <div class="panel">

                    <h3>Encuentra tu tono</h3>

                    <input
                        id="photo"
                        type="file"
                        accept="image/*">

                    <button id="camera">
                        Usar cámara
                    </button>

                    <button id="capture">
                        Capturar
                    </button>

                    <label>
                        Zona

                        <select id="zone">
                            <option value="lips">Labios</option>
                            <option value="cheek">Mejillas</option>
                        </select>
                    </label>

                    <label>
                        Color

                        <input type="color"
                            id="color"
                            value="#c76c83">
                    </label>

                    <label>
                        Intensidad

                        <input type="range"
                            id="opacity"
                            min="0"
                            max="100"
                            value="40">
                    </label>

                    <p>
                        Haz clic sobre la foto para colocar
                        el color en la zona deseada.
                    </p>

                    <p class="notice">
                        Simulación manual de color;
                        no es un sistema AR/IA validado.
                    </p>

                    <p id="status"></p>

                </div>

            </div>
        `;

        setupTry();

    /* COMUNIDAD */

    } else if (page === 'comunidad') {

        app.innerHTML = `

            <p class="script">Better together</p>

            <h2>Comunidad</h2>

            <div class="split">

                <form class="panel" id="reviewForm">

                    <h3>Comparte tu experiencia</h3>

                    <select id="reviewProduct">

                        ${products.map(p => `
                            <option>${p.name}</option>
                        `).join('')}

                    </select>

                    <select id="stars">

                        ${[5, 4, 3, 2, 1].map(n => `
                            <option value="${n}">
                                ${'★'.repeat(n)}
                            </option>
                        `).join('')}

                    </select>

                    <textarea
                        id="reviewText"
                        required
                        placeholder="¿Qué te pareció?">
                    </textarea>

                    <button class="primary">
                        Publicar · +20 puntos
                    </button>

                </form>

                <div id="reviews">

                    ${reviews.length
                        ? reviews.map(r => `
                            <div class="panel">

                                <b>${esc(r.name)}</b>
                                · ${esc(r.product)}

                                <p>${'★'.repeat(r.stars)}</p>

                                <p>${esc(r.text)}</p>

                            </div>
                        `).join('')
                        : `<div class="panel pink">
                            Sé la primera en compartir una reseña.
                           </div>`
                    }

                </div>

            </div>
        `;

        $('#reviewForm').onsubmit = e => {

            e.preventDefault();

            reviews.unshift({
                name: profile,
                product: $('#reviewProduct').value,
                stars: +$('#stars').value,
                text: $('#reviewText').value
            });

            save('reviews', reviews);
            reward(20);
            render();
        };

    /* RECOMPENSAS */

    } else if (page === 'recompensas') {

        app.innerHTML = `

            <p class="script">
                Little things, big love
            </p>

            <h2>Glossier Rewards</h2>

            <div class="panel pink">

                <p class="eyebrow">Tus puntos</p>

                <p class="points">${points}</p>

                <p>
                    Gana puntos con compras y reseñas.
                </p>

                <progress
                    max="100"
                    value="${Math.min(points, 100)}">
                </progress>

                <p>
                    ${Math.max(0, 100 - points)}
                    puntos para tu siguiente beneficio.
                </p>

                <button onclick="redeem()"
                    ${points < 100 ? 'disabled' : ''}>

                    Canjear 100 puntos

                </button>

            </div>

            <div class="panel">

                <h3>Invita a una amiga</h3>

                <button onclick="invite()">
                    Copiar invitación
                </button>

                <p id="inviteStatus"></p>

            </div>
        `;

    /* PERFIL */

    } else if (page === 'perfil') {

        app.innerHTML = `

            <p class="script">
                Hello, ${esc(profile)}
            </p>

            <h2>Mi perfil</h2>

            <form id="profileForm" class="panel">

                <label>

                    Nombre

                    <input
                        id="name"
                        required
                        value="${esc(profile)}">

                </label>

                <button>Guardar</button>

            </form>

            <h2>Mis favoritos</h2>

            <div class="grid">

                ${products
                    .filter(p => favorites.includes(p.id))
                    .map(p => `
                        <div class="product">

                            <img
                                src="${p.id}.jpg"
                                alt="${p.name}">

                            ${p.name}

                        </div>
                    `).join('')
                    || 'Aún no tienes favoritos.'
                }

            </div>
        `;

        $('#profileForm').onsubmit = e => {

            e.preventDefault();

            profile = $('#name').value;

            save('profile', profile);

            render();
        };

    } else {

        location.hash = 'inicio';
    }

    window.scrollTo(0, 0);
}

/* CANJE DE PUNTOS */

function redeem() {

    if (points >= 100) {

        reward(-100);

        render();

        alert('Beneficio de demostración canjeado.');
    }
}

/* INVITACIONES */

async function invite() {

    try {

        await navigator.clipboard.writeText(
            'Descubre Glossier MX conmigo: '
            + location.href.split('#')[0]
        );

        $('#inviteStatus').textContent =
            'Invitación copiada.';

    } catch {

        $('#inviteStatus').textContent =
            'Comparte la dirección de esta página.';
    }
}

/* SIMULADOR DE MAQUILLAJE */

function setupTry() {

    let canvas = $('#face');
    let ctx = canvas.getContext('2d');
    let img = null;

    let pos = {
        x: 240,
        y: 300
    };

    function draw() {

        ctx.fillStyle = '#f3e2e9';
        ctx.fillRect(0, 0, 480, 480);

        if (!img) {

            ctx.fillStyle = '#79586a';
            ctx.font = '18px Arial';
            ctx.textAlign = 'center';

            ctx.fillText(
                'Sube una foto o captura una imagen',
                240,
                240
            );

            return;
        }

        let w = img.videoWidth || img.width;
        let h = img.videoHeight || img.height;

        let s = Math.min(480 / w, 480 / h);

        ctx.drawImage(
            img,
            (480 - w * s) / 2,
            (480 - h * s) / 2,
            w * s,
            h * s
        );

        ctx.globalAlpha = +$('#opacity').value / 100;

        ctx.fillStyle = $('#color').value;

        ctx.globalCompositeOperation = 'multiply';

        ctx.beginPath();

        ctx.ellipse(
            pos.x,
            pos.y,
            $('#zone').value === 'lips' ? 36 : 45,
            $('#zone').value === 'lips' ? 13 : 30,
            0,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
    }

    draw();

    /* CARGAR FOTO */

    $('#photo').onchange = e => {

        let f = e.target.files[0];

        if (!f) return;

        let url = URL.createObjectURL(f);
        let i = new Image();

        i.onload = () => {

            img = i;

            draw();

            URL.revokeObjectURL(url);
        };

        i.src = url;
    };

    /* COLOCAR MAQUILLAJE */

    canvas.onclick = e => {

        let r = canvas.getBoundingClientRect();

        pos = {
            x: (e.clientX - r.left) * 480 / r.width,
            y: (e.clientY - r.top) * 480 / r.height
        };

        draw();
    };

    ['color', 'opacity', 'zone'].forEach(id => {
        $('#' + id).oninput = draw;
    });

    /* ACTIVAR CÁMARA */

    $('#camera').onclick = async () => {

        try {

            if (stream) {
                stream.getTracks().forEach(t => t.stop());
            }

            stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'user'
                },
                audio: false
            });

            let v = $('#video');

            v.srcObject = stream;
            v.hidden = false;
            v.style.width = '100%';

            await v.play();

            $('#status').textContent = 'Cámara lista.';

        } catch {

            $('#status').textContent =
                'Cámara no disponible. Usa una foto o abre desde localhost.';
        }
    };

    /* CAPTURAR FOTOGRAFÍA */

    $('#capture').onclick = () => {

        let v = $('#video');

        if (!v.videoWidth) return;

        let c = document.createElement('canvas');

        c.width = v.videoWidth;
        c.height = v.videoHeight;

        c.getContext('2d').drawImage(v, 0, 0);

        img = c;

        draw();

        stream?.getTracks().forEach(t => t.stop());

        stream = null;
        v.hidden = true;
    };
}

/* INICIAR APLICACIÓN */

window.addEventListener('hashchange', render);

update();
render();
