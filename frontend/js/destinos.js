
// ==============================================
// MAPA E CADASTRO DE PONTOS TURÍSTICOS
// BEYOND BORDERS
// ==============================================

const API_IBGE = 'https://servicodados.ibge.gov.br/api/v1/localidades';
const CHAVE_PONTOS = 'pontosTuristicos';

// Categorias disponíveis
const CATEGORIAS = [
    'Praia',
    'Museu',
    'Parque',
    'Gastronomia'
];

// Elementos do formulário
const caixaCadastro = document.getElementById('caixaCadastroPonto');
const formCadastro = document.getElementById('formCadastroPonto');
const nomePontoInput = document.getElementById('nomePonto');
const descricaoPontoInput = document.getElementById('descricaoPonto');
const categoriaPontoSelect = document.getElementById('categoriaPonto');
const fotoPontoInput = document.getElementById('fotoPonto');
const previewFotoPonto = document.getElementById('previewFotoPonto');
const ufPontoSelect = document.getElementById('ufPonto');
const cidadePontoSelect = document.getElementById('cidadePonto');
const mensagemCadastro = document.getElementById('mensagemCadastroPonto');
const avisoCoordenadas = document.getElementById('avisoCoordenadasPonto');
const secaoPontos = document.getElementById('secaoPontosCadastrados');
const listaPontos = document.getElementById('listaPontosCadastrados');

// Elementos do filtro
const botoesCategoria = document.querySelectorAll('.botao-categoria');
const resultadoFiltro = document.getElementById('resultadoFiltro');

let localizacaoSelecionada = null;
let marcadorSelecao = null;
let fotoEmBase64 = '';
let categoriaAtiva = 'todos';

// Cada marcador fica associado ao ID do seu ponto
const marcadoresSalvos = [];

// ==============================================
// USUÁRIO LOGADO
// ==============================================

function obterUsuarioLogado() {

    try {

        return JSON.parse(
            sessionStorage.getItem('usuarioLogado') || 'null'
        );

    } catch (erro) {

        return null;

    }

}

// ==============================================
// MAPA
// ==============================================

const mapa = L.map('mapa').setView([-14.235, -51.9253], 4);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(mapa);


// Clique no mapa: marca o local e oferece a opção de cadastrar.

mapa.on('click', function(evento) {

    localizacaoSelecionada = {
        latitude: Number(evento.latlng.lat.toFixed(6)),
        longitude: Number(evento.latlng.lng.toFixed(6))
    };

    if (marcadorSelecao) {
        mapa.removeLayer(marcadorSelecao);
    }

    marcadorSelecao = L.marker([
        localizacaoSelecionada.latitude,
        localizacaoSelecionada.longitude
    ]).addTo(mapa);

    const conteudoPopup = document.createElement('div');

    conteudoPopup.className = 'popup-cadastro-ponto';

    const textoPopup = document.createElement('p');

    textoPopup.textContent = 'Localização selecionada!';

    const botaoCadastro = document.createElement('button');

    botaoCadastro.type = 'button';
    botaoCadastro.className = 'botao-popup-cadastrar';
    botaoCadastro.textContent = 'Cadastrar ponto turístico aqui';

    botaoCadastro.addEventListener('click', abrirFormularioPonto);

    conteudoPopup.appendChild(textoPopup);
    conteudoPopup.appendChild(botaoCadastro);

    marcadorSelecao
        .bindPopup(conteudoPopup)
        .openPopup();

    document.getElementById('latitude').textContent =
        'Latitude: ' + localizacaoSelecionada.latitude.toFixed(6);

    document.getElementById('longitude').textContent =
        'Longitude: ' + localizacaoSelecionada.longitude.toFixed(6);

});


// ==============================================
// ABRIR / FECHAR FORMULÁRIO
// ==============================================

