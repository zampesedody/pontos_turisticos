// ==============================================
// EXPERIÊNCIAS - BEYOND BORDERS
// ==============================================

const CHAVE_PONTOS = 'pontosTuristicos';
const CHAVE_AVALIACOES = 'avaliacoesPontosTuristicos';

const listaExperiencias = document.getElementById('listaExperiencias');
const mensagemSemPontos = document.getElementById('mensagemSemPontos');
const avisoLogin = document.getElementById('avisoLogin');


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
// DADOS DO LOCALSTORAGE
// ==============================================

function obterPontos() {

    try {

        const pontos = JSON.parse(
            localStorage.getItem(CHAVE_PONTOS) || '[]'
        );

        return Array.isArray(pontos) ? pontos : [];

    } catch (erro) {

        return [];

    }

}


function obterAvaliacoes() {

    try {

        const avaliacoes = JSON.parse(
            localStorage.getItem(CHAVE_AVALIACOES) || '[]'
        );

        return Array.isArray(avaliacoes) ? avaliacoes : [];

    } catch (erro) {

        return [];

    }

}


// ==============================================
// ELEMENTOS HTML
// ==============================================

function criarElemento(tag, classe, texto) {

    const elemento = document.createElement(tag);

    if (classe) {
        elemento.className = classe;
    }

    if (texto !== undefined && texto !== null) {
        elemento.textContent = texto;
    }

    return elemento;

}


// ==============================================
// ESTRELAS
// ==============================================

function criarEstrelas(nota) {

    let resultado = '';

    for (let i = 1; i <= 5; i++) {

        resultado += i <= nota ? '★' : '☆';

    }

    return resultado;

}


// ==============================================
// MÉDIA DAS AVALIAÇÕES
// ==============================================

function calcularMedia(avaliacoes) {

    if (avaliacoes.length === 0) {
        return '0.0';
    }

    const soma = avaliacoes.reduce(function(total, avaliacao) {

        return total + Number(avaliacao.nota);

    }, 0);

    return (soma / avaliacoes.length).toFixed(1);

}


// ==============================================
// DATA DA AVALIAÇÃO
// ==============================================

function formatarData(data) {

    if (!data) return '';

    const dataObjeto = new Date(data);

    if (Number.isNaN(dataObjeto.getTime())) {
        return '';
    }

    return dataObjeto.toLocaleDateString('pt-BR');

}


// ==============================================
// CRIAR CARTÃO DO PONTO TURÍSTICO
// ==============================================

