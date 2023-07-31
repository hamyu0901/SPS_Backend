/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable max-len */
/* eslint-disable linebreak-style */
/* eslint linebreak-style: ["error", "windows"] */
const express = require('express');
var adGridKey = 'CompanyName=Yesinsoft Inc._on_behalf_of_DOOLIM-YASKAWA Co. Ltd.,LicensedGroup=DY Smart Work,LicenseType=MultipleApplications,LicensedConcurrentDeveloperCount=4,LicensedProductionInstancesCount=0,AssetReference=AG-022844,ExpiryDate=2_December_2022_[v2]_MTY2OTkzOTIwMDAwMA==61600137da1d12343d26857daf21ef29'
const auth = express.Router();
const bodyParser = require('body-parser');
const crypto = require('crypto');
import { createHashedPassword, setHashedPassword } from '../modules/authModule';

auth.use(bodyParser.urlencoded({ extended: true }));
auth.use(bodyParser.json());
const commonModule = require('./app');

const refresh = express.Router();
refresh.use(bodyParser.urlencoded({ extended: true }));
refresh.use(bodyParser.json());

refresh.get('/robotdetails', (req, res) => {
  if (req.session.spsid === undefined) {
    res.send('session loss');
  } else {
    res.send('defined');
  }
});

refresh.get('/backupview', (req, res) => {
  if (req.session.spsid === undefined) {
    res.send('session loss');
  } else {
    res.send('defined');
  }
});

refresh.get('/diagnostics', (req, res) => {

  if (req.session.spsid === undefined) {
    res.send('session loss');
  } else {
    res.send('defined');
  }
});

auth.get('/', (req, res) => {
  res.status(200).send('auth');
});

auth.get('/ver', (req, res) => {
  res.status(200).send(commonModule.setCfg.getVersion());
});

auth.get('/user', (req, res) => {
  res.status(200).send(req.session.userName);
})

/*ag-grid licence key*/
auth.get(`/main/key`, (req, res) => {
    res.status(200).send(adGridKey);
})

const checkUserItems = (query) => {
  return new Promise((resolve, reject) => {
    commonModule.mainDB.dbClient.query(query, (err, res) => {
      res === undefined ? reject(new Error(err)) : resolve(res.rows);
    })
  })
}
const checkUserId = (query) => {
  return new Promise((resolve, reject) => {
    commonModule.mainDB.dbClient.query(query, (err, res) => {
      err && reject(new Error(err));
      res.rows.length === 0 ? resolve(false) : resolve(true)
    })
  })
}

const getUserItem = (query) => {
  return new Promise((resolve, reject) => {
    commonModule.mainDB.dbClient.query(query, (err, res) => {
      res === undefined ? reject(new Error(err)) : resolve(res.rows);
    })
  })
}


auth.get('/login/check', (req, res) => {
  req.session.isLogin ? res.send( { message: 'ok' } ) : res.send( { message: 'failed'} );
});

auth.get('/users', (req, res) => {
  const query = `SELECT user_id, user_name, user_authority FROM main.user_config`;
  commonModule.mainDB.dbClient.query(query, (err, result) => {
    result === undefined ? res.status(404).send(err) : res.status(200).send(result.rows);
  })
});

auth.post('/register', async (req, res) => {
  const { userId, userName, userPassword, userAuthority } = req.body;
  const { password, salt } = await createHashedPassword(userPassword);
  const checkUserIdQuery = `SELECT user_id FROM main.user_config WHERE user_id = '${userId}'`;
  const addUserQuery = `INSERT INTO main.user_config VALUES('${userId}', '${userName}', '${password}', ${userAuthority}, '${salt}')`;
  checkUserId(checkUserIdQuery).then(checkRes => {
    checkRes ? res.status(409).send('duplicate id') : commonModule.mainDB.dbClient.query(addUserQuery).then(result => {
      res.status(200).send('complicate register');
    }).catch(addErr => {
      res.send(addErr);
    })
  }).catch(err => {
    res.send(error);
  })
})

auth.post('/login', (req, res) => {
  const { userId, userPassword } = req.body;
  const getUserItemQuery = `SELECT * FROM main.user_config WHERE user_id = '${userId}'`;
  getUserItem(getUserItemQuery).then(async (result) => {
    try {
      const userItem = result.length > 0 ? result[0] : null;
      const checkPassword = userItem === null ? null : await setHashedPassword(userPassword, userItem.user_salt);
      if (userItem.user_id === userId && userItem.user_password === checkPassword) {
        req.session.isLogin = true;
        req.session.userId = userItem.user_id;
        req.session.userName = userItem.user_name;
        req.session.userAuthority = userItem.user_authority;
        req.session.save(() => {
          res.status(200).send(req.session);
        })
      } else {
        res.status(500).send('login error');
      }
    } catch(error) {
      res.status(500).send(error);
    }
  }).catch(err => {
    res.status(500).send(err);
  })
})

auth.get('/logout', (req, res) => {
  req.session.destroy();
  res.clearCookie('connect.sid');
  res.status(200).send('logout');
})


export { auth };
export { refresh };
