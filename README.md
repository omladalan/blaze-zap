# BLAZE-ZAP
API para envio de mensagem em grupo e contato do whatsapp.

## PRÉ-REQUISITOS

- Um número registrado no whatsapp business
- Criar o grupo no qual será enviado os alertas
- Node 16 lTS

# INSTALAÇÃO

Clonar o projeto
~~~bash  
  git clone git@github.com:omladalan/blaze-zap.git
~~~

Navegar até a pasta do projeto 
~~~bash  
  cd blaze-zap
~~~

Instalar Dependências

~~~bash  
npm install
~~~

Criar o [`.env`] com base no [`.env.example`]

~~~environment
PORT=#### << porta que irá rodar o serviço
TOKEN=XXXXXXXXXXXXXXXX << gerar uma senha sem caracteres especias com 16 caracteres
FILE_PATH_SEND=/home/user/blaze-zap/send_files/ << deixar a barra no final
INSTANCE=###### << colocar um número com 6 caracteres
HOST=http://localhost << host web que irá rodar o serviço
CHROME_PATH=//usr//bin//google-chrome-stable  << path do executavel do chrome
~~~

Executar a aplicação

~~~bash  
node index.js
~~~

Ao executar o terminal vai avisar que a aplicação está rodando e em seguida vai aparecer o QR code para vincular o whatsapp. Você deve scanear o QR code com o whatsapp business que deseja vincular.


![zap1](https://user-images.githubusercontent.com/102566506/197662754-882943fc-2a9b-4f70-903a-913fd009d922.png)

Ao vinculara mensagem que o cliente está conectado será exibida.

![2](https://user-images.githubusercontent.com/102566506/197663438-6ab8e08e-2972-4c86-87ee-286472c357d3.png)

Quando reiniciar o processo, o mesmo vai apresentar a mensagem que [`O cliente está rodando`], caso isso não aconteça e o vínculo foi perdido. Em caso de perda de vínculo deve apagar a pasta [`.wwebjs_auth/`] e reiniciar o processo.

❗Não conectar em outro dispositivo via QR Code


## API

#### Mostrar Diálogos(Encontrar chatId do grupo de destido)

```http
  GET [env.HOST]:[env.PORT]/instance[env.INSTANCE]/dialogs?token=[env.TOKEN]
```
Substituir [`env.*`] pelos o que foram configurados no arquivo [`.env`]

Ao realizar a requisição, olhar o terminal e procurar o chatId do grupo de destino no caso _serialized.

![3](https://user-images.githubusercontent.com/102566506/197666603-871b4987-ff50-4e60-b41d-7bd8884112c7.png)


#### Enviar Mensagem

```http
  POST [env.HOST]:[env.PORT]/instance[env.INSTANCE]/sendMessage?token=[env.TOKEN]
```

| Parâmetro | Tipo     | Descrição                       |
| :-------- | :------- | :-------------------------------- |
| `chatId`  | `string` | **Required**. chatId do grupo |
| `body` | `string` | **Required**. Mensagem a ser enviada |  

# Termos
Não utlizar para envio de spam, ou a sua alma será minha.
