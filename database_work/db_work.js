const createTable = (db,name) => {
    db.schema.hasTable(name).then((exist) => {
        if(!exist) {
            db.schema.createTable(name, (table)=> {
                table.increments('id').primary();
                table.string("urls").unique("urls");
            })
            .catch(err => {
                console.error(err);
            })
        }
    })
    .catch(err => {
        console.error(err);
    })
}

const insertInTable = async (db, url) => {
    let shortURL = null;
    shortURL = await getUrl(db, url);
    if(!shortURL) {
        db.insert({urls: url})
        .into("shortUrls")
        .catch(err => {
            console.error(err);
        })
        return insertInTable(db,url);
    }
    else {
        return shortURL;
    }
}
const getUrl = async (db, url) => {
    return await db.select("*").from("shortUrls").where("shortUrls.urls", "=", url).then(shUrl => {
        return shUrl[0];
    }).catch(err => {
        console.error(err);
    })
}
const getUrlById = async (db, id) => {
    return await db.select("*").from("shortUrls").where("shortUrls.id", "=", id).then(shUrl => {
        return shUrl[0];
    }).catch(err => {
        console.error(err);
    })
}

module.exports = {
    createTable,
    insertInTable,
    getUrlById
}