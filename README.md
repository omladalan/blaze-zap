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


# Project Title  
This is an example of an in-depth ReadMe.  

## Badges  

Add badges from somewhere like: [shields.io](https://shields.io/)  
[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)  
[![GPLv3 License](https://img.shields.io/badge/License-GPL%20v3-yellow.svg)](https://choosealicense.com/licenses/gpl-3.0/)  
[![AGPL License](https://img.shields.io/badge/license-AGPL-blue.svg)](https://choosealicense.com/licenses/gpl-3.0/)

# Table of contents  
1. [Introduction](#introduction)  
2. [Some paragraph](#paragraph1)  
    1. [Sub paragraph](#subparagraph1)  
3. [Another paragraph](#paragraph2)  

## Screenshots  

![App Screenshot](https://lanecdr.org/wp-content/uploads/2019/08/placeholder.png)

## Tech Stack  

**Client:** React, Redux, TailwindCSS  

**Server:** Node, Express

## Features  

- Light/dark mode toggle  
- Live previews  
- Fullscreen mode  
- Cross platform 

## Lessons Learned  

What did you learn while building this project? What challenges did you face and how did you overcome t

## Run Locally  

Clone the project  

~~~bash  
  git clone https://link-to-project
~~~

Go to the project directory  

~~~bash  
  cd my-project
~~~

Install dependencies  

~~~bash  
npm install
~~~

Start the server  

~~~bash  
npm run start
~~~

## Environment Variables  

To run this project, you will need to add the following environment variables to your .env file  
`API_KEY`  

`ANOTHER_API_KEY` 

## Acknowledgements  

- [Awesome Readme Templates](https://awesomeopensource.com/project/elangosundar/awesome-README-templates)
- [Awesome README](https://github.com/matiassingers/awesome-readme)
- [How to write a Good readme](https://bulldogjob.com/news/449-how-to-write-a-good-readme-for-your-github-project)

## Feedback  

If you have any feedback, please reach out to us at fake@fake.com

## License  

[MIT](https://choosealicense.com/licenses/mit/)
 
 