function abrirFormularioPonto() {

    const usuario = obterUsuarioLogado();

    if (!usuario) {

        mensagemCadastro.textContent =
            'Entre na sua conta para cadastrar um ponto turístico.';

        mensagemCadastro.className = 'mensagem-ponto-erro';

        caixaCadastro.hidden = false;

        caixaCadastro.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });

        return;
    }

    if (!localizacaoSelecionada) return;

    avisoCoordenadas.textContent =
        `Local escolhido: ${localizacaoSelecionada.latitude}, ${localizacaoSelecionada.longitude}`;

    mensagemCadastro.textContent = '';
    mensagemCadastro.className = '';

    caixaCadastro.hidden = false;

    caixaCadastro.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });

    nomePontoInput.focus();

}


function fecharFormularioPonto() {

    caixaCadastro.hidden = true;

    mensagemCadastro.textContent = '';
    mensagemCadastro.className = '';

}


document.getElementById('fecharCadastroPonto')
    .addEventListener('click', fecharFormularioPonto);


// ==============================================
// LISTAS DE ESTADOS E CIDADES - API DO IBGE
// ==============================================

async function carregarEstados() {

    try {

        const resposta = await fetch(
            `${API_IBGE}/estados?orderBy=nome`
        );

        if (!resposta.ok) {
            throw new Error('Não foi possível buscar os estados.');
        }

        const estados = await resposta.json();

        ufPontoSelect.innerHTML =
            '<option value="">Selecione um estado</option>';

        estados.forEach(function(estado) {

            const opcao = document.createElement('option');

            opcao.value = estado.id;

            opcao.textContent =
                `${estado.nome} (${estado.sigla})`;

            opcao.dataset.sigla = estado.sigla;
            opcao.dataset.nome = estado.nome;

            ufPontoSelect.appendChild(opcao);

        });

    } catch (erro) {

        ufPontoSelect.innerHTML =
            '<option value="">Erro ao carregar estados</option>';

        mensagemCadastro.textContent =
            'Não foi possível carregar os estados do IBGE. Verifique sua conexão.';

        mensagemCadastro.className = 'mensagem-ponto-erro';

    }

}


// Carregar cidades de acordo com o estado escolhido.

ufPontoSelect.addEventListener('change', async function() {

    const idEstado = ufPontoSelect.value;

    cidadePontoSelect.disabled = true;

    if (!idEstado) {

        cidadePontoSelect.innerHTML =
            '<option value="">Selecione primeiro a UF</option>';

        return;

    }

    cidadePontoSelect.innerHTML =
        '<option value="">Carregando cidades...</option>';

    try {

        const resposta = await fetch(
            `${API_IBGE}/estados/${idEstado}/municipios?orderBy=nome`
        );

        if (!resposta.ok) {
            throw new Error('Não foi possível buscar as cidades.');
        }

        const cidades = await resposta.json();

        cidadePontoSelect.innerHTML =
            '<option value="">Selecione uma cidade</option>';

        cidades.forEach(function(cidade) {

            const opcao = document.createElement('option');

             opcao.value = cidade.nome;
             opcao.textContent = cidade.nome;

            // Guardar o código oficial do município no IBGE.
            opcao.dataset.codigoIbge = cidade.id;

            cidadePontoSelect.appendChild(opcao);

        });

        cidadePontoSelect.disabled = false;

    } catch (erro) {

        cidadePontoSelect.innerHTML =
            '<option value="">Erro ao carregar cidades</option>';

        mensagemCadastro.textContent =
            'Não foi possível carregar as cidades dessa UF.';

        mensagemCadastro.className = 'mensagem-ponto-erro';

    }

});


// ==============================================
// FOTO OPCIONAL E REDIMENSIONADA
// ==============================================