function criarCartaoPonto(ponto, usuario) {

    const pontoId = String(ponto.id);

    const todasAvaliacoes = obterAvaliacoes();

    const avaliacoesDoPonto = todasAvaliacoes.filter(function(avaliacao) {

        return String(avaliacao.pontoId) === pontoId;

    });

    const media = calcularMedia(avaliacoesDoPonto);

    const cartao = criarElemento('article', 'card-experiencia');

    // ------------------------------------------
    // INFORMAÇÕES DO PONTO
    // ------------------------------------------

    const informacoes = criarElemento('div', 'informacoes-ponto');

    if (ponto.foto) {

        const imagem = criarElemento('img', 'foto-ponto-experiencia');

        imagem.src = ponto.foto;

        imagem.alt = `Foto de ${ponto.nome || 'ponto turístico'}`;

        informacoes.appendChild(imagem);

    } else {

        const semFoto = criarElemento(
            'div',
            'sem-foto-ponto',
            'Foto não disponível'
        );

        informacoes.appendChild(semFoto);

    }

    const dados = criarElemento('div', 'dados-ponto');

    const nome = criarElemento(
        'h3',
        '',
        ponto.nome || 'Ponto turístico sem nome'
    );

    dados.appendChild(nome);

    const localizacao = [
        ponto.cidade,
        ponto.uf
    ].filter(Boolean).join(' - ');

    if (localizacao) {

        dados.appendChild(
            criarElemento(
                'p',
                'localizacao-ponto',
                localizacao
            )
        );

    }

    if (ponto.descricao) {

        dados.appendChild(
            criarElemento(
                'p',
                'descricao-ponto-experiencia',
                ponto.descricao
            )
        );

    }

    informacoes.appendChild(dados);

    cartao.appendChild(informacoes);


    // ------------------------------------------
    // RESUMO DAS AVALIAÇÕES
    // ------------------------------------------

    const resumo = criarElemento('div', 'resumo-avaliacoes');

    resumo.appendChild(
        criarElemento(
            'span',
            'estrelas-media',
            criarEstrelas(Math.round(Number(media)))
        )
    );

    resumo.appendChild(
        criarElemento(
            'span',
            'nota-media',
            media
        )
    );

    const quantidadeTexto = avaliacoesDoPonto.length === 1
        ? '1 avaliação'
        : `${avaliacoesDoPonto.length} avaliações`;

    resumo.appendChild(
        criarElemento(
            'span',
            'quantidade-avaliacoes',
            quantidadeTexto
        )
    );

    cartao.appendChild(resumo);


    // ------------------------------------------
    // FORMULÁRIO DE AVALIAÇÃO
    // ------------------------------------------

    if (usuario) {

        const formulario = criarElemento('form', 'formulario-avaliacao');

        const tituloFormulario = criarElemento(
            'h4',
            '',
            'Compartilhe sua experiência'
        );

        formulario.appendChild(tituloFormulario);

        const avaliacaoExistente = avaliacoesDoPonto.find(function(avaliacao) {

            return avaliacao.usuarioEmail === usuario.email;

        });

        const campoNota = criarElemento(
            'div',
            'campo-nota-avaliacao'
        );

        const labelNota = criarElemento(
            'label',
            '',
            'Qual nota você dá para este lugar?'
        );

        campoNota.appendChild(labelNota);

        const selecaoEstrelas = criarElemento(
            'div',
            'selecao-estrelas'
        );

        selecaoEstrelas.setAttribute('role', 'group');
        selecaoEstrelas.setAttribute('aria-label', 'Escolha de uma a cinco estrelas');

        let notaSelecionada = avaliacaoExistente
            ? Number(avaliacaoExistente.nota)
            : 0;

        // Criar as cinco estrelas clicáveis.

        for (let i = 1; i <= 5; i++) {

            const estrela = criarElemento(
                'button',
                'botao-estrela',
                '★'
            );

            estrela.type = 'button';

            estrela.setAttribute('aria-label', `${i} estrelas`);

            estrela.setAttribute('aria-pressed', String(i === notaSelecionada));

            if (i <= notaSelecionada) {
                estrela.classList.add('selecionada');
            }

            estrela.addEventListener('click', function() {

                notaSelecionada = i;

                atualizarEstrelas();

            });

            selecaoEstrelas.appendChild(estrela);

        }

        function atualizarEstrelas() {

            const botoes = selecaoEstrelas.querySelectorAll('.botao-estrela');

            botoes.forEach(function(botao, indice) {

                const selecionada = indice + 1 <= notaSelecionada;

                botao.classList.toggle('selecionada', selecionada);

                botao.setAttribute(
                    'aria-pressed',
                    String(indice + 1 === notaSelecionada)
                );

            });

        }

        campoNota.appendChild(selecaoEstrelas);

        formulario.appendChild(campoNota);


        // --------------------------------------
        // CAMPO DE COMENTÁRIO
        // --------------------------------------

        const campoComentario = criarElemento(
            'div',
            'campo-comentario-avaliacao'
        );

        const labelComentario = criarElemento(
            'label',
            '',
            'Comentário (opcional)'
        );

        const comentario = criarElemento('textarea');

        comentario.maxLength = 1000;

        comentario.placeholder =
            'Conte como foi sua experiência neste lugar...';

        if (avaliacaoExistente) {
            comentario.value = avaliacaoExistente.comentario || '';
        }

        campoComentario.appendChild(labelComentario);
        campoComentario.appendChild(comentario);

        formulario.appendChild(campoComentario);


        // --------------------------------------
        // BOTÃO DE ENVIO
        // --------------------------------------

        const botaoEnviar = criarElemento(
            'button',
            'botao-enviar-avaliacao',
            avaliacaoExistente
                ? 'Atualizar minha avaliação'
                : 'Enviar avaliação'
        );

        botaoEnviar.type = 'submit';

        formulario.appendChild(botaoEnviar);


        // Mensagem de retorno.

        const mensagem = criarElemento(
            'p',
            'mensagem-avaliacao'
        );

        mensagem.setAttribute('role', 'status');

        formulario.appendChild(mensagem);


        // --------------------------------------
        // SALVAR OU ATUALIZAR A AVALIAÇÃO
        // --------------------------------------

        formulario.addEventListener('submit', function(evento) {

            evento.preventDefault();

            if (notaSelecionada < 1 || notaSelecionada > 5) {

                mensagem.textContent =
                    'Selecione uma quantidade de estrelas antes de enviar.';

                mensagem.className = 'mensagem-avaliacao erro';

                return;

            }

            const avaliacoes = obterAvaliacoes();

            const indiceExistente = avaliacoes.findIndex(function(avaliacao) {

                return String(avaliacao.pontoId) === pontoId &&
                    avaliacao.usuarioEmail === usuario.email;

            });

            const novaAvaliacao = {

                id: indiceExistente >= 0
                    ? avaliacoes[indiceExistente].id
                    : Date.now(),

                pontoId: pontoId,

                usuarioEmail: usuario.email,

                nomeUsuario: usuario.nome || 'Usuário',

                nota: notaSelecionada,

                comentario: comentario.value.trim(),

                data: new Date().toISOString()

            };


            // Se já existir uma avaliação desse usuário,
            // ela será atualizada em vez de criar outra.

            if (indiceExistente >= 0) {

                avaliacoes[indiceExistente] = novaAvaliacao;

            } else {

                avaliacoes.push(novaAvaliacao);

            }

            try {

                localStorage.setItem(
                    CHAVE_AVALIACOES,
                    JSON.stringify(avaliacoes)
                );

                renderizarExperiencias();

            } catch (erro) {

                mensagem.textContent =
                    'Não foi possível salvar sua avaliação. Verifique o armazenamento do navegador.';

                mensagem.className = 'mensagem-avaliacao erro';

            }

        });

        cartao.appendChild(formulario);

    }


    // ------------------------------------------
    // AVALIAÇÕES PUBLICADAS
    // ------------------------------------------

    const tituloAvaliacoes = criarElemento(
        'h4',
        'titulo-avaliacoes-publicadas',
        'O que os viajantes acharam?'
    );

    cartao.appendChild(tituloAvaliacoes);

    const listaAvaliacoes = criarElemento(
        'div',
        'lista-avaliacoes-publicadas'
    );

    if (avaliacoesDoPonto.length === 0) {

        listaAvaliacoes.appendChild(
            criarElemento(
                'p',
                'sem-avaliacoes',
                'Este lugar ainda não recebeu avaliações. Seja o primeiro!'
            )
        );

    } else {

        // Mais recentes primeiro.

        const avaliacoesOrdenadas = [...avaliacoesDoPonto].sort(function(a, b) {

            return new Date(b.data || 0) - new Date(a.data || 0);

        });

        avaliacoesOrdenadas.forEach(function(avaliacao) {

            const item = criarElemento('article', 'item-avaliacao');

            const cabecalho = criarElemento(
                'div',
                'cabecalho-avaliacao'
            );

            cabecalho.appendChild(
                criarElemento(
                    'span',
                    'nome-avaliador',
                    avaliacao.nomeUsuario || 'Usuário'
                )
            );

            cabecalho.appendChild(
                criarElemento(
                    'span',
                    'estrelas-avaliacao-publicada',
                    criarEstrelas(Number(avaliacao.nota))
                )
            );

            item.appendChild(cabecalho);

            if (avaliacao.comentario) {

                item.appendChild(
                    criarElemento(
                        'p',
                        'comentario-publicado',
                        avaliacao.comentario
                    )
                );

            }

            const data = formatarData(avaliacao.data);

            if (data) {

                item.appendChild(
                    criarElemento(
                        'small',
                        'data-avaliacao',
                        `Avaliado em ${data}`
                    )
                );

            }

            listaAvaliacoes.appendChild(item);

        });

    }

    cartao.appendChild(listaAvaliacoes);

    return cartao;

}


// ==============================================
// CARREGAR E EXIBIR EXPERIÊNCIAS
// ==============================================

function renderizarExperiencias() {

    const pontos = obterPontos();

    const usuario = obterUsuarioLogado();

    listaExperiencias.innerHTML = '';

    // Mostrar aviso se não estiver logado.

    avisoLogin.hidden = Boolean(usuario);

    // Mostrar mensagem se não houver pontos.

    mensagemSemPontos.hidden = pontos.length > 0;

    if (pontos.length === 0) {
        return;
    }

    pontos.forEach(function(ponto) {

        const cartao = criarCartaoPonto(ponto, usuario);

        listaExperiencias.appendChild(cartao);

    });

}


// ==============================================
// INICIALIZAÇÃO
// ==============================================

renderizarExperiencias();