"use strict";
const root = document.querySelector('#app'), notice = document.querySelector('#notice'), eqDialog = document.querySelector('#eqDialog'), resDialog = document.querySelector('#resDialog');
let view = 'equipos';
const esc = (x) => String(x ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
async function api(url, opts = {}) {
    const r = await fetch(url, { ...opts, headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) } }), data = await r.json(); if (!r.ok)
        throw Error(data.error || 'Ocurrió un error'); return data;
}
function say(s, error = false) { notice.textContent = s; notice.className = error ? 'error' : ''; notice.hidden = false; setTimeout(() => notice.hidden = true, 5000); }
function nav() { document.querySelectorAll('.nav').forEach(b => b.classList.toggle('active', b.dataset.view === view)); }
async function equipment() {
    view = 'equipos';
    nav();
    root.innerHTML = `<section class="panel"><div class="heading"><div><h1>Listado de equipos</h1><p>Consulta y administra el equipo disponible.</p></div><button class="btn dark" id="add">Nuevo equipo</button></div><form class="filters" id="filters"><input name="q" placeholder="Buscar equipo" value="${esc(new URLSearchParams(location.search).get('q') || '')}"><select name="tipo"><option value="">Todos los tipos</option>${['Laptop', 'Proyector', 'Tablet', 'Cámara', 'Laboratorio'].map(t => `<option>${t}</option>`).join('')}</select><button class="btn pale">Filtrar</button></form><div class="table-wrap"><table><thead><tr><th>#</th><th>Código</th><th>Nombre</th><th>Tipo</th><th>Ubicación</th><th>Estado</th><th>Acción</th></tr></thead><tbody id="rows"><tr><td colspan="7" class="empty">Cargando…</td></tr></tbody></table></div><div class="foot" id="count"></div></section>`;
    const form = document.querySelector('#filters'), params = new URLSearchParams(location.search);
    form.elements.namedItem('tipo').value = params.get('tipo') || '';
    form.onsubmit = e => {
        e.preventDefault(); const d = new FormData(form), p = new URLSearchParams(); if (d.get('q'))
            p.set('q', String(d.get('q'))); if (d.get('tipo'))
            p.set('tipo', String(d.get('tipo'))); history.replaceState(null, '', `?${p}`); void equipment();
    };
    document.querySelector('#add').addEventListener('click', () => void edit());
    try {
        const list = await api(`/api/equipos?${params}`), tbody = document.querySelector('#rows');
        tbody.innerHTML = list.length ? list.map((e, i) => `<tr><td>${i + 1}</td><td><b>${esc(e.codigo)}</b></td><td>${esc(e.nombre)}</td><td>${esc(e.tipo)}</td><td>${esc(e.ubicacion)}</td><td><span class="badge ${e.estado === 'Mantenimiento' ? 'maintenance' : ''}">${esc(e.estado)}</span></td><td><div class="row-actions"><button class="action" data-edit="${e.id}">Editar</button>${e.estado === 'Disponible' ? `<button class="action" data-res="${e.id}">Reservar</button>` : ''}<button class="link" data-state="${e.id}" data-next="${e.estado === 'Disponible' ? 'Mantenimiento' : 'Disponible'}">${e.estado === 'Disponible' ? 'Mantenimiento' : 'Habilitar'}</button></div></td></tr>`).join('') : '<tr><td colspan="7" class="empty">No se encontraron equipos.</td></tr>';
        document.querySelector('#count').textContent = `${list.length} equipo(s)`;
        tbody.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => void edit(Number(b.dataset.edit)));
        tbody.querySelectorAll('[data-res]').forEach(b => b.onclick = () => void reserve(Number(b.dataset.res)));
        tbody.querySelectorAll('[data-state]').forEach(b => b.onclick = async () => {
            try {
                await api(`/api/equipos/${b.dataset.state}/estado`, { method: 'PATCH', body: JSON.stringify({ estado: b.dataset.next }) });
                say('Estado actualizado.');
                void equipment();
            }
            catch (e) {
                say(e.message, true);
            }
        });
    }
    catch (e) {
        say(e.message, true);
    }
}
async function edit(id) {
    const f = document.querySelector('#eqForm'); f.reset(); f.elements.namedItem('id').value = ''; document.querySelector('#eqTitle').textContent = id ? 'Editar equipo' : 'Nuevo equipo'; if (id) {
        try {
            const item = await api(`/api/equipos/${id}`);
            for (const [k, v] of Object.entries(item)) {
                const input = f.elements.namedItem(k);
                if (input)
                    input.value = String(v ?? '');
            }
        }
        catch (e) {
            say(e.message, true);
            return;
        }
    } eqDialog.showModal();
}
async function reserve(id) {
    const f = document.querySelector('#resForm'); f.reset(); try {
        const all = await api('/api/equipos'), sel = f.elements.namedItem('equipo_id');
        sel.innerHTML = '<option value="">Selecciona un equipo</option>' + all.filter(x => x.estado === 'Disponible').map(x => `<option value="${x.id}">${esc(x.codigo)} · ${esc(x.nombre)} · ${esc(x.tipo)}</option>`).join('');
        if (id)
            sel.value = String(id);
        f.elements.namedItem('fecha').min = new Date().toLocaleDateString('en-CA');
        resDialog.showModal();
    }
        catch (e) {
            say(e.message, true);
        }
}
async function reservations() {
    view = 'reservas'; nav(); root.innerHTML = `<section class="panel"><div class="heading"><div><h1>Reservas registradas</h1><p>Solicitudes de uso de equipos.</p></div><button class="btn dark" id="addRes">Nueva reserva</button></div><div class="table-wrap"><table><thead><tr><th>Equipo</th><th>Solicitante</th><th>Carné</th><th>Fecha</th><th>Horario</th><th>Motivo</th></tr></thead><tbody id="resRows"><tr><td colspan="6" class="empty">Cargando…</td></tr></tbody></table></div></section>`; document.querySelector('#addRes').addEventListener('click', () => void reserve()); try {
        const list = await api('/api/reservas');
        document.querySelector('#resRows').innerHTML = list.length ? list.map(r => `<tr><td><b>${esc(r.codigo)}</b><div>${esc(r.equipo_nombre)}</div></td><td>${esc(r.nombre)}</td><td>${esc(r.carne)}</td><td>${new Date(`${r.fecha.slice(0, 10)}T12:00:00`).toLocaleDateString('es-GT')}</td><td>${esc(r.hora_inicio.slice(0, 5))} – ${esc(r.hora_fin.slice(0, 5))}</td><td>${esc(r.motivo || '—')}</td></tr>`).join('') : '<tr><td colspan="6" class="empty">Todavía no hay reservas.</td></tr>';
    }
        catch (e) {
            say(e.message, true);
        }
}
document.querySelectorAll('.nav').forEach(b => b.onclick = () => { history.replaceState(null, '', location.pathname); b.dataset.view === 'reservas' ? void reservations() : void equipment(); });
document.querySelectorAll('[data-close]').forEach(b => b.onclick = () => { eqDialog.close(); resDialog.close(); });
eqDialog.addEventListener('click', e => {
    if (e.target === eqDialog)
        eqDialog.close();
});
resDialog.addEventListener('click', e => {
    if (e.target === resDialog)
        resDialog.close();
});
document.querySelector('#eqForm').onsubmit = async (e) => {
    e.preventDefault(); const f = e.currentTarget, d = Object.fromEntries(new FormData(f).entries()), id = String(d.id || ''); delete d.id; try {
        await api(id ? `/api/equipos/${id}` : '/api/equipos', { method: id ? 'PUT' : 'POST', body: JSON.stringify(d) });
        eqDialog.close();
        say('Equipo guardado correctamente.');
        void equipment();
    }
        catch (x) {
            say(x.message, true);
        }
};
document.querySelector('#resForm').onsubmit = async (e) => {
    e.preventDefault(); const d = Object.fromEntries(new FormData(e.currentTarget).entries()); try {
        const r = await api('/api/reservas', { method: 'POST', body: JSON.stringify(d) });
        resDialog.close();
        say(r.message);
        void reservations();
    }
        catch (x) {
            say(x.message, true);
        }
};
void equipment();
