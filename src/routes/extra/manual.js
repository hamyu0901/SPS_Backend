/* eslint-disable import/prefer-default-export */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint linebreak-style: ["error", "windows"] */
const express = require('express');

const manual = express.Router();
export { manual };
const bodyParser = require('body-parser');
const fs = require('fs');
const urlencode = require('urlencode');
const commonModule = require('../app');

manual.use(bodyParser.urlencoded({ extended: true }));
manual.use(bodyParser.json());

manual.get('/', (req, res) => {
  res.status(200).send('manual');
});

manual.post('/type', (req, res) => {
  const language = (commonModule.task.getGlobalLanguage() === 'cn') ? 'zh' : commonModule.task.getGlobalLanguage();
  const query = `SELECT display_name_${
    language
  } AS display_name, array_agg(file_name) AS file_name, file_format FROM main.def_filemanual WHERE manual_categories = ${
    req.body.category
  } GROUP BY display_name_${
    language
  }, file_format;`;
  commonModule.mainDB.execute(query, req.session.spsid, res);
});


manual.get('/type/robot/:filename', (req, res) => {
  let filePath = null;
  const language = (commonModule.task.getGlobalLanguage() === 'cn') ? 'zh' : commonModule.task.getGlobalLanguage();
  const query = `SELECT display_name_${
    language
  } AS display_name, file_name, file_format, uid FROM main.def_filemanual WHERE manual_categories = 1 ORDER BY uid`;
  commonModule.mainDB.execute(query, req.session.spsid, async (type) => {
    await Object.keys(type).forEach((key) => {
      if (type[key][1] === req.params.filename) {
        if (language === 'kr') {
          filePath = `./manual/robot/${type[key][1]}_ko-KR.pdf`;
        } else if (language === 'en') {
          filePath = `./manual/robot/${type[key][1]}_en-us.pdf`;
        } else if (language === 'zh') {
          // 중문 없는 관계로 국문 대체 1.0.7
          filePath = `./manual/robot/${type[key][1]}_en-us.pdf`;
        }
        return filePath;
      }
    });
    if (filePath === null) {
      res.status(404).send('');
    } else {
      res.download(filePath);
    }
  });
});

manual.get('/type/maintenance/:filename', (req, res) => {
  let filePath = null;
  const language = (commonModule.task.getGlobalLanguage() === 'cn') ? 'zh' : commonModule.task.getGlobalLanguage();
  const query = `SELECT display_name_${
    language
  } AS display_name, file_name, file_format, uid FROM main.def_filemanual WHERE manual_categories = 2 ORDER BY uid`;
  commonModule.mainDB.execute(query, req.session.spsid, async (type) => {
    await Object.keys(type).forEach((key) => {
      if (type[key][1] === req.params.filename) {
        if (language === 'kr') {
          filePath = `./manual/maintenance/${type[key][1]}_ko-KR.pdf`;
        } else if (language === 'en') {
          // 영문 없는 관계로 국문 대체 1.0.7
          filePath = `./manual/maintenance/${type[key][1]}_ko-KR.pdf`;
        } else if (language === 'zh') {
          // 중문 없는 관계로 국문 대체 1.0.7
          filePath = `./manual/maintenance/${type[key][1]}_ko-KR.pdf`;
        }
        return filePath;
      }
    });
    if (filePath === null) {
      res.status(404).send('');
    } else {
      res.download(filePath);
    }
  });
});

manual.get('/type/trouble/:filename', (req, res) => {
  let filePath = null;
  const language = (commonModule.task.getGlobalLanguage() === 'cn') ? 'zh' : commonModule.task.getGlobalLanguage();
  const query = `SELECT display_name_${
    language
  } AS display_name, file_name, file_format, uid FROM main.def_filemanual WHERE manual_categories = 4 ORDER BY uid`;
  commonModule.mainDB.execute(query, req.session.spsid, async (type) => {
    await Object.keys(type).forEach((key) => {
      if (type[key][0] === urlencode.decode(req.params.filename)) {
        return filePath = `./manual/troubleshooting/${type[key][0]}.pdf`;
      }
    });
    if (filePath === null) {
      res.status(404).send('');
    } else {
      res.download(filePath);
    }
  });
});

manual.get('/type/alarm/:code', (req, res) => {
  let filePath = null;
  const language = (commonModule.task.getGlobalLanguage() === 'cn') ? 'zh' : commonModule.task.getGlobalLanguage();
  const query = `SELECT display_name_${
    language
  } AS display_name, file_name, file_format, uid FROM main.def_filemanual WHERE manual_categories = 4 ORDER BY uid`;
  commonModule.mainDB.execute(query, req.session.spsid, async (type) => {
    await Object.keys(type).forEach((key) => {
      if (type[key][1] === req.params.code) {
        return filePath = `./manual/troubleshooting/${type[key][0]}.pdf`;
      }
    });
    if (filePath === null) {
      res.status(404).send('');
    } else {
      res.download(filePath);
    }
  });
});

manual.get('/type/video/list', (req, res) => {
  try {
    const getData = fs.readFileSync('./manual/video/manuallist.json');
    const getList = JSON.parse(getData);
    if (commonModule.sess.requestAuth(req.session.spsid)) {
      res.status(200).json(getList);
    } else {
      res.status(404).send('Not login');
    }
  } catch (e) {
    res.status(404).send(`Server Error : ${e.message}`);
  }
});

manual.get('/type/video/:filename', (req, res) => {
  try {
    let resourcePath = null;
    const language = (commonModule.task.getGlobalLanguage() === 'cn') ? 'zh' : commonModule.task.getGlobalLanguage();
    if (language === 'kr') {
      resourcePath = `./manual/video/korean/${req.params.filename}`;
    } else if (language === 'en') {
      resourcePath = `./manual/video/english/${req.params.filename}`;
    } else if (language === 'zh') {
      // 중문 인코딩 문제로 영문으로 대체 1.0.7
      resourcePath = `./manual/video/english/${req.params.filename}`;
    }
    const stream = fs.createReadStream(resourcePath);
    if (commonModule.sess.requestAuth(req.session.spsid)) {
      stream.on('data', (data) => {
        res.write(data);
      });
      stream.on('end', () => {
        res.end();
      });
      stream.on('error', (err) => {
        res.end(`500 Internal Server ${err}`);
      });
    } else {
      res.status(404).send('Not login');
    }
  } catch (e) {
    res.status(404).send(`Server Error : ${e.message}`);
  }
});