function redimensionarFoto(arquivo) {

    return new Promise(function(resolve, reject) {

        const leitor = new FileReader();

        leitor.onerror = function() {
            reject(new Error('Não foi possível ler a foto selecionada.'));
        };

        leitor.onload = function() {

            const imagem = new Image();

            imagem.onerror = function() {
                reject(new Error('O arquivo selecionado não é uma imagem válida.'));
            };

            imagem.onload = function() {

                const limite = 1000;

                const escala = Math.min(
                    1,
                    limite / Math.max(imagem.width, imagem.height)
                );

                const canvas = document.createElement('canvas');

                canvas.width = Math.round(imagem.width * escala);
                canvas.height = Math.round(imagem.height * escala);

                const contexto = canvas.getContext('2d');

                contexto.drawImage(
                    imagem,
                    0,
                    0,
                    canvas.width,
                    canvas.height
                );

                resolve(
                    canvas.toDataURL('image/jpeg', 0.75)
                );

            };

            imagem.src = leitor.result;

        };

        leitor.readAsDataURL(arquivo);

    });

}


// Pré-visualização da foto.

fotoPontoInput.addEventListener('change', async function() {

    const arquivo = fotoPontoInput.files[0];

    fotoEmBase64 = '';

    previewFotoPonto.hidden = true;

    if (!arquivo) return;

    if (!arquivo.type.startsWith('image/')) {

        mensagemCadastro.textContent =
            'Selecione um arquivo de imagem.';

        mensagemCadastro.className = 'mensagem-ponto-erro';

        fotoPontoInput.value = '';

        return;

    }

    try {

        fotoEmBase64 = await redimensionarFoto(arquivo);

        previewFotoPonto.src = fotoEmBase64;

        previewFotoPonto.hidden = false;

        mensagemCadastro.textContent = '';
        mensagemCadastro.className = '';

    } catch (erro) {

        mensagemCadastro.textContent = erro.message;

        mensagemCadastro.className = 'mensagem-ponto-erro';

    }

});


// ==============================================
// PONTOS SALVOS NO NAVEGADOR
// ==============================================

function obterPontosSalvos() {

    try {

        const pontos = JSON.parse(
            localStorage.getItem(CHAVE_PONTOS) || '[]'
        );

        return Array.isArray(pontos) ? pontos : [];

    } catch (erro) {

        return [];

    }

}


// ==============================================
// FILTRO DE CATEGORIAS
// ==============================================

function pontoCorrespondeAoFiltro(ponto) {

    if (categoriaAtiva === 'todos') {
        return true;
    }

    if (categoriaAtiva === 'sem-categoria') {
        return !ponto.categoria ||
            !CATEGORIAS.includes(ponto.categoria);
    }

    return ponto.categoria === categoriaAtiva;

}


// Aplicar filtro aos marcadores e à lista.

function aplicarFiltroCategorias() {

    const pontos = obterPontosSalvos();

    const pontosFiltrados = pontos.filter(
        pontoCorrespondeAoFiltro
    );

    // Mostrar ou esconder os marcadores do mapa.

    marcadoresSalvos.forEach(function(registro) {

        const ponto = pontos.find(function(item) {
            return String(item.id) === String(registro.id);
        });

        if (!ponto) return;

        const deveMostrar = pontoCorrespondeAoFiltro(ponto);

        if (deveMostrar) {

            if (!mapa.hasLayer(registro.marcador)) {
                registro.marcador.addTo(mapa);
            }

        } else {

            if (mapa.hasLayer(registro.marcador)) {
                mapa.removeLayer(registro.marcador);
            }

        }

    });

    // Atualizar quantidade de resultados.

    if (categoriaAtiva === 'todos') {

        resultadoFiltro.textContent =
            `Exibindo todos os ${pontosFiltrados.length} pontos turísticos.`;

    } else {

        resultadoFiltro.textContent =
            `${pontosFiltrados.length} ponto(s) encontrado(s).`;

    }

    // Atualizar a lista.

    atualizarListaPontos();

}


// Clique nos botões das categorias.

botoesCategoria.forEach(function(botao) {

    botao.addEventListener('click', function() {

        categoriaAtiva = botao.dataset.categoria;

        // Remover destaque de todos os botões.

        botoesCategoria.forEach(function(outroBotao) {
            outroBotao.classList.remove('ativo');
        });

        // Destacar categoria selecionada.

        botao.classList.add('ativo');

        aplicarFiltroCategorias();

    });

});


