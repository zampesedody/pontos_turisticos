
document.addEventListener("DOMContentLoaded", () => {

    const CHAVE_PONTOS = "pontosTuristicos";

    const usuario = JSON.parse(sessionStorage.getItem("usuarioLogado"));

    const avisoLogin = document.getElementById("avisoLogin");
    const conteudoRoteiros = document.getElementById("conteudoRoteiros");

    const listaFavoritos = document.getElementById("listaFavoritos");
    const listaRoteiros = document.getElementById("listaRoteiros");
    const listaTodosPontos = document.getElementById("listaTodosPontos");

    const formNovoRoteiro = document.getElementById("formNovoRoteiro");

    if (!usuario || !usuario.email) {
        avisoLogin.hidden = false;
        return;
    }

    conteudoRoteiros.hidden = false;

    // Cada usuário terá seus próprios favoritos e roteiros.
    const emailUsuario = usuario.email.toLowerCase();

    const CHAVE_FAVORITOS = "favoritosPontos_" + emailUsuario;
    const CHAVE_ROTEIROS = "roteirosUsuario_" + emailUsuario;

    function carregarDados(chave) {
        try {
            return JSON.parse(localStorage.getItem(chave)) || [];
        } catch {
            return [];
        }
    }

    function salvarDados(chave, dados) {
        localStorage.setItem(chave, JSON.stringify(dados));
    }

    function carregarPontos() {
        return carregarDados(CHAVE_PONTOS);
    }

    function carregarFavoritos() {
        return carregarDados(CHAVE_FAVORITOS).map(String);
    }

    function carregarRoteiros() {
        return carregarDados(CHAVE_ROTEIROS);
    }

    function escaparHTML(texto) {
        return String(texto ?? "").replace(/[&<>"']/g, caractere => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        })[caractere]);
    }

    function encontrarPonto(id) {
        return carregarPontos().find(ponto => String(ponto.id) === String(id));
    }

    function obterLocalizacao(ponto) {
        return [ponto.cidade, ponto.uf].filter(Boolean).join(" - ") || "Localização não informada";
    }

    function obterNomePonto(ponto) {
        return ponto.nome || "Ponto turístico sem nome";
    }

    // Alterna entre as três abas.
    document.querySelectorAll(".aba-roteiro").forEach(botao => {
        botao.addEventListener("click", () => {
            document.querySelectorAll(".aba-roteiro").forEach(aba => {
                aba.classList.remove("ativa");
            });

            botao.classList.add("ativa");

            document.querySelectorAll(".secao-roteiro").forEach(secao => {
                secao.hidden = true;
            });

            const abaSelecionada = botao.dataset.aba;

            const secoes = {
                favoritos: "secaoFavoritos",
                roteiros: "secaoRoteiros",
                pontos: "secaoPontos"
            };

            document.getElementById(secoes[abaSelecionada]).hidden = false;

            atualizarTelas();
        });
    });

    // Cria os cartões dos pontos turísticos.
    function criarCartaoPonto(ponto, origem) {

        const favoritos = carregarFavoritos();
        const estaFavoritado = favoritos.includes(String(ponto.id));

        const roteiros = carregarRoteiros();

        const opcoesRoteiros = roteiros.length
            ? roteiros.map(roteiro => `
                <option value="${escaparHTML(roteiro.id)}">
                    ${escaparHTML(roteiro.nome)}
                </option>
            `).join("")
            : `<option value="">Crie um roteiro primeiro</option>`;

        const foto = ponto.foto
            ? `<img src="${escaparHTML(ponto.foto)}" alt="${escaparHTML(obterNomePonto(ponto))}">`
            : `<div class="sem-foto-roteiro">Sem foto disponível</div>`;

        return `
            <article class="card-ponto-roteiro">
                ${foto}

                <h3>${escaparHTML(obterNomePonto(ponto))}</h3>

                <p class="localizacao-roteiro">
                    📍 ${escaparHTML(obterLocalizacao(ponto))}
                </p>

                <p>${escaparHTML(ponto.descricao || "Sem descrição disponível.")}</p>

                <div class="acoes-ponto">

                    <button
                        class="botao-favorito ${estaFavoritado ? "favoritado" : ""}"
                        onclick="alternarFavorito('${escaparHTML(ponto.id)}')"
                    >
                        ${estaFavoritado ? "♥ Favoritado" : "♡ Favoritar"}
                    </button>

                    <select id="roteiro-${escaparHTML(origem)}-${escaparHTML(ponto.id)}">
                        <option value="">Adicionar a um roteiro</option>
                        ${opcoesRoteiros}
                    </select>

                    <button
                        class="botao-adicionar"
                        onclick="adicionarPontoAoRoteiro('${escaparHTML(ponto.id)}', '${escaparHTML(origem)}')"
                    >
                        Adicionar
                    </button>

                </div>
            </article>
        `;
    }

    // Mostra todos os pontos turísticos cadastrados.
    function renderizarTodosPontos() {
        const pontos = carregarPontos();

        if (pontos.length === 0) {
            listaTodosPontos.innerHTML = `
                <p class="mensagem-vazia">
                    Ainda não existem pontos turísticos cadastrados.
                    Visite a página Destinos para cadastrar um!
                </p>
            `;
            return;
        }

        listaTodosPontos.innerHTML = pontos
            .map(ponto => criarCartaoPonto(ponto, "todos"))
            .join("");
    }

    // Mostra somente os pontos favoritados pelo usuário.
    function renderizarFavoritos() {
        const favoritos = carregarFavoritos();

        const pontosFavoritos = favoritos
            .map(id => encontrarPonto(id))
            .filter(Boolean);

        if (pontosFavoritos.length === 0) {
            listaFavoritos.innerHTML = `
                <p class="mensagem-vazia">
                    Você ainda não tem pontos favoritos.
                    Explore os pontos turísticos e salve seus preferidos!
                </p>
            `;
            return;
        }

        listaFavoritos.innerHTML = pontosFavoritos
            .map(ponto => criarCartaoPonto(ponto, "favoritos"))
            .join("");
    }

    // Mostra os roteiros criados pelo usuário.
    function renderizarRoteiros() {
        const roteiros = carregarRoteiros();

        if (roteiros.length === 0) {
            listaRoteiros.innerHTML = `
                <p class="mensagem-vazia">
                    Você ainda não criou nenhum roteiro.
                    Use o formulário acima para começar!
                </p>
            `;
            return;
        }

        listaRoteiros.innerHTML = roteiros.map(roteiro => {

            const pontosHTML = (roteiro.pontos || []).map(id => {
                const ponto = encontrarPonto(id);

                if (!ponto) return "";

                return `
                    <div class="ponto-no-roteiro">
                        <span>${escaparHTML(obterNomePonto(ponto))}</span>

                        <button
                            class="botao-remover-ponto"
                            onclick="removerPontoDoRoteiro('${escaparHTML(roteiro.id)}', '${escaparHTML(id)}')"
                        >
                            Remover
                        </button>
                    </div>
                `;
            }).join("");

            return `
                <article class="card-roteiro">

                    <div class="cabecalho-card-roteiro">
                        <div>
                            <h3>${escaparHTML(roteiro.nome)}</h3>
                            <p>${escaparHTML(roteiro.descricao || "Sem descrição.")}</p>
                        </div>

                        <button
                            class="botao-excluir-roteiro"
                            onclick="excluirRoteiro('${escaparHTML(roteiro.id)}')"
                        >
                            Excluir
                        </button>
                    </div>

                    <div class="pontos-do-roteiro">
                        <strong>Pontos deste roteiro:</strong>

                        ${pontosHTML || `
                            <p>Você ainda não adicionou pontos a este roteiro.</p>
                        `}
                    </div>

                </article>
            `;
        }).join("");
    }

    // Adiciona ou remove um ponto dos favoritos.
    window.alternarFavorito = function(id) {
        let favoritos = carregarFavoritos();

        id = String(id);

        if (favoritos.includes(id)) {
            favoritos = favoritos.filter(favorito => favorito !== id);
        } else {
            favoritos.push(id);
        }

        salvarDados(CHAVE_FAVORITOS, favoritos);
        atualizarTelas();
    };

    // Criação de um novo roteiro.
    formNovoRoteiro.addEventListener("submit", evento => {
        evento.preventDefault();

        const nome = document.getElementById("nomeRoteiro").value.trim();
        const descricao = document.getElementById("descricaoRoteiro").value.trim();

        if (!nome) {
            alert("Digite um nome para o roteiro.");
            return;
        }

        const roteiros = carregarRoteiros();

        roteiros.push({
            id: Date.now().toString(),
            nome: nome,
            descricao: descricao,
            pontos: [],
            dataCriacao: new Date().toISOString()
        });

        salvarDados(CHAVE_ROTEIROS, roteiros);

        formNovoRoteiro.reset();

        atualizarTelas();

        alert("Roteiro criado com sucesso!");
    });

    // Adiciona um ponto a um roteiro escolhido.
    window.adicionarPontoAoRoteiro = function(idPonto, origem) {

        const seletor = document.getElementById(
            `roteiro-${origem}-${idPonto}`
        );

        if (!seletor || !seletor.value) {
            alert("Selecione um roteiro primeiro. Se ainda não tiver um, crie na aba Meus Roteiros.");
            return;
        }

        const roteiros = carregarRoteiros();

        const roteiro = roteiros.find(item => String(item.id) === String(seletor.value));

        if (!roteiro) {
            alert("Roteiro não encontrado.");
            return;
        }

        if (!encontrarPonto(idPonto)) {
            alert("Esse ponto turístico não está mais disponível.");
            return;
        }

        if (!roteiro.pontos) {
            roteiro.pontos = [];
        }

        if (roteiro.pontos.map(String).includes(String(idPonto))) {
            alert("Esse ponto já está nesse roteiro!");
            return;
        }

        roteiro.pontos.push(String(idPonto));

        salvarDados(CHAVE_ROTEIROS, roteiros);

        atualizarTelas();

        alert("Ponto adicionado ao roteiro!");
    };

    // Remove um ponto de um roteiro.
    window.removerPontoDoRoteiro = function(idRoteiro, idPonto) {

        const roteiros = carregarRoteiros();

        const roteiro = roteiros.find(item => String(item.id) === String(idRoteiro));

        if (!roteiro) return;

        roteiro.pontos = (roteiro.pontos || [])
            .filter(id => String(id) !== String(idPonto));

        salvarDados(CHAVE_ROTEIROS, roteiros);

        atualizarTelas();
    };

    // Exclui um roteiro inteiro.
    window.excluirRoteiro = function(id) {

        if (!confirm("Tem certeza que deseja excluir este roteiro?")) {
            return;
        }

        const roteiros = carregarRoteiros()
            .filter(roteiro => String(roteiro.id) !== String(id));

        salvarDados(CHAVE_ROTEIROS, roteiros);

        atualizarTelas();
    };

    function atualizarTelas() {
        renderizarFavoritos();
        renderizarRoteiros();
        renderizarTodosPontos();
    }

    atualizarTelas();

});
