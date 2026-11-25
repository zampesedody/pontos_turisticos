
/*
====================================================
 BEYOND BORDERS - BANCO DE DADOS SIMULADO
 Armazenamento local usando localStorage
====================================================
*/

(function () {
    "use strict";

    const CHAVE_BANCO = "beyondBordersDB";

    // Lê informações antigas sem causar erro caso estejam vazias.
    function lerJSON(chave, valorPadrao = []) {
        try {
            const dados = localStorage.getItem(chave);
            return dados ? JSON.parse(dados) : valorPadrao;
        } catch (erro) {
            console.error("Erro ao ler:", chave, erro);
            return valorPadrao;
        }
    }

    function gerarBancoVazio() {
        return {
            versao: 1,
            usuarios: [],
            pontos: [],
            avaliacoes: [],
            favoritos: {},
            roteiros: {}
        };
    }

    function obterBanco() {
        const banco = lerJSON(CHAVE_BANCO, null);

        if (!banco || typeof banco !== "object") {
            return gerarBancoVazio();
        }

        return {
            ...gerarBancoVazio(),
            ...banco
        };
    }

    function salvarBanco(banco) {
        try {
            localStorage.setItem(CHAVE_BANCO, JSON.stringify(banco));
            return true;
        } catch (erro) {
            console.error("Não foi possível salvar os dados:", erro);

            alert(
                "Não foi possível salvar os dados. " +
                "O armazenamento do navegador pode estar cheio."
            );

            return false;
        }
    }

    function normalizarEmail(email) {
        return String(email || "").trim().toLowerCase();
    }

    function gerarId() {
        if (window.crypto && window.crypto.randomUUID) {
            return window.crypto.randomUUID();
        }

        return Date.now().toString() + Math.random().toString(16).slice(2);
    }

    /*
    ==================================================
     MIGRAÇÃO DOS DADOS ANTIGOS
     Aproveita o que já existe no localStorage.
    ==================================================
    */

    function migrarDadosAntigos() {
        const banco = obterBanco();

        // Usuários cadastrados anteriormente.
        const usuariosAntigos = lerJSON("usuarios", []);

        usuariosAntigos.forEach(usuario => {
            const email = normalizarEmail(usuario.email);

            if (!email) return;

            const existe = banco.usuarios.some(
                item => normalizarEmail(item.email) === email
            );

            if (!existe) {
                banco.usuarios.push({
                    ...usuario,
                    email
                });
            }
        });

        // Pontos turísticos cadastrados anteriormente.
        const pontosAntigos = lerJSON("pontosTuristicos", []);

        pontosAntigos.forEach(ponto => {
            const id = String(ponto.id || gerarId());

            const existe = banco.pontos.some(
                item => String(item.id) === id
            );

            if (!existe) {
                banco.pontos.push({
                    ...ponto,
                    id,

                    // Mantém visíveis os pontos que já existiam.
                    status: ponto.status || "aprovado"
                });
            }
        });

        // Avaliações cadastradas anteriormente.
        const avaliacoesAntigas = lerJSON(
            "avaliacoesPontosTuristicos",
            []
        );

        avaliacoesAntigas.forEach(avaliacao => {
            const id = String(avaliacao.id || gerarId());

            const existe = banco.avaliacoes.some(
                item => String(item.id) === id
            );

            if (!existe) {
                banco.avaliacoes.push({
                    ...avaliacao,
                    id,
                    pontoId: String(avaliacao.pontoId),
                    usuarioEmail: normalizarEmail(
                        avaliacao.usuarioEmail
                    )
                });
            }
        });

        // Favoritos antigos separados por usuário.
        for (let i = 0; i < localStorage.length; i++) {
            const chave = localStorage.key(i);

            if (!chave || !chave.startsWith("favoritosPontos_")) {
                continue;
            }

            const email = normalizarEmail(
                chave.replace("favoritosPontos_", "")
            );

            if (!email) continue;

            banco.favoritos[email] = [
                ...new Set([
                    ...(banco.favoritos[email] || []),
                    ...lerJSON(chave, []).map(String)
                ])
            ];
        }

        // Roteiros antigos separados por usuário.
        for (let i = 0; i < localStorage.length; i++) {
            const chave = localStorage.key(i);

            if (!chave || !chave.startsWith("roteirosUsuario_")) {
                continue;
            }

            const email = normalizarEmail(
                chave.replace("roteirosUsuario_", "")
            );

            if (!email) continue;

            const roteirosAntigos = lerJSON(chave, []);

            if (!banco.roteiros[email]) {
                banco.roteiros[email] = roteirosAntigos;
            }
        }

        salvarBanco(banco);
    }

    /*
    ==================================================
     USUÁRIOS
    ==================================================
    */

    function listarUsuarios() {
        return obterBanco().usuarios;
    }

    function buscarUsuario(email) {
        const emailNormalizado = normalizarEmail(email);

        return listarUsuarios().find(
            usuario => normalizarEmail(usuario.email) === emailNormalizado
        ) || null;
    }

    function salvarUsuario(usuario) {
        const banco = obterBanco();
        const email = normalizarEmail(usuario.email);

        if (!email) {
            throw new Error("O e-mail do usuário é obrigatório.");
        }

        const indice = banco.usuarios.findIndex(
            item => normalizarEmail(item.email) === email
        );

        const novoUsuario = {
            ...usuario,
            email
        };

        if (indice >= 0) {
            banco.usuarios[indice] = novoUsuario;
        } else {
            banco.usuarios.push(novoUsuario);
        }

        return salvarBanco(banco);
    }

    /*
    ==================================================
     PONTOS TURÍSTICOS
    ==================================================
    */

    function listarPontos(opcoes = {}) {
        const pontos = obterBanco().pontos;

        if (opcoes.todos === true) {
            return pontos;
        }

        return pontos.filter(
            ponto => (ponto.status || "aprovado") === "aprovado"
        );
    }

    function buscarPonto(id) {
        return obterBanco().pontos.find(
            ponto => String(ponto.id) === String(id)
        ) || null;
    }

    function salvarPonto(ponto) {
        const banco = obterBanco();

        const id = String(ponto.id || gerarId());

        const indice = banco.pontos.findIndex(
            item => String(item.id) === id
        );

        const novoPonto = {
            ...ponto,
            id,
            status: ponto.status || "pendente"
        };

        if (indice >= 0) {
            banco.pontos[indice] = {
                ...banco.pontos[indice],
                ...novoPonto
            };
        } else {
            banco.pontos.push(novoPonto);
        }

        const salvo = salvarBanco(banco);

        return salvo ? novoPonto : null;
    }

    function alterarStatusPonto(id, status) {
        const statusPermitidos = [
            "pendente",
            "aprovado",
            "rejeitado"
        ];

        if (!statusPermitidos.includes(status)) {
            throw new Error("Status inválido.");
        }

        const banco = obterBanco();

        const ponto = banco.pontos.find(
            item => String(item.id) === String(id)
        );

        if (!ponto) return false;

        ponto.status = status;

        return salvarBanco(banco);
    }

    function excluirPonto(id) {
        const banco = obterBanco();

        banco.pontos = banco.pontos.filter(
            ponto => String(ponto.id) !== String(id)
        );

        banco.avaliacoes = banco.avaliacoes.filter(
            avaliacao => String(avaliacao.pontoId) !== String(id)
        );

        Object.keys(banco.favoritos).forEach(email => {
            banco.favoritos[email] =
                banco.favoritos[email].filter(
                    favorito => String(favorito) !== String(id)
                );
        });

        Object.keys(banco.roteiros).forEach(email => {
            banco.roteiros[email].forEach(roteiro => {
                roteiro.pontos = (roteiro.pontos || []).filter(
                    pontoId => String(pontoId) !== String(id)
                );
            });
        });

        return salvarBanco(banco);
    }

    /*
    ==================================================
     AVALIAÇÕES
    ==================================================
    */

    function listarAvaliacoes(idPonto) {
        return obterBanco().avaliacoes.filter(
            avaliacao => String(avaliacao.pontoId) === String(idPonto)
        );
    }

    function salvarAvaliacao(avaliacao) {
        const banco = obterBanco();

        const email = normalizarEmail(avaliacao.usuarioEmail);
        const pontoId = String(avaliacao.pontoId);
        const nota = Number(avaliacao.nota);

        if (!email || !pontoId) {
            throw new Error("Usuário e ponto são obrigatórios.");
        }

        if (!Number.isInteger(nota) || nota < 1 || nota > 5) {
            throw new Error("A nota deve ser um número de 1 a 5.");
        }

        const pontoExiste = banco.pontos.some(
            ponto => String(ponto.id) === pontoId
        );

        if (!pontoExiste) {
            throw new Error("Ponto turístico não encontrado.");
        }

        const existente = banco.avaliacoes.find(
            item =>
                String(item.pontoId) === pontoId &&
                normalizarEmail(item.usuarioEmail) === email
        );

        const novaAvaliacao = {
            ...avaliacao,
            id: existente ? existente.id : gerarId(),
            pontoId,
            usuarioEmail: email,
            nota,
            data: new Date().toISOString()
        };

        if (existente) {
            Object.assign(existente, novaAvaliacao);
        } else {
            banco.avaliacoes.push(novaAvaliacao);
        }

        return salvarBanco(banco) ? novaAvaliacao : null;
    }

    function calcularMediaAvaliacoes(idPonto) {
        const avaliacoes = listarAvaliacoes(idPonto);

        if (avaliacoes.length === 0) {
            return {
                media: 0,
                quantidade: 0
            };
        }

        const soma = avaliacoes.reduce(
            (total, avaliacao) => total + Number(avaliacao.nota),
            0
        );

        return {
            media: Number((soma / avaliacoes.length).toFixed(1)),
            quantidade: avaliacoes.length
        };
    }

    /*
    ==================================================
     FAVORITOS
    ==================================================
    */

    function listarFavoritos(email) {
        const banco = obterBanco();
        const usuario = normalizarEmail(email);

        return banco.favoritos[usuario] || [];
    }

    function alternarFavorito(email, idPonto) {
        const banco = obterBanco();
        const usuario = normalizarEmail(email);
        const pontoId = String(idPonto);

        if (!usuario) return false;

        if (!banco.favoritos[usuario]) {
            banco.favoritos[usuario] = [];
        }

        const favoritos = banco.favoritos[usuario];

        const indice = favoritos.indexOf(pontoId);

        if (indice >= 0) {
            favoritos.splice(indice, 1);
        } else {
            favoritos.push(pontoId);
        }

        return salvarBanco(banco);
    }

    /*
    ==================================================
     ROTEIROS
    ==================================================
    */

    function listarRoteiros(email) {
        const banco = obterBanco();
        const usuario = normalizarEmail(email);

        return banco.roteiros[usuario] || [];
    }

    function salvarRoteiro(email, roteiro) {
        const banco = obterBanco();
        const usuario = normalizarEmail(email);

        if (!usuario) return false;

        if (!banco.roteiros[usuario]) {
            banco.roteiros[usuario] = [];
        }

        const roteiros = banco.roteiros[usuario];

        const indice = roteiros.findIndex(
            item => String(item.id) === String(roteiro.id)
        );

        if (indice >= 0) {
            roteiros[indice] = {
                ...roteiros[indice],
                ...roteiro
            };
        } else {
            roteiros.push({
                ...roteiro,
                id: String(roteiro.id || gerarId()),
                pontos: roteiro.pontos || []
            });
        }

        return salvarBanco(banco);
    }

    function excluirRoteiro(email, idRoteiro) {
        const banco = obterBanco();
        const usuario = normalizarEmail(email);

        if (!banco.roteiros[usuario]) return false;

        banco.roteiros[usuario] = banco.roteiros[usuario].filter(
            roteiro => String(roteiro.id) !== String(idRoteiro)
        );

        return salvarBanco(banco);
    }

    /*
    ==================================================
     DISPONIBILIZA AS FUNÇÕES PARA O SITE
    ==================================================
    */

    migrarDadosAntigos();

    window.BeyondBordersDB = {
        obterBanco,

        usuarios: {
            listar: listarUsuarios,
            buscar: buscarUsuario,
            salvar: salvarUsuario
        },

        pontos: {
            listar: listarPontos,
            buscar: buscarPonto,
            salvar: salvarPonto,
            alterarStatus: alterarStatusPonto,
            excluir: excluirPonto
        },

        avaliacoes: {
            listar: listarAvaliacoes,
            salvar: salvarAvaliacao,
            calcularMedia: calcularMediaAvaliacoes
        },

        favoritos: {
            listar: listarFavoritos,
            alternar: alternarFavorito
        },

        roteiros: {
            listar: listarRoteiros,
            salvar: salvarRoteiro,
            excluir: excluirRoteiro
        }
    };

    console.log("Beyond Borders: banco simulado iniciado!");

})();