// ==============================================
// CRIAR MARCADOR PARA CADA PONTO
// ==============================================

function adicionarMarcadorPonto(ponto) {

    const marcadorPonto = L.marker([
        ponto.latitude,
        ponto.longitude
    ]);

    const conteudo = document.createElement('div');

    conteudo.className = 'popup-ponto-salvo';

    const titulo = document.createElement('strong');

    titulo.textContent = ponto.nome;

    conteudo.appendChild(titulo);

    if (ponto.categoria) {

        const categoria = document.createElement('span');

        categoria.className = 'categoria-popup-ponto';

        categoria.textContent = ponto.categoria;

        conteudo.appendChild(categoria);

    }

    if (ponto.foto) {

        const imagem = document.createElement('img');

        imagem.src = ponto.foto;

        imagem.alt = `Foto de ${ponto.nome}`;

        imagem.className = 'imagem-popup-ponto';

        conteudo.appendChild(imagem);

    }

    if (ponto.descricao) {

        const descricao = document.createElement('p');

        descricao.textContent = ponto.descricao;

        conteudo.appendChild(descricao);

    }

    const local = [
        ponto.cidade,
        ponto.uf
    ].filter(Boolean).join(' - ');

    if (local) {

        const localTexto = document.createElement('small');

        localTexto.textContent = local;

        conteudo.appendChild(localTexto);

    }

    marcadorPonto.bindPopup(conteudo);

    marcadoresSalvos.push({
        id: ponto.id,
        marcador: marcadorPonto
    });

}


// ==============================================
// LISTA DE PONTOS CADASTRADOS
// ==============================================

function atualizarListaPontos() {

    const pontos = obterPontosSalvos()
        .filter(pontoCorrespondeAoFiltro);

    listaPontos.innerHTML = '';

    secaoPontos.hidden = pontos.length === 0;

    pontos.forEach(function(ponto) {

        const item = document.createElement('article');

        item.className = 'item-ponto-cadastrado';

        const nome = document.createElement('strong');

        nome.textContent = ponto.nome;

        item.appendChild(nome);

        // Categoria do ponto.

        if (ponto.categoria) {

            const categoria = document.createElement('span');

            categoria.textContent = 'Categoria: ' + ponto.categoria;

            item.appendChild(categoria);

        } else {

            const categoria = document.createElement('span');

            categoria.textContent = 'Sem categoria';

            item.appendChild(categoria);

        }

        const local = [
            ponto.cidade,
            ponto.uf
        ].filter(Boolean).join(' - ');

        if (local) {

            const localTexto = document.createElement('span');

            localTexto.textContent = local;

            item.appendChild(localTexto);

        }

        const botaoVer = document.createElement('button');

        botaoVer.type = 'button';

        botaoVer.textContent = 'Ver no mapa';

        botaoVer.addEventListener('click', function() {

            mapa.setView([
                ponto.latitude,
                ponto.longitude
            ], 13);

            const marcadorCorrespondente = marcadoresSalvos.find(
                function(registro) {
                    return String(registro.id) === String(ponto.id);
                }
            );

            if (marcadorCorrespondente) {
                marcadorCorrespondente.marcador.openPopup();
            }

        });

        item.appendChild(botaoVer);

        listaPontos.appendChild(item);

    });

}


// ==============================================
// CARREGAR PONTOS SALVOS
// ==============================================

function carregarPontosSalvos() {

    obterPontosSalvos().forEach(adicionarMarcadorPonto);

    aplicarFiltroCategorias();

}


// ==============================================
// SALVAR NOVO PONTO
// ==============================================

