const mkdirp = require('mkdirp');
const fs = require('fs');
const request = require('request-promise');

const { Client, MessageMedia, LocalAuth } = require('whatsapp-web.js');
const fetch = require('fetch-base64');
var qrcode = require('qrcode-terminal');
require("dotenv-safe").config({
    allowEmptyValues: true
  })


var express = require('express');
/*
var app = require('express')(),
    mailer = require('express-mailer');
    */
var app = require('express')()
var moment = require('moment')
var bodyParser = require('body-parser');
var qrimage = require('qr-image');
app.use(bodyParser.json({limit: '500mb'}));
app.use(bodyParser.urlencoded({limit: '500mb', 
                                extended: true, 
                                parameterLimit:500000}));

var ready = false

const port = process.env.PORT

const myCustomId = 'my-custom-id'

const authStrategy = new LocalAuth({
    clientId: myCustomId,
    // dataPath: storage.sessionPath, // don't use dataPath to keep it default to ./wwwjs_auth
})

const worker = `${authStrategy.dataPath}/session-${myCustomId}/Default/Service Worker`

const puppeteerOptions = {
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--remote-debugging-port=9222', '--disable-cache', '--disable-offline-load-stale-cache', '--disable-application-cache'],
        executablePath: process.env.CHROME_PATH
    },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.84 Safari/537.36',
    takeoverOnConflict: true,
    takeoverTimeoutMs: 4500,
    authStrategy
};

const client = new Client(puppeteerOptions);

client.on('change_state', (newState) => {
    console.log(newState)
    if(newState === 'CONFLICT') {
        console.log("CONFLICT detected")
    // do something here
    }
    if(newState === 'DEPRECATED_VERSION') {
        console.log("DEPRECATED_VERSION detected")
    // do something here
    }
    if(newState === 'OPENING') {
        console.log("OPENING detected")
    // do something here
    }
    if(newState === 'PAIRING') {
        console.log("PAIRING detected")
    // do something here
    }
    if(newState === 'PROXYBLOCK') {
        console.log("PROXYBLOCK detected")
    // do something here
    }
    if(newState === 'SMB_TOS_BLOCK') {
        console.log("SMB_TOS_BLOCK detected")
    // do something here
    }
    if(newState === 'TIMEOUT') {
        console.log("TIMEOUT detected")        
    // do something here
    }
    if(newState === 'TOS_BLOCK') {
        console.log("TOS_BLOCK detected")
    // do something here
    }
    if(newState === 'UNLAUNCHED') {
        console.log("UNLAUNCHED detected")
    // do something here
    }
    if(newState === 'UNPAIRED') {
        console.log("UNPAIRED detected")
    // do something here
    }
    if(newState === 'UNPAIRED_IDLE') {
        console.log("UNPAIRED_IDLE detected")
    // do something here
    }

    if(newState === 'CONNECTED'){
        console.log("CONNECTED")
    }
});

client.on('auth_failure', (auth_failure) => {
    console.log('auth_failure ', auth_failure)
    ready = false
});


client.on('authenticated', () => {
    console.log('authenticated ')

});

client.on('change_battery', (change_battery) => {
    console.log('change_battery ', change_battery)    
});

async function clientReboot(){
    await client.destroy();
    client.initialize()
    //client.resetState()
    onInitialize();
}

client.on('disconnected', (disconnected) => {
    console.log('disconnected ', disconnected)
    fs.rmdirSync(`${authStrategy.dataPath}`, { recursive: true })                
    ready =false;
    clientReboot()    
});

process.on("SIGINT", async () => {
    console.log("(SIGINT) Shutting down...");
    process.exit(0);
});

client.on('qr', (qr) => {    
    qrcode_codigo = qr;
	qrcode.generate(qr, function (qrcode) {
		console.log(qrcode);
        console.log("\n\n");
	});
});


app.get('/instance'+process.env.INSTANCE+'/dialogs', async function(req, res){
    var token = req.query.token;
    if(token == process.env.TOKEN){
        
        var contador = 0;        
        const chats = await client.getChats();
        
        console.log(chats)
        
        var result = []
        chats.forEach(async chat => {
            //console.log('chat: ', chat.constructor.name)
            //console.log(chat)
            var contact = await chat.getContact()
            var urlProfile = await contact.getProfilePicUrl()
            //console.log(contact)
            //console.log(urlProfile)
            let data = ""
            if(chat.constructor.name == "GroupChat"){
                //console.log(chat.groupMetadata.participants)
                data = {
                    "id": chat.id._serialized,
                    "name": chat.name,
                    "image": urlProfile
                };
                //console.log(data)
                result.push(data)
            }else if(chat.constructor.name =="PrivateChat"){
                data = {
                    "id": chat.id._serialized,
                    "name": chat.name,
                    "image": urlProfile
                };
                
                result.push(data)
            }
            contador = contador + 1
            if(contador == chats.length){
                res.end('{"dialogs":' + JSON.stringify(result) + '}');
            }
        })
        
        res.end('{"dialogs":['+ ']}');
    }else{
        res.send('{"error":"Wrong token. Please provide token as a GET parameter."}');
    }
    

    //console.log('result ', JSON.stringify(result))   
    //res.send('teste');
   
    
    //res.send('teste');
    
});

