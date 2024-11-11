// Dependencias
const express = require("express");
const axios = require("axios");
const { MercadoPagoConfig, OAuth } = require("mercadopago");
const app = express();
const { JsonDatabase } = require("wio.db");
const db = new JsonDatabase({databasePath:"./config.json"});

// Teste de API
app.get("/", (req, res) => {
    res.send("Ligado com sucesso")
});

//const redirect_uri = `https://cloudappsapi.squareweb.app/mp/callback`;
const redirect_uri = "https://"+req.hostname+"/mp/callback"

const apiblz = {};
// CallBack da Api 0Auth2
app.get("/mp/callback", (req, res) => {
    // Configurando Mercado Pago
    const client = new MercadoPagoConfig({ accessToken: db.get("acess_token"), options: { timeout: 5000 } }); 
    const client_secret = db.get("client_secret");
    const client_id = db.get("client_id");


    // Informações Necessarias
    const { code, state } = req.query;
    
    // Caso faltar algum parametro
    if (!code || !client_secret || !client_id || !redirect_uri) {
        res.status(400).send('Parâmetros necessários faltando');
        return;
    }

    // Pegando Informações do Oauth
    const oauth = new OAuth(client);
    oauth.create({
        body:{
            client_id: client_id,
            client_secret: client_secret,
            code: code,
            redirect_uri: redirect_uri,
        }
    })
    .then(async(result) => {
        apiblz[state] = result.access_token;
    })
    .catch((error) => console.log(error));
    res.redirect("https://discord.gg/posse");
});
app.get("/mp/:serverid/api", async(req, res) => {
    const serverid = req.params.serverid;

    if(!apiblz[serverid]) {
        res.json({
            message:"Aguardando Autorização"
        });
        return;
    }
    res.json({
        acesstoken: apiblz[serverid],
		message:"Autorização Concluida"
    });
    delete apiblz[serverid];
	
});

app.get("/mp/:serverid/vendasv1", (req, res) => {
    delete apiblz[req.params.serverid];
    const client = new MercadoPagoConfig({ accessToken: db.get("acess_token"), options: { timeout: 5000 } }); 
    const client_secret = db.get("client_secret");
    const client_id = db.get("client_id");
    const oauth = new OAuth(client);
    res.redirect(oauth.getAuthorizationURL({options:{
        client_id: client_id,
        redirect_uri: redirect_uri,
        state:req.params.serverid
    }}));
})




const port = 8080;
try {
    app.listen({
        host:"0.0.0.0",
        port: process.env.PORT ? Number(process.env.PORT) : port,
    })
} finally {
    console.log(`Estou on-line na porta ${port}`)
}