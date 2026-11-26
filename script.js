const $ = s => document.querySelector(s);
const app = $('#app');

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

                    <img src="img/${p.id}.jpg" alt="${p.name}">

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

function showCart() {

    $('#cartItems').innerHTML = bag.map((x, i) => {

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

    }).join('') + `

        <h3>
            Total: ${money(
                bag.reduce(
                    (s, x) => s + products.find(
                        p => p.id === x.id
                    ).price, 0
                )
            )}
        </h3>

        ${bag.length
            ? '<button class="primary" onclick="checkout()">Simular compra</button>'
            : 'Tu bolsa está vacía.'
        }
    `;

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

function checkout() {

    const total = bag.reduce(
        (s, x) => s + products.find(
            p => p.id === x.id
        ).price, 0
    );

    reward(Math.floor(total / 10));

    bag = [];

    save('bag', bag);
    update();

    $('#cartItems').textContent =
        'Compra simulada. Tus puntos se han actualizado. No se realizó ningún cobro.';
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

                <img src="img/editorial.jpg"
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

                <img src="img/archive.jpg"
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
                    Gana puntos con compras y reseñas !.
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
                                src="img/${p.id}.jpg"
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