/* Envia Mensagem */
app.post('/instance'+process.env.INSTANCE+'/sendMessage', function(req, res) {
    var token = req.query.token;
    
    var body = req.body.body;
    var chatId = req.body.chatId;
    var phone = req.body.phone;
    var quotedMsgId = req.body.quotedMsgId;

    if(token == process.env.TOKEN){       
        if(!ready){
            res.send('{"error":"Conection Wrong. Please check cellphone conecction status."}');
            return;
        } 
        if(!body){
            res.send('{"sent": false,"message": "Message was not sent: empty body. Please provide message text in body parameter in JSON POST."}');            
            return;
        }
        
        if(chatId){ 
            if(chatId.length > 14){
                client.sendMessage(chatId, body).then(function(result) {
                    res.send('{"sent": true,"message": "Sent to '+chatId+'","id": "'+result.id._serialized+'","queueNumber": 0}')
                });  
            }else{
                client.isRegisteredUser(chatId).then(function(isRegistered) {
                    if(isRegistered) {
                        client.sendMessage(chatId, body).then(function(result) {
                            //res.send('{"sent": true,"message": "Sent to '+chatId+'","id": "'+result.id._serialized+'","queueNumber": 0}')

                            if(chatId.length == 18){
                                var chatId_new = chatId;
                                if(chatId_new.length == 18){                       
                                    chatId_new = chatId.substr(0,4)+chatId.substr(5)
                                }
                                client.sendMessage(chatId_new, body, {quotedMessageId: quotedMsgId}).then(function(result) {
                                    res.send('{"sent": true,"message": "Sent to '+chatId+'","id": "'+result.id._serialized+'","queueNumber": 0}')
                                });
                            }else if(chatId.length == 17){
                                var chatId_new = chatId;
                                if(chatId_new.length == 18){                       
                                    chatId_new = chatId.substr(0,4)+'9'+chatId.substr(4)   
                                }
                                client.sendMessage(chatId_new, body, {quotedMessageId: quotedMsgId}).then(function(result) {
                                    res.send('{"sent": true,"message": "Sent to '+chatId+'","id": "'+result.id._serialized+'","queueNumber": 0}')
                                });
                            }else{
                                res.send('{"sent": true,"message": "Sent to 1 '+phone+'@c.us","id": "'+result.id._serialized+'","queueNumber": 0}')
                            }
                        });           
                    }else{                    
                        res.send('{"sent": false,"message": "phone parameter should contain only numbers, start from country code and be 9-14 characters long"}')
                    }
                })
            }
        }else if(phone){
            client.isRegisteredUser(phone+'@c.us').then(function(isRegistered) {
                if(isRegistered) {       
                              
                    
                    //console.log('sendMessage 1', phone);
                    client.sendMessage(phone+'@c.us', body).then(function(result) {
                        //res.send('{"sent": true,"message": "Sent to '+phone+'@c.us","id": "'+result.id._serialized+'","queueNumber": 0}')

                       
                    
                        if(phone.length == 13){  
                            var phone_new = phone;

                            phone_new = phone.substr(0,4)+phone.substr(5)            
                            //console.log('sendMessage 2', phone_new);
                            client.sendMessage(phone_new+'@c.us', body, {quotedMessageId: quotedMsgId}).then(function(result) {
                                res.send('{"sent": true,"message": "Sent to 2 '+phone_new+'@c.us","id": "'+result.id._serialized+'","queueNumber": 0}')
                            }); 
                        }else if(phone.length == 12){
                            var phone_new = phone;

                            phone_new = phone.substr(0,4)+'9'+phone.substr(4)            
                            //console.log('sendMessage 3', phone_new);
                            client.sendMessage(phone_new+'@c.us', body, {quotedMessageId: quotedMsgId}).then(function(result) {
                                res.send('{"sent": true,"message": "Sent to 2 '+phone_new+'@c.us","id": "'+result.id._serialized+'","queueNumber": 0}')
                            });
                        }else{
                            res.send('{"sent": true,"message": "Sent to 1 '+phone+'@c.us","id": "'+result.id._serialized+'","queueNumber": 0}')
                        }
                       
                    });                    
                }else{    
                    console.log('sendMessage não encontrado')                
                    res.send('{"sent": false,"message": "phone parameter should contain only numbers, start from country code and be 9-14 characters long"}')
                }
            })
            
        }else{
            res.send('{"sent": false,"message": "phone parameter should contain only numbers, start from country code and be 9-14 characters long"}')
        }        
    }else{
        res.send('{"error":"Wrong token. Please provide token as a GET parameter."}');
    }
});

