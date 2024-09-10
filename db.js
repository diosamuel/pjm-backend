const mysql = require('mysql');
require('dotenv/config');

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true, // Wait for a connection to be available
  connectionLimit: 10, // Maximum number of connections in the pool
  queueLimit: 0,
};
let db;

function handleDisconnect() {
  db = mysql.createPool(dbConfig);

  // db.connect((err) => {
  //   if (err) {
  //     console.error('Error connecting to the database:', err);
  //     setTimeout(handleDisconnect, 2000); // Reconnect after 2 seconds
  //   } else {
  //     console.log('Connected to the database.');

  //     // Drop the trigger if it exists and then create it

  //   }
  // });
  dropTriggerIfExists()
    .then(createTrigger)
    .catch((error) => {
      console.error('Error setting up trigger:', error);
    });

  db.query("SELECT 'foo'",(err,result)=>{
    if(err){
      console.log("Database error!")
    }else{
      console.log("Database connected!")
    }
  })
  db.on('error', (err) => {
    console.error('Database error', err);
    if (
      err.code === 'PROTOCOL_CONNECTION_LOST' ||
      err.code === 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR'
    ) {
      handleDisconnect(); // Reconnect if the connection is lost or a fatal error occurs
    } else {
      throw err;
    }
  });
}

// Drop the trigger if it exists
function dropTriggerIfExists() {
  const dropTriggerQuery = `DROP TRIGGER IF EXISTS trigger_statistik`;
  return new Promise((resolve, reject) => {
    db.query(dropTriggerQuery, (err, result) => {
      if (err) {
        reject(`Error dropping trigger: ${err}`);
      } else {
        console.log('Trigger dropped if it existed.');
        resolve();
      }
    });
  });
}

// Create the trigger
function createTrigger() {
  const createTriggerQuery = `
    CREATE TRIGGER trigger_statistik 
    AFTER INSERT ON katalog 
    FOR EACH ROW 
    BEGIN 
      INSERT INTO statistik (id_barang, jumlah_klik, updated_at) 
      VALUES (NEW.id, 0, NOW()); 
    END;
  `;
  return new Promise((resolve, reject) => {
    db.query(createTriggerQuery, (err, result) => {
      if (err) {
        reject(`Error creating trigger: ${err}`);
      } else {
        console.log('Trigger created successfully!');
        resolve();
      }
    });
  });
}

handleDisconnect();

module.exports = {
  db,
};
