//. db.js

var express = require( 'express' ),
    multer = require( 'multer' ),
    Mysql = require( 'mysql' ),
    bodyParser = require( 'body-parser' ),
    fs = require( 'fs' ),
    uuidv1 = require( 'uuid/v1' ),
    api = express();

var settings = require( '../settings' );

//. env values
var settings_mysql_hostname = 'MYSQL_HOSTNAME' in process.env ? process.env['MYSQL_HOSTNAME'] : settings.mysql_hostname;
var settings_mysql_username = 'MYSQL_USERNAME' in process.env ? process.env['MYSQL_USERNAME'] : settings.mysql_username;
var settings_mysql_password = 'MYSQL_PASSWORD' in process.env ? process.env['MYSQL_PASSWORD'] : settings.mysql_password;
var settings_mysql_database = 'MYSQL_DATABASE' in process.env ? process.env['MYSQL_DATABASE'] : settings.mysql_database;

var mysql = Mysql.createPool({
  connectionLimit: 10,
  host: settings_mysql_hostname,
  user: settings_mysql_username,
  password: settings_mysql_password,
  database: settings_mysql_database
});
mysql.on( 'error', function( err ){
  console.log( 'error on working', err );
  if( err.code && err.code.startsWith( '5' ) ){
    try_reconnect( 1000 );
  }
});

function try_reconnect( ts ){
  setTimeout( function(){
    console.log( 'reconnecting...' );
    mysql = Mysql.createPool({
      connectionLimit: 10,
      host: settings_mysql_hostname,
      user: settings_mysql_username,
      password: settings_mysql_password,
      database: settings_mysql_database
    });
    mysql.on( 'error', function( err ){
      console.log( 'error on retry(' + ts + ')', err );
      if( err.code && err.code.startsWith( '5' ) ){
        ts = ( ts < 10000 ? ( ts + 1000 ) : ts );
        try_reconnect( ts );
      }
    });
  }, ts );
}


api.use( multer( { dest: './tmp/' } ).single( 'image' ) );
api.use( bodyParser.urlencoded( { extended: true } ) );
api.use( bodyParser.json() );
api.use( express.Router() );

//. Create
api.createItem = function( item ){
  return new Promise( ( resolve, reject ) => {
    if( mysql ){
      mysql.getConnection( function( err, conn ){
        if( err ){
          console.log( err );
          resolve( { status: false, error: err } );
        }else{
          try{
            var sql = 'insert into items set ?';
            //var sql = "select * from items";
            if( !item.id ){
              item.id = uuidv1();
            }
            var t = ( new Date() ).getTime();
            item.created = t;
            item.updated = t;
            console.log( item );
            conn.query( sql, item, function( err, result ){
              if( err ){
                console.log( err );
                resolve( { status: false, error: err } );
              }else{
                resolve( { status: true, result: result } );
              }
            });
          }catch( e ){
            console.log( e );
            resolve( { status: false, error: err } );
          }finally{
            conn.release();
          }
        }
      });
    }else{
      resolve( { status: false, error: 'db not ready.' } );
    }
  });
};

//. Read
api.readItem = function( item_id ){
  return new Promise( ( resolve, reject ) => {
    if( mysql ){
      mysql.getConnection( function( err, conn ){
        if( err ){
          console.log( err );
          resolve( { status: false, error: err } );
        }else{
          try{
            var sql = "select * from items where id = ?";
            conn.query( sql, [ item_id ], function( err, results ){
              if( err ){
                console.log( err );
                resolve( { status: false, error: err } );
              }else{
                if( results && results.length > 0 ){
                  resolve( { status: true, result: results[0] } );
                }else{
                  resolve( { status: false, error: 'no data' } );
                }
              }
            });
          }catch( e ){
            console.log( e );
            resolve( { status: false, error: err } );
          }finally{
            conn.release();
          }
        }
      });
    }else{
      resolve( { status: false, error: 'db not ready.' } );
    }
  });
};

