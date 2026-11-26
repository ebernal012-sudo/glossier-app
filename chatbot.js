(() => {
    const $ = (id) => document.getElementById(id);

    const toggle = $("chatToggle");
    const panel = $("chatPanel");
    const log = $("chatLog");
    const chips = $("chatChips");
    const input = $("chatInput");


    const RESPUESTAS = [
        {
            claves: ["envio", "envío", "entrega", "llega", "paqueteria", "paquetería"],
            texto: "Enviamos a todo México. Las entregas tardan de 2 a 5 días hábiles. El envío es gratis en compras desde $999 MXN."
        },
        {
            claves: ["devol", "cambio", "reembolso", "garantia", "garantía"],
            texto: "Puedes pedir una devolución dentro de los 30 días posteriores a tu compra, con el producto sin abrir."
        },
        {
            claves: ["probador", "tono", "color", "maquillaje", "base"],
            texto: "En la sección Probador puedes ver cómo se ve cada tono antes de comprarlo. Ve a Probador en el menú."
        },
        {
            claves: ["recompensa", "punto", "descuento", "cupon", "cupón"],
            texto: "En Recompensas acumulas puntos con cada compra y los canjeas por descuentos y productos."
        },
        {
            claves: ["pago", "tarjeta", "oxxo", "paypal", "meses"],
            texto: "Aceptamos tarjeta de crédito y débito, PayPal y pago en OXXO."
        },
        {
            claves: ["producto", "tienda", "comprar", "precio", "catalogo", "catálogo"],
            texto: "Puedes ver todos los productos en Tienda. Agrega los que quieras a tu bolsa y paga desde ahí."
        },
        {
            claves: ["hola", "buenas", "hey", "buen dia", "buen día"],
            texto: "¡Hola! ¿En qué te puedo ayudar hoy?"
        },
        {
            claves: ["gracias"],
            texto: "¡Con gusto! Si necesitas algo más, aquí estoy."
        }
    ];

    const POR_DEFECTO = "No estoy segura de eso. Prueba con una de las opciones de abajo o escribe 'envíos', 'devoluciones' o 'pagos'.";

    const SUGERENCIAS = ["Envíos", "Devoluciones", "Formas de pago", "Recompensas", "Probador"];

    const normalizar = (s) =>
        s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    function responder(texto) {
        const t = normalizar(texto);
        const hit = RESPUESTAS.find((r) =>
            r.claves.some((c) => t.includes(normalizar(c)))
        );
        return hit ? hit.texto : POR_DEFECTO;
    }

    function agregar(rol, texto) {
        const el = document.createElement("div");
        el.className = `msg ${rol}`;
        el.textContent = texto;
        log.appendChild(el);
        log.scrollTop = log.scrollHeight;
        return el;
    }

    function enviar(texto) {
        texto = texto.trim();
        if (!texto) return;

        agregar("user", texto);
        input.value = "";

        const escribiendo = agregar("bot typing", "Escribiendo…");
        setTimeout(() => {
            escribiendo.remove();
            agregar("bot", responder(texto));
        }, 500);
    }

    function abrir(estado) {
        panel.hidden = !estado;
        toggle.setAttribute("aria-expanded", String(estado));
        if (estado) {
            if (!log.children.length) {
                agregar("bot", "¡Hola! Soy el asistente de Glossier MX. Pregúntame sobre envíos, pagos, devoluciones o productos.");
            }
            input.focus();
        } else {
            toggle.focus();
        }
    }

    SUGERENCIAS.forEach((s) => {
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = s;
        b.addEventListener("click", () => enviar(s));
        chips.appendChild(b);
    });

    toggle.addEventListener("click", () => abrir(panel.hidden));
    $("chatClose").addEventListener("click", () => abrir(false));
    $("chatSend").addEventListener("click", () => enviar(input.value));
    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") enviar(input.value);
    });
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !panel.hidden) abrir(false);
    });
})();