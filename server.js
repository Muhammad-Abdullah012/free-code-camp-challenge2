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
  const url = req.body.url.split('//www.');
  const index = url.length - 1;
  if(index === 0) {
    res.json({error: "Invalid URL"});
  }
  dns.lookup(url[index], options , async (err,address,family) => {
    if(!err) {
      let shortUrl = await insertInTable(db,req.body.url);
      res.json({ original_url: shortUrl.urls, short_url: shortUrl.id });
    }
    else {
      res.json({error: "Invalid URL"});
    }
  });
});

app.get('/api/shorturl/:url', async (req,res) => {
  let url = req.params.url;
  let OriginalUrl = await getUrlById(db, url).catch(err => {console.error(err)});
  if(!OriginalUrl || OriginalUrl.length === 0) {
    res.json({error: "No short URL found for the given input"});
  }
  else {
    // let headers = req.headers;
    // headers.host = OriginalUrl.urls;
    // res.set(headers)
    // res.redirect(OriginalUrl.urls);
    res.redirect(OriginalUrl.urls);
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