formCadastro.addEventListener('submit', function(evento) {

    evento.preventDefault();

    const usuario = obterUsuarioLogado();

    if (!usuario) {

        mensagemCadastro.textContent =
            'Entre na sua conta para cadastrar um ponto turístico.';

        mensagemCadastro.className = 'mensagem-ponto-erro';

        return;

    }

    if (!localizacaoSelecionada) {

        mensagemCadastro.textContent =
            'Clique no mapa e escolha a localização do ponto.';

        mensagemCadastro.className = 'mensagem-ponto-erro';

        return;

    }

    const nome = nomePontoInput.value.trim();

    if (!nome) {

        mensagemCadastro.textContent =
            'O nome do ponto turístico é obrigatório.';

        mensagemCadastro.className = 'mensagem-ponto-erro';

        nomePontoInput.focus();

        return;

    }

    const categoria = categoriaPontoSelect.value;

    if (!CATEGORIAS.includes(categoria)) {

        mensagemCadastro.textContent =
            'Selecione uma categoria válida para o ponto turístico.';

        mensagemCadastro.className = 'mensagem-ponto-erro';

        categoriaPontoSelect.focus();

        return;

    }

    const estadoSelecionado =
        ufPontoSelect.options[ufPontoSelect.selectedIndex];

    const novoPonto = {

        id: Date.now(),

        nome: nome,

        descricao: descricaoPontoInput.value.trim(),

        categoria: categoria,

        foto: fotoEmBase64,

        uf: estadoSelecionado && estadoSelecionado.value
            ? estadoSelecionado.dataset.sigla
            : '',

        estado: estadoSelecionado && estadoSelecionado.value
            ? estadoSelecionado.dataset.nome
            : '',

        cidade: cidadePontoSelect.value || '',

        codigoIBGE: cidadePontoSelect.selectedOptions[0]?.dataset.codigoIbge || '',

        status: 'pendente',

        latitude: localizacaoSelecionada.latitude,

        longitude: localizacaoSelecionada.longitude,

        usuario: usuario.email || '',

        nomeUsuario: usuario.nome || '',

        dataCadastro: new Date().toISOString()

    };

    try {

        // Verificar se o banco simulado foi carregado.
      if (!window.BeyondBordersDB) {
    throw new Error('O banco simulado não foi carregado.');
     }

// Salvar o ponto no banco simulado.
const pontoSalvo = BeyondBordersDB.pontos.salvar(novoPonto);

if (!pontoSalvo) {
    throw new Error('Não foi possível salvar o ponto no banco simulado.');
}

// Manter uma cópia no armazenamento antigo
// para preservar a compatibilidade com as outras páginas.
const pontos = obterPontosSalvos();

pontos.push(pontoSalvo);

localStorage.setItem(
    CHAVE_PONTOS,
    JSON.stringify(pontos)
);
        adicionarMarcadorPonto(novoPonto);

        aplicarFiltroCategorias();

        mensagemCadastro.textContent =
            'Ponto turístico enviado para cadastro! Ele está aguardando aprovação.';

        mensagemCadastro.className = 'mensagem-ponto-sucesso';

        // Limpar formulário.

        formCadastro.reset();

        fotoEmBase64 = '';

        previewFotoPonto.hidden = true;

        cidadePontoSelect.disabled = true;

        cidadePontoSelect.innerHTML =
            '<option value="">Selecione primeiro a UF</option>';

        if (marcadorSelecao) {

            mapa.removeLayer(marcadorSelecao);

            marcadorSelecao = null;

        }

        localizacaoSelecionada = null;

        document.getElementById('latitude').textContent =
            'Latitude: não selecionada';

        document.getElementById('longitude').textContent =
            'Longitude: não selecionada';

        avisoCoordenadas.textContent = '';

    } catch (erro) {

        mensagemCadastro.textContent =
            'Não foi possível salvar. O armazenamento do navegador pode estar cheio.';

        mensagemCadastro.className = 'mensagem-ponto-erro';

    }

});


// ==============================================
// INICIALIZAÇÃO
// ==============================================

carregarEstados();

carregarPontosSalvos();
