require('dotenv').config();
const express = require('express');
const cors = require('cors');
const knex = require('knex');
const bodyParser = require('body-parser');
const {createTable, insertInTable, getUrlById} = require('./database_work/db_work');
const dns = require('dns');


const app = express();

const db = knex({
  client: 'sqlite3',
  connection: {
   filename: './database_files/data.db3' //or .sqlite3 are extensions of sqlite
 },
 useNullAsDefault: true
});

const options = {
  family: 0,
  hints: dns.ADDRCONFIG | dns.V4MAPPED,
};

// Basic Configuration
const port = process.env.PORT || 3000;

createTable(db, "shortUrls");

app.use(cors());
app.use(bodyParser.urlencoded({extended: true}));
app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.post('/api/shorturl/', (req, res) => {
  let url = req.body.url.split('/');
  const index = 2;
  if(url[0] !== 'https:' && url[0] !== 'http:') { 
    return res.json({error: "Invalid URL"});   
  }
  //validate url
  dns.lookup(url[index], options , async (err,address,family) => {
    if(!err) {  //if url is valid
      let shortUrl = await insertInTable(db,req.body.url);  //store url in db and return an object with id(which is used as short url) and full url
      return res.json({ original_url: shortUrl.urls, short_url: shortUrl.id });
    }
    else {
      return res.json({error: "Invalid URL"});
    }
  });
});

app.get('/api/shorturl/:url', async (req,res) => {
  let urlSent = req.params.url;   //this is short url, which means it is id of original url in our db
  let pattern = /\D/g;
  let url = null;
  url = urlSent.match(pattern);
  if(url) {
    return res.json({error: "Wrong format"});
  }
  let OriginalUrl = await getUrlById(db, url);
  //if "OriginalUrl" is undefined
  if(!OriginalUrl) {
    return res.json({error: "No short URL found for the given input"});
  }
  else {
    //Now change host in request to original/full url
    let headers = req.headers;
    headers.host = OriginalUrl.urls;
    //Now set header of res to header in req 
    res.set(headers);
    return res.redirect(OriginalUrl.urls);   //redirect user to original/full url
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