//. Reads
api.readItems = function( limit, offset ){
  return new Promise( ( resolve, reject ) => {
    if( mysql ){
      mysql.getConnection( function( err, conn ){
        if( err ){
          console.log( err );
          resolve( { status: false, error: err } );
        }else{
          try{
            var sql = "select * from items order by updated";
            if( limit ){
              if( offset ){
                sql += ' limit ' + offset + ',' + limit;
              }else{
                sql += ' limit ' + limit;
              }
            }
            conn.query( sql, function( err, results ){
              if( err ){
                console.log( err );
                resolve( { status: false, error: err } );
              }else{
                resolve( { status: true, results: results } );
              }
            });
          }catch( e ){
            console.log( e );
            resolve( { status: false, error: err } );
          }finally{
            conn.release();
          }
        }
      });
    }else{
      resolve( { status: false, error: 'db not ready.' } );
    }
  });
};

//. Update
api.updateItem = function( item ){
  return new Promise( ( resolve, reject ) => {
    if( mysql ){
      mysql.getConnection( function( err, conn ){
        if( err ){
          console.log( err );
          resolve( { status: false, error: err } );
        }else{
          if( !item.id ){
            resolve( { status: false, error: 'no id.' } );
          }else{
            var id = item.id;
            delete item['id'];

            try{
              var sql = 'update items set ? where id = ?';
              //var sql = "select * from items";
              var t = ( new Date() ).getTime();
              item.updated = t;
              conn.query( sql, [ item, id ], function( err, result ){
                if( err ){
                  console.log( err );
                  resolve( { status: false, error: err } );
                }else{
                  resolve( { status: true, result: result } );
                }
              });
            }catch( e ){
              console.log( e );
              resolve( { status: false, error: err } );
            }finally{
              conn.release();
            }
          }
        }
      });
    }else{
      resolve( { status: false, error: 'db not ready.' } );
    }
  });
};

//. Delete
api.deleteItem = function( item_id ){
  return new Promise( ( resolve, reject ) => {
    if( mysql ){
      mysql.getConnection( function( err, conn ){
        if( err ){
          console.log( err );
          resolve( { status: false, error: err } );
        }else{
          try{
            var sql = "delete from items where id = ?";
            conn.query( sql, [ item_id ], function( err, result ){
              if( err ){
                console.log( err );
                resolve( { status: false, error: err } );
              }else{
                resolve( { status: true, result: result } );
              }
            });
          }catch( e ){
            console.log( e );
            resolve( { status: false, error: err } );
          }finally{
            conn.release();
          }
        }
      });
    }else{
      resolve( { status: false, error: 'db not ready.' } );
    }
  });
};


api.post( '/item', async function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var item = req.body;
  api.createItem( item ).then( function( result ){
    res.status( result.status ? 200 : 400 );
    res.write( JSON.stringify( result, null, 2 ) );
    res.end();
  });
});

api.get( '/item/:id', async function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var item_id = req.params.id;
  api.readItem( item_id ).then( function( result ){
    res.status( result.status ? 200 : 400 );
    res.write( JSON.stringify( result, null, 2 ) );
    res.end();
  });
});

api.get( '/items', async function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var limit = req.query.limit ? parseInt( limit ) : 0;
  var offset = req.query.offset ? parseInt( offset ) : 0;
  api.readItems( limit, offset ).then( function( results ){
    res.status( results.status ? 200 : 400 );
    res.write( JSON.stringify( results, null, 2 ) );
    res.end();
  });
});

api.put( '/item/:id', async function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var item_id = req.params.id;
  var item = req.body;
  item.id = item_id;
  api.updateItem( item ).then( function( result ){
    res.status( result.status ? 200 : 400 );
    res.write( JSON.stringify( result, null, 2 ) );
    res.end();
  });
});

api.delete( '/item/:id', async function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var item_id = req.params.id;
  api.deleteItem( item_id ).then( function( result ){
    res.status( result.status ? 200 : 400 );
    res.write( JSON.stringify( result, null, 2 ) );
    res.end();
  });
});


//. api をエクスポート
module.exports = api;
