const express = require('express');
const axios = require('axios');
const fs = require('fs'); // Módulo para salvar arquivos na pasta

const app = express();
const port = 3000;

// Middleware para o Express entender JSON no corpo (body) das requisições
app.use(express.json());

// Array na memória (temporário)
let favoritos = [];

// Tenta carregar favoritos existentes do arquivo ao iniciar o servidor
if (fs.existsSync('favoritos.json')) {
    const dadosArquivo = fs.readFileSync('favoritos.json', 'utf-8');
    favoritos = JSON.parse(dadosArquivo);
}

// 1. Rota Principal
app.get('/', (req, res) => {
    res.send('API My Stack Helper Rodando! Use /pacote/:nome para buscar.');
});

// 2. Rota de Busca (Consome a API externa do NPMS)
app.get('/pacote/:nome', async (req, res) => {
    const { nome } = req.params;
    const url = `https://api.npms.io/v2/search?q=${nome}`;
    
    try {
        const resposta = await axios.get(url); 
        
        // Verifica se a API retornou algum resultado
        if (resposta.data.results.length === 0) {
            return res.status(404).json({ erro: "Nenhum pacote encontrado com esse nome." });
        }

        const primeiroresultado = resposta.data.results[0].package;

        const dadoslimpos = {
            nome: primeiroresultado.name,
            descricao: primeiroresultado.description,
            versao: primeiroresultado.version, 
            link: primeiroresultado.links.npm 
        };

        res.json(dadoslimpos);
    } catch (error) {
        res.status(500).json({ erro: "Erro ao conectar com o serviço de busca." });
    }
});

// 3. Rota para Salvar Favoritos (POST)
app.post('/favoritos', (req, res) => {
    const novoPacote = req.body;
    
    // Adiciona ao array na memória
    favoritos.push(novoPacote);
    
    // SALVA NO ARQUIVO: Transforma o array em texto e grava no 'favoritos.json'
    fs.writeFileSync('favoritos.json', JSON.stringify(favoritos, null, 2));

    console.log(`Pacote ${novoPacote.nome} favoritado e salvo no arquivo!`);
    res.status(201).json({ mensagem: "Salvo com sucesso!", lista: favoritos });
});

// 4. Rota para Ver os Favoritos (GET)
app.get('/favoritos', (req, res) => {
    res.json(favoritos);
});
// Rota de teste rápido para quem está com erro no cURL
app.get('/teste-salvar', (req, res) => {
    const fakeData = { nome: "react", versao: "18.2.0", link: "https://www.npmjs.com/package/react" };
    favoritos.push(fakeData);
    fs.writeFileSync('favoritos.json', JSON.stringify(favoritos, null, 2));
    res.send("Funcionou! Verifique sua pasta, o arquivo favoritos.json nasceu!");
});

// O Listen deve ser sempre a última coisa
app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});