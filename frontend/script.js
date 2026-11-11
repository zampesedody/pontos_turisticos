alert("JavaScript conectado!");
// ==================================
// SISTEMA BEYOND BORDERS
// ==================================

// CADASTRO DE USUÁRIOS

const cadastroForm = document.getElementById("cadastroForm");

if (cadastroForm) {

    cadastroForm.addEventListener("submit", function(event) {

        event.preventDefault();

        const nome = document.getElementById("nome").value.trim();
        const email = document.getElementById("email-cadastro").value.trim().toLowerCase();
        const telefone = document.getElementById("telefone").value.trim();

        const senha = document.getElementById("senha-cadastro").value;
        const confirmarSenha = document.getElementById("confirmar-senha").value;

        const mensagem = document.getElementById("mensagemCadastro");

        // Verificar se as senhas são iguais
        if (senha !== confirmarSenha) {
            mensagem.textContent = "As senhas não coincidem!";
            mensagem.style.color = "red";
            return;
        }

        // Verificar tamanho da senha
        if (senha.length < 8) {
            mensagem.textContent = "A senha precisa ter pelo menos 8 caracteres.";
            mensagem.style.color = "red";
            return;
        }

        // Recuperar usuários cadastrados
        let usuarios = JSON.parse(
            localStorage.getItem("usuarios") || "[]"
        );

        // Verificar se o e-mail já existe
        const usuarioExiste = usuarios.find(
            usuario => usuario.email === email
        );

        if (usuarioExiste) {
            mensagem.textContent = "Este e-mail já está cadastrado!";
            mensagem.style.color = "red";
            return;
        }

        // Criar novo usuário (apenas para demonstração)
        const novoUsuario = {
            nome: nome,
            email: email,
            telefone: telefone,
            senha: senha
        };

        usuarios.push(novoUsuario);

        // Salvar no navegador
        localStorage.setItem("usuarios", JSON.stringify(usuarios));

        mensagem.textContent = "Cadastro realizado com sucesso!";
        mensagem.style.color = "green";

        // Direcionar para o login
        setTimeout(function() {
            window.location.href = "login.html";
        }, 1500);

    });

}


// ==================================
// SISTEMA DE LOGIN
// ==================================

const loginForm = document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", function(event) {

        event.preventDefault();

        const email = document.getElementById("email").value.trim().toLowerCase();
        const senha = document.getElementById("senha").value;

        const mensagem = document.getElementById("mensagemLogin");

        // Recuperar usuários cadastrados
        let usuarios = JSON.parse(
            localStorage.getItem("usuarios") || "[]"
        );

        // Procurar usuário
        const usuarioEncontrado = usuarios.find(function(usuario) {
            return usuario.email === email && usuario.senha === senha;
        });

        if (usuarioEncontrado) {

            // Guardar usuário conectado
            sessionStorage.setItem(
                "usuarioLogado",
                JSON.stringify({
                    nome: usuarioEncontrado.nome,
                    email: usuarioEncontrado.email
                })
            );

            mensagem.textContent = "Login realizado com sucesso!";
            mensagem.style.color = "green";

            setTimeout(function() {
                window.location.href = "area.html";
            }, 1000);

        } else {

            mensagem.textContent = "E-mail ou senha incorretos!";
            mensagem.style.color = "red";

        }

    });

}