app.post('/instance'+process.env.INSTANCE+'/sendFile', function(req, res) {
    var token = req.query.token;    
    var body = req.body.body;
    var chatId = req.body.chatId;
    var phone = req.body.phone;    
    var sticker = req.body.sticker;
    var _caption = req.body.caption;
    
    if(token == process.env.TOKEN){        
        if(!body){            
            res.send('{"sent": false,"message": "Message was not sent: empty body. Please provide message text in body parameter in JSON POST."}');            
            return;
        }        
        //console.log('chatId ', chatId)
        //console.log('phone ', phone)
        if(chatId){
            //console.log('chatId 0', chatId)
            if(chatId.length > 14){
                //console.log('chatId 1', chatId)
                if(body.indexOf('base64')>-1){
                    //('chatId 3', chatId)
                    var mime = '';
                    var filename = Math.round(Math.random()*5562)+moment().format('YYYYMMDDHHmmss');
                    if(body.indexOf('/png;')>-1) {
                        mime = 'image/png'
                        filename+='.png'
                    }else if(body.indexOf('/jpg;')>-1) {
                        mime = 'image/jpeg'
                        filename+='.jpg'
                    }else if(body.indexOf('/jpeg;')>-1) {
                        mime = 'image/jpeg'
                        filename+='.jpg'
                    }else if(body.indexOf('/pdf;')>-1) {
                        mime = 'application/pdf'
                        filename+='.pdf'
                    }else if(body.indexOf('/mp3;')>-1) {
                        mime = 'audio/mp3'
                        filename+='.mp3'
                    }else if(body.indexOf('audio;base64')>-1){
                        mime = 'audio/mp3'
                        filename+='.mp3'
                    }else if(body.indexOf('/vnd.openxmlformats-officedocument.spreadsheetml')>-1){											
                        mime = 'application/vnd.ms-excel'
                        filename+='.xlsx'
                    }else if(body.indexOf('/vnd.openxmlformats-officedocument.wordprocessingml.document')>-1){											
                        mime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'     
                        filename+='.docx'                       
                    }else if(body.indexOf('text/html;')>-1){
                        mime = 'text/html'                      
                        filename+='.html'                             
                    }else if(body.indexOf('/webp')>-1){
                        mime = 'image/webp'                           
                        filename+='.webp'                              
                    }else if(body.indexOf('/mp4')>-1) {
                        mime = 'video/mp4'
                        filename+='.mp4'     
                    }else if(body.indexOf('/ogg')>-1) {
                        mime = 'audio/ogg; codecs=opus'
                        filename+='.ogg'     
                    }

                    //console.log('data ', body)
                    //console.log('mime ', mime)
                    var base64Data = body;
                    if(base64Data.indexOf('base64')>-1){
                        base64Data = base64Data.split(';base64,').pop()
                    }
                    
                    const new_filename = process.env.FILE_PATH_SEND+filename;
                    //body = '/files/'+filename
                    //console.log('new_filename ', new_filename)
                    //console.log('new_filename ', base64Data)
                    fs.writeFile(new_filename,  base64Data, {encoding: 'base64'}, function(err) {
                        if (err) {
                            console.error(err);
                        }else{
                            //console.log(new_filename)
                            //const media = new MessageMedia(mime, data[0]);
                            
                            const media = MessageMedia.fromFilePath(new_filename);
                            //console.log(media)
                            if(sticker){
                                //console.log('chatId 4', chatId)
                                client.sendMessage(chatId, media, { sendMediaAsSticker: true }).then(function(result) {
                                    res.send('{"sent": true,"message": "Sent to '+chatId+'","id": "'+result.id._serialized+'","queueNumber": 0}')
                                });
                            }else{
                                //console.log('chatId 5', chatId)
                                client.sendMessage(chatId, media, {caption: _caption}).then(function(result) {
                                    res.send('{"sent": true,"message": "Sent to '+chatId+'","id": "'+result.id._serialized+'","queueNumber": 0}')
                                });
                            }
                            
                        }

                        
                    });
                }else{
                    const doFetchRemote = fetch.remote(body);
                    doFetchRemote.then((data) => {
                        var mime = '';
                        var filename = Math.round(Math.random()*5562)+'_'+moment().format('YYYYMMDDHHmmss');
                        if(data[1].indexOf('/png;')>-1) {
                            mime = 'image/png'
                            filename+='.png'
                        }else if(data[1].indexOf('/jpg;')>-1) {
                            mime = 'image/jpeg'
                            filename+='.jpg'
                        }else if(data[1].indexOf('/jpeg;')>-1) {
                            mime = 'image/jpeg'
                            filename+='.jpg'
                        }else if(data[1].indexOf('/pdf;')>-1) {
                            mime = 'application/pdf'
                            filename+='.pdf'
                        }else if(data[1].indexOf('/mp3;')>-1) {
                            mime = 'audio/mp3'
                            filename+='.mp3'
                        }else if(data[1].indexOf('audio;base64')>-1){
                            mime = 'audio/mp3'
                            filename+='.mp3'
                        }else if(data[1].indexOf('/vnd.openxmlformats-officedocument.spreadsheetml')>-1){											
                            mime = 'application/vnd.ms-excel'
                            filename+='.xlsx'
                        }else if(data[1].indexOf('/vnd.openxmlformats-officedocument.wordprocessingml.document')>-1){											
                            mime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'     
                            filename+='.docx'                       
                        }else if(data[1].indexOf('text/html;')>-1){
                            mime = 'text/html'                      
                            filename+='.html'                             
                        }else if(data[1].indexOf('/webp')>-1){
                            mime = 'image/webp'                           
                            filename+='.webp'                              
                        }else if(data[1].indexOf('/mp4')>-1) {
                            mime = 'video/mp4'
                            filename+='.mp4'     
                        }else if(data[1].indexOf('/ogg')>-1) {
                            mime = 'audio/ogg; codecs=opus'
                            filename+='.ogg'     
                        }

                        //console.log('data 2', data[1])
                        //console.log('mime ', mime)
                        var base64Data = data[0];
                        if(base64Data.indexOf('base64')>-1){
                            base64Data = base64Data.split(';base64,').pop()
                        }

                        const new_filename = process.env.FILE_PATH_SEND+filename;
                        //body = '/files/'+filename
                        
                        fs.writeFile(new_filename,  base64Data, {encoding: 'base64'}, function(err) {
                            if (err) {
                                console.error(err);
                            }

                            //console.log(new_filename)
                            //const media = new MessageMedia(mime, data[0]);
                            
                            const media = MessageMedia.fromFilePath(new_filename);
                            //console.log(media)
                            
                            if(sticker){
                                client.sendMessage(chatId, media, { sendMediaAsSticker: true }).then(function(result) {
                                    if(chatId.length == 18){
                                        var chatId_new = chatId;
                                        if(chatId_new.length == 18){                       
                                            chatId_new = chatId.substr(0,4)+chatId.substr(5)
                                        }
                                        client.sendMessage(chatId_new, media, { sendMediaAsSticker: true }).then(function(result) {
                                            res.send('{"sent": true,"message": "Sent to '+chatId+'","id": "'+result.id._serialized+'","queueNumber": 0}')
                                        });
                                    }else if(chatId.length == 17){
                                        var chatId_new = chatId;
                                        if(chatId_new.length == 18){                       
                                            chatId_new = chatId.substr(0,4)+'9'+chatId.substr(4)   
                                        }
                                        client.sendMessage(chatId_new, media, { sendMediaAsSticker: true }).then(function(result) {
                                            res.send('{"sent": true,"message": "Sent to '+chatId+'","id": "'+result.id._serialized+'","queueNumber": 0}')
                                        });
                                    }else{
                                        res.send('{"sent": true,"message": "Sent to 1 '+phone+'@c.us","id": "'+result.id._serialized+'","queueNumber": 0}')
                                    }
                                });   
                            }else{
                                client.sendMessage(chatId, media, {caption: _caption}).then(function(result) {
                                    if(chatId.length == 18){
                                        var chatId_new = chatId;
                                        if(chatId_new.length == 18){                       
                                            chatId_new = chatId.substr(0,4)+chatId.substr(5)
                                        }
                                        client.sendMessage(chatId_new, media, {caption: _caption}).then(function(result) {
                                            res.send('{"sent": true,"message": "Sent to '+chatId+'","id": "'+result.id._serialized+'","queueNumber": 0}')
                                        });
                                    }else if(chatId.length == 17){
                                        var chatId_new = chatId;
                                        if(chatId_new.length == 18){                       
                                            chatId_new = chatId.substr(0,4)+'9'+chatId.substr(4)   
                                        }
                                        client.sendMessage(chatId_new, media, {caption: _caption}).then(function(result) {
                                            res.send('{"sent": true,"message": "Sent to '+chatId+'","id": "'+result.id._serialized+'","queueNumber": 0}')
                                        });
                                    }else{
                                        res.send('{"sent": true,"message": "Sent to 1 '+phone+'@c.us","id": "'+result.id._serialized+'","queueNumber": 0}')
                                    }
                                });   
                            }
                            
                        });


                        
                        
                    }, (reason) => {
                        console.log(`Fetch Failed: ${reason}`)
                    });
                }
            }else{
                client.isRegisteredUser(chatId).then(function(isRegistered) {
                    if(isRegistered) {                    
                        if(body.indexOf('base64')>-1){
                            var mime = '';
                            var filename = Math.round(Math.random()*5562)+moment().format('YYYYMMDDHHmmss');
                            if(body.indexOf('/png;')>-1) {
                                mime = 'image/png'
                                filename+='.png'
                            }else if(body.indexOf('/jpg;')>-1) {
                                mime = 'image/jpeg'
                                filename+='.jpg'
                            }else if(body.indexOf('/jpeg;')>-1) {
                                mime = 'image/jpeg'
                                filename+='.jpg'
                            }else if(body.indexOf('/pdf;')>-1) {
                                mime = 'application/pdf'
                                filename+='.pdf'
                            }else if(body.indexOf('/mp3;')>-1) {
                                mime = 'audio/mp3'
                                filename+='.mp3'
                            }else if(body.indexOf('audio;base64')>-1){
                                mime = 'audio/mp3'
                                filename+='.mp3'
                            }else if(body.indexOf('/vnd.openxmlformats-officedocument.spreadsheetml')>-1){											
                                mime = 'application/vnd.ms-excel'
                                filename+='.xlsx'
                            }else if(body.indexOf('/vnd.openxmlformats-officedocument.wordprocessingml.document')>-1){											
                                mime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'     
                                filename+='.docx'                       
                            }else if(body.indexOf('text/html;')>-1){
                                mime = 'text/html'                      
                                filename+='.html'                             
                            }else if(body.indexOf('/webp')>-1){
                                mime = 'image/webp'                           
                                filename+='.webp'                              
                            }else if(body.indexOf('/mp4')>-1) {
                                mime = 'video/mp4'
                                filename+='.mp4'     
                            }else if(body.indexOf('/ogg')>-1) {
                                mime = 'audio/ogg; codecs=opus'
                                filename+='.ogg'     
                            }

                            //console.log('data ', body)
                            //console.log('mime ', mime)
                            var base64Data = body;
                            if(base64Data.indexOf('base64')>-1){
                                base64Data = base64Data.split(';base64,').pop()
                            }

                            const new_filename = process.env.FILE_PATH_SEND+filename;
                            //body = '/files/'+filename
                            //console.log('new_filename ', new_filename)
                            //console.log('new_filename ', base64Data)
                            fs.writeFile(new_filename,  base64Data, {encoding: 'base64'}, function(err) {
                                if (err) {
                                    console.error(err);
                                }else{
                                    //console.log(new_filename)
                                    //const media = new MessageMedia(mime, data[0]);
                                    
                                    const media = MessageMedia.fromFilePath(new_filename);
                                    //console.log(media)
                                    if(sticker){
                                        client.sendMessage(chatId, media, { sendMediaAsSticker: true }).then(function(result) {
                                            if(chatId.length == 18){
                                                var chatId_new = chatId;
                                                if(chatId_new.length == 18){                       
                                                    chatId_new = chatId.substr(0,4)+chatId.substr(5)
                                                }
                                                client.sendMessage(chatId_new, media, { sendMediaAsSticker: true }).then(function(result) {
                                                    res.send('{"sent": true,"message": "Sent to '+chatId+'","id": "'+result.id._serialized+'","queueNumber": 0}')
                                                });
                                            }else if(chatId.length == 17){
                                                var chatId_new = chatId;
                                                if(chatId_new.length == 18){                       
                                                    chatId_new = chatId.substr(0,4)+'9'+chatId.substr(4)   
                                                }
                                                client.sendMessage(chatId_new, media, { sendMediaAsSticker: true }).then(function(result) {
                                                    res.send('{"sent": true,"message": "Sent to '+chatId+'","id": "'+result.id._serialized+'","queueNumber": 0}')
                                                });
                                            }else{
                                                res.send('{"sent": true,"message": "Sent to 1 '+phone+'@c.us","id": "'+result.id._serialized+'","queueNumber": 0}')
                                            }
                                        });
                                    }else{
                                        client.sendMessage(chatId, media, {caption: _caption}).then(function(result) {
                                            if(chatId.length == 18){
                                                var chatId_new = chatId;
                                                if(chatId_new.length == 18){                       
                                                    chatId_new = chatId.substr(0,4)+chatId.substr(5)
                                                }
                                                client.sendMessage(chatId_new, media, {caption: _caption}).then(function(result) {
                                                    res.send('{"sent": true,"message": "Sent to '+chatId+'","id": "'+result.id._serialized+'","queueNumber": 0}')
                                                });
                                            }else if(chatId.length == 17){
                                                var chatId_new = chatId;
                                                if(chatId_new.length == 18){                       
                                                    chatId_new = chatId.substr(0,4)+'9'+chatId.substr(4)   
                                                }
                                                client.sendMessage(chatId_new, media, {caption: _caption}).then(function(result) {
                                                    res.send('{"sent": true,"message": "Sent to '+chatId+'","id": "'+result.id._serialized+'","queueNumber": 0}')
                                                });
                                            }else{
                                                res.send('{"sent": true,"message": "Sent to 1 '+phone+'@c.us","id": "'+result.id._serialized+'","queueNumber": 0}')
                                            }
                                        });
                                    }
                                    
                                }

                                
                            });
                        }else{
                            const doFetchRemote = fetch.remote(body);
                            doFetchRemote.then((data) => {
                                var mime = '';
                                var filename = Math.round(Math.random()*5562)+'_'+moment().format('YYYYMMDDHHmmss');
                                if(data[1].indexOf('/png;')>-1) {
                                    mime = 'image/png'
                                    filename+='.png'
                                }else if(data[1].indexOf('/jpg;')>-1) {
                                    mime = 'image/jpeg'
                                    filename+='.jpg'
                                }else if(data[1].indexOf('/jpeg;')>-1) {
                                    mime = 'image/jpeg'
                                    filename+='.jpg'
                                }else if(data[1].indexOf('/pdf;')>-1) {
                                    mime = 'application/pdf'
                                    filename+='.pdf'
                                }else if(data[1].indexOf('/mp3;')>-1) {
                                    mime = 'audio/mp3'
                                    filename+='.mp3'
                                }else if(data[1].indexOf('audio;base64')>-1){
                                    mime = 'audio/mp3'
                                    filename+='.mp3'
                                }else if(data[1].indexOf('/vnd.openxmlformats-officedocument.spreadsheetml')>-1){											
                                    mime = 'application/vnd.ms-excel'
                                    filename+='.xlsx'
                                }else if(data[1].indexOf('/vnd.openxmlformats-officedocument.wordprocessingml.document')>-1){											
                                    mime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'     
                                    filename+='.docx'                       
                                }else if(data[1].indexOf('text/html;')>-1){
                                    mime = 'text/html'                      
                                    filename+='.html'                             
                                }else if(data[1].indexOf('/webp')>-1){
                                    mime = 'image/webp'                           
                                    filename+='.webp'                              
                                }else if(data[1].indexOf('/mp4')>-1) {
                                    mime = 'video/mp4'
                                    filename+='.mp4'     
                                }else if(data[1].indexOf('/ogg')>-1) {
                                    mime = 'audio/ogg; codecs=opus'
                                    filename+='.ogg'     
                                }
        
                                //console.log('data 2', data[1])
                                //console.log('mime ', mime)
                                var base64Data = data[0];
                                if(base64Data.indexOf('base64')>-1){
                                    base64Data = base64Data.split(';base64,').pop()
                                }
        
                                const new_filename = process.env.FILE_PATH_SEND+filename;
                                //body = '/files/'+filename
                                
                                fs.writeFile(new_filename,  base64Data, {encoding: 'base64'}, function(err) {
                                    if (err) {
                                        console.error(err);
                                    }
        
                                    //console.log(new_filename)
                                    //const media = new MessageMedia(mime, data[0]);
                                    
                                    const media = MessageMedia.fromFilePath(new_filename);
                                    //console.log(media)
                                    
                                    if(sticker){
                                        client.sendMessage(chatId, media, { sendMediaAsSticker: true }).then(function(result) {
                                            if(chatId.length == 18){
                                                var chatId_new = chatId;
                                                if(chatId_new.length == 18){                       
                                                    chatId_new = chatId.substr(0,4)+chatId.substr(5)
                                                }
                                                client.sendMessage(chatId_new, media, { sendMediaAsSticker: true }).then(function(result) {
                                                    res.send('{"sent": true,"message": "Sent to '+chatId+'","id": "'+result.id._serialized+'","queueNumber": 0}')
                                                });
                                            }else if(chatId.length == 17){
                                                var chatId_new = chatId;
                                                if(chatId_new.length == 18){                       
                                                    chatId_new = chatId.substr(0,4)+'9'+chatId.substr(4)   
                                                }
                                                client.sendMessage(chatId_new, media, { sendMediaAsSticker: true }).then(function(result) {
                                                    res.send('{"sent": true,"message": "Sent to '+chatId+'","id": "'+result.id._serialized+'","queueNumber": 0}')
                                                });
                                            }else{
                                                res.send('{"sent": true,"message": "Sent to 1 '+phone+'@c.us","id": "'+result.id._serialized+'","queueNumber": 0}')
                                            }
                                        });   
                                    }else{
                                        client.sendMessage(chatId, media, {caption: _caption}).then(function(result) {
                                            if(chatId.length == 18){
                                                var chatId_new = chatId;
                                                if(chatId_new.length == 18){                       
                                                    chatId_new = chatId.substr(0,4)+chatId.substr(5)
                                                }
                                                client.sendMessage(chatId_new, media, {caption: _caption}).then(function(result) {
                                                    res.send('{"sent": true,"message": "Sent to '+chatId+'","id": "'+result.id._serialized+'","queueNumber": 0}')
                                                });
                                            }else if(chatId.length == 17){
                                                var chatId_new = chatId;
                                                if(chatId_new.length == 18){                       
                                                    chatId_new = chatId.substr(0,4)+'9'+chatId.substr(4)   
                                                }
                                                client.sendMessage(chatId_new, media, {caption: _caption}).then(function(result) {
                                                    res.send('{"sent": true,"message": "Sent to '+chatId+'","id": "'+result.id._serialized+'","queueNumber": 0}')
                                                });
                                            }else{
                                                res.send('{"sent": true,"message": "Sent to 1 '+phone+'@c.us","id": "'+result.id._serialized+'","queueNumber": 0}')
                                            }
                                        });   
                                    }
                                    
                                });
        
        
                                
                                
                            }, (reason) => {
                                console.log(`Fetch Failed: ${reason}`)
                            });
                        }
                        
                        
                                        
                    }else{                    
                        res.send('{"sent": false,"message": "phone parameter should contain only numbers, start from country code and be 9-14 characters long"}')
                    }
                })
            }
        }else if(phone){
            client.isRegisteredUser(phone+'@c.us').then(function(isRegistered) {
                if(isRegistered) {                    
                    var phone_new = phone;
                    if(phone.length == 13){                       
                        phone_new = phone.substr(0,4)+phone.substr(5)                       
                    }
                    if(body.indexOf('base64')>-1){
                        var mime = '';
                        var filename = Math.round(Math.random()*5562)+'_'+moment().format('YYYYMMDDHHmmss');
                        if(body.indexOf('/png;')>-1) {
                            mime = 'image/png'
                            filename+='.png'
                        }else if(body.indexOf('/jpg;')>-1) {
                            mime = 'image/jpeg'
                            filename+='.jpg'
                        }else if(body.indexOf('/jpeg;')>-1) {
                            mime = 'image/jpeg'
                            filename+='.jpg'
                        }else if(body.indexOf('/pdf;')>-1) {
                            mime = 'application/pdf'
                            filename+='.pdf'
                        }else if(body.indexOf('/mp3;')>-1) {
                            mime = 'audio/mp3'
                            filename+='.mp3'
                        }else if(body.indexOf('audio;base64')>-1){
                            mime = 'audio/mp3'
                            filename+='.mp3'
                        }else if(body.indexOf('/vnd.openxmlformats-officedocument.spreadsheetml')>-1){											
                            mime = 'application/vnd.ms-excel'
                            filename+='.xlsx'
                        }else if(body.indexOf('/vnd.openxmlformats-officedocument.wordprocessingml.document')>-1){											
                            mime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'     
                            filename+='.docx'                       
                        }else if(body.indexOf('text/html;')>-1){
                            mime = 'text/html'                      
                            filename+='.html'                             
                        }else if(body.indexOf('/webp')>-1){
                            mime = 'image/webp'                           
                            filename+='.webp'                              
                        }else if(body.indexOf('/mp4')>-1) {
                            mime = 'video/mp4'
                            filename+='.mp4'     
                        }else if(body.indexOf('/ogg')>-1) {
                            mime = 'audio/ogg; codecs=opus'
                            filename+='.ogg'     
                        }
                        //console.log('data 1', body)
                        //console.log('data ', body)
                        //console.log('mime ', mime)
                        var base64Data = body;
                        if(base64Data.indexOf('base64')>-1){
                            base64Data = base64Data.split(';base64,').pop()
                        }

                        const new_filename = process.env.FILE_PATH_SEND+filename;
                        //body = '/files/'+filename
                        
                        fs.writeFile(new_filename,  base64Data, {encoding: 'base64'}, function(err) {
                            if (err) {
                                console.error(err);
                            }

                            //console.log(new_filename)
                            //const media = new MessageMedia(mime, data[0]);
                            
                            const media = MessageMedia.fromFilePath(new_filename);
                            //console.log('teste')

                            if(sticker){

                                client.sendMessage(phone+'@c.us', media, { sendMediaAsSticker: true }).then(function(result) {
                                    //res.send('{"sent": true,"message": "Sent to '+phone+'@c.us","id": "'+result.id._serialized+'","queueNumber": 0}')
        
                                    if(phone.length == 13){  
                                        var phone_new = phone;

                                        phone_new = phone.substr(0,4)+phone.substr(5)            
                                        
                                        client.sendMessage(phone_new+'@c.us', media, { sendMediaAsSticker: true }).then(function(result) {
                                            res.send('{"sent": true,"message": "Sent to 2 '+phone_new+'@c.us","id": "'+result.id._serialized+'","queueNumber": 0}')
                                        }); 
                                    }else if(phone.length == 12){
                                        var phone_new = phone;

                                        phone_new = phone.substr(0,4)+'9'+phone.substr(4)            
                                        
                                        client.sendMessage(phone_new+'@c.us', media, { sendMediaAsSticker: true }).then(function(result) {
                                            res.send('{"sent": true,"message": "Sent to 2 '+phone_new+'@c.us","id": "'+result.id._serialized+'","queueNumber": 0}')
                                        });
                                    }else{
                                        res.send('{"sent": true,"message": "Sent to 1 '+phone+'@c.us","id": "'+result.id._serialized+'","queueNumber": 0}')
                                    }
                                });
                            }else{
                                client.sendMessage(phone+'@c.us', media, {caption: _caption}).then(function(result) {
                                    //res.send('{"sent": true,"message": "Sent to '+phone+'@c.us","id": "'+result.id._serialized+'","queueNumber": 0}')
        
                                    if(phone.length == 13){  
                                        var phone_new = phone;

                                        phone_new = phone.substr(0,4)+phone.substr(5)            
                                        
                                        client.sendMessage(phone_new+'@c.us', media, {caption: _caption}).then(function(result) {
                                            res.send('{"sent": true,"message": "Sent to 2 '+phone_new+'@c.us","id": "'+result.id._serialized+'","queueNumber": 0}')
                                        }); 
                                    }else if(phone.length == 12){
                                        var phone_new = phone;

                                        phone_new = phone.substr(0,4)+'9'+phone.substr(4)            
                                        
                                        client.sendMessage(phone_new+'@c.us', media, {caption: _caption}).then(function(result) {
                                            res.send('{"sent": true,"message": "Sent to 2 '+phone_new+'@c.us","id": "'+result.id._serialized+'","queueNumber": 0}')
                                        });
                                    }else{
                                        res.send('{"sent": true,"message": "Sent to 1 '+phone+'@c.us","id": "'+result.id._serialized+'","queueNumber": 0}')
                                    }
                                });   
                            }
                        });
                    }else{
                        const doFetchRemote = fetch.remote(body);
                        doFetchRemote.then((data) => {
                            var mime = '';
                            var filename = Math.round(Math.random()*5562)+'_'+moment().format('YYYYMMDDHHmmss');
                            if(data[1].indexOf('/png;')>-1) {
                                mime = 'image/png'
                                filename+='.png'
                            }else if(data[1].indexOf('/jpg;')>-1) {
                                mime = 'image/jpeg'
                                filename+='.jpg'
                            }else if(data[1].indexOf('/jpeg;')>-1) {
                                mime = 'image/jpeg'
                                filename+='.jpg'
                            }else if(data[1].indexOf('/pdf;')>-1) {
                                mime = 'application/pdf'
                                filename+='.pdf'
                            }else if(data[1].indexOf('/mp3;')>-1) {
                                mime = 'audio/mp3'
                                filename+='.mp3'
                            }else if(data[1].indexOf('audio;base64')>-1){
                                mime = 'audio/mp3'
                                filename+='.mp3'
                            }else if(data[1].indexOf('/vnd.openxmlformats-officedocument.spreadsheetml')>-1){											
                                mime = 'application/vnd.ms-excel'
                                filename+='.xlsx'
                            }else if(data[1].indexOf('/vnd.openxmlformats-officedocument.wordprocessingml.document')>-1){											
                                mime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'     
                                filename+='.docx'                       
                            }else if(data[1].indexOf('text/html;')>-1){
                                mime = 'text/html'                      
                                filename+='.html'                             
                            }else if(data[1].indexOf('/webp')>-1){
                                mime = 'image/webp'                           
                                filename+='.webp'                              
                            }else if(data[1].indexOf('/mp4')>-1) {
                                mime = 'video/mp4'
                                filename+='.mp4'     
                            }else if(data[1].indexOf('/ogg')>-1) {
                                mime = 'audio/ogg; codecs=opus'
                                filename+='.ogg'     
                            }
    
                            //console.log('data 2', filename)
                            //console.log('mime ', mime)
                            var base64Data = data[0];
                            if(base64Data.indexOf('base64')>-1){
                                base64Data = base64Data.split(';base64,').pop()
                            }
    
                            const new_filename = process.env.FILE_PATH_SEND+filename;
                            //body = '/files/'+filename
                            
                            fs.writeFile(new_filename,  base64Data, {encoding: 'base64'}, function(err) {
                                if (err) {
                                    console.error(err);
                                }
    
                                //console.log(new_filename)
                                //const media = new MessageMedia(mime, data[0]);
                                
                                const media = MessageMedia.fromFilePath(new_filename);
                                //console.log(media)
                                
                                if(sticker){
                                    //Lugar 1    
                                    //console.log('gambiarra lvl 3')
                                    client.sendMessage(phone+'@c.us', media, {sendMediaAsSticker: true, caption: _caption}).then(function(result) {
                                        //res.send('{"sent": true,"message": "Sent to '+phone+'@c.us","id": "'+result.id._serialized+'","queueNumber": 0}')
         
                                        if(phone.length == 13){  
                                            var phone_new = phone;
    
                                            phone_new = phone.substr(0,4)+phone.substr(5)            
                                            
                                            client.sendMessage(phone_new+'@c.us', media, {sendMediaAsSticker: true, caption: _caption}).then(function(result) {
                                                res.send('{"sent": true,"message": "Sent to 2 '+phone_new+'@c.us","id": "'+result.id._serialized+'","queueNumber": 0}')
                                            }); 
                                        }else if(phone.length == 12){
                                            var phone_new = phone;
    
                                            phone_new = phone.substr(0,4)+'9'+phone.substr(4)            
                                            
                                            client.sendMessage(phone_new+'@c.us', media, {sendMediaAsSticker: true, caption: _caption}).then(function(result) {
                                                res.send('{"sent": true,"message": "Sent to 2 '+phone_new+'@c.us","id": "'+result.id._serialized+'","queueNumber": 0}')
                                            });
                                        }else{
                                            res.send('{"sent": true,"message": "Sent to 1 '+phone+'@c.us","id": "'+result.id._serialized+'","queueNumber": 0}')
                                        }
                                    });  
                                }else{
                                    client.sendMessage(phone+'@c.us', media, {caption: _caption}).then(function(result) {
                                        //res.send('{"sent": true,"message": "Sent to '+phone+'@c.us","id": "'+result.id._serialized+'","queueNumber": 0}')
         
                                        if(phone.length == 13){  
                                            var phone_new = phone;
    
                                            phone_new = phone.substr(0,4)+phone.substr(5)            
                                            
                                            client.sendMessage(phone_new+'@c.us', media, {caption: _caption}).then(function(result) {
                                                res.send('{"sent": true,"message": "Sent to 2 '+phone_new+'@c.us","id": "'+result.id._serialized+'","queueNumber": 0}')
                                            }); 
                                        }else if(phone.length == 12){
                                            var phone_new = phone;
    
                                            phone_new = phone.substr(0,4)+'9'+phone.substr(4)            
                                            
                                            client.sendMessage(phone_new+'@c.us', media, {caption: _caption}).then(function(result) {
                                                res.send('{"sent": true,"message": "Sent to 2 '+phone_new+'@c.us","id": "'+result.id._serialized+'","queueNumber": 0}')
                                            });
                                        }else{
                                            res.send('{"sent": true,"message": "Sent to 1 '+phone+'@c.us","id": "'+result.id._serialized+'","queueNumber": 0}')
                                        }
                                    });  
                                }
                                 
                            });
    
    
                            
                            
                        }, (reason) => {
                            console.log(`Fetch Failed: ${reason}`)
                        });
                    }
                  
                }else{                    
                    res.send('{"sent": false,"message": "phone parameter should contain only numbers, start from country code and be 9-14 characters long"}')
                }
            })
            
        }else{
            res.send('{"sent": false,"message": "phone parameter should contain only numbers, start from country code and be 9-14 characters long"}')
        }        
    }else{
        res.send('{"error":"Wrong token. Please provide token as a GET parameter."}');
    }
});



app.listen(port, () => {
    console.log(`A bagaça é acessada no seguinte endereço http://localhost:${port}`)
})

client.on('ready', () => {
    console.log('O cliente está rodando');
    ready = true
});

client.initialize()

app.use('/files', express.static('files'));