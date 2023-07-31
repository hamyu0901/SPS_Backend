/* eslint-disable import/prefer-default-export */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint linebreak-style: ["error", "windows"] */
const express = require('express');

const temperature = express.Router();
export { temperature };
const bodyParser = require('body-parser');
const commonModule = require('../../app');

temperature.use(bodyParser.urlencoded({ extended: true }));
temperature.use(bodyParser.json());

/*

*/

function getObjectFromArray(array, key, value){
  for (var i = 0; i < array.length; i++) {
      if (array[i][key] === value) {
          return array[i];
      }
  }
  return null;
}

temperature.post('/save', async (req, res) => {
  var query = `SELECT CASE WHEN (SELECT COUNT(*) FROM public.his_report_detail WHERE report_id = ${req.body.report_id} and report_type = 1 and factory_id = ${req.body.factory_id} AND booth_id = ${req.body.booth_id} AND zone_id = ${req.body.zone_id} ) != 0 then true else false end as isnull`
  let resData = await commonModule.mainDB.execute(query);
  if(resData[0][0] === true){
    for(const robotId of req.body.robot_id_list){
      var dataObject = getObjectFromArray(req.body.data_list, 'robot_id', robotId);
      var dataIdObj = getObjectFromArray(req.body.prev_data_id_list, 'robot_id', robotId);
      query = `UPDATE public.his_report_detail SET current_data = '${JSON.stringify(dataObject)}', prev_data_id=${dataIdObj === null ? null : dataIdObj.data_id}, comment = '${req.body.comment}', current_start_date='${req.body.start_date}', current_end_date='${req.body.end_date}'
        WHERE report_type = 1 AND report_id = ${req.body.report_id} AND factory_id = ${req.body.factory_id} AND booth_id = ${req.body.booth_id} AND zone_id = ${req.body.zone_id} AND robot_id=${robotId}`;
        await commonModule.mainDB.execute(query);
    }
  }else{

    for(const robotId of req.body.robot_id_list){

        var dataObject = await getObjectFromArray(req.body.data_list, 'robot_id', robotId);
        var dataIdObj = await getObjectFromArray(req.body.prev_data_id_list, 'robot_id', robotId);
        query = `
          INSERT INTO public.his_report_detail (report_id, report_type, factory_id, booth_id, zone_id, robot_id, current_data, prev_data_id, comment, current_start_date, current_end_date)
            VALUES (${req.body.report_id}, ${req.body.report_type}, ${req.body.factory_id}, ${req.body.booth_id}, ${req.body.zone_id}, ${robotId}, '${JSON.stringify(dataObject)}', ${dataIdObj === null ? null : dataIdObj.data_id}, '${req.body.comment}', '${req.body.start_date}', '${req.body.end_date}')`;

        await commonModule.mainDB.execute(query);
      }
  }
  return res.sendStatus(200);
});



temperature.post('/reportDetailfromCurr', async (req, res) => {
  var data_id_join = req.body.data_id_list.join();
  const query = `
    SELECT row_to_json(report_info) as prev_report_info
    FROM
    (
    SELECT
      report_id
    FROM(
      SELECT DISTINCT
        report_id
      FROM public.his_report_detail
      WHERE report_type = 1 AND data_id in (${data_id_join}) AND factory_id = ${req.body.factory_id} AND booth_id = ${req.body.booth_id} AND zone_id = ${req.body.zone_id}
    ) as b
    )as report_info
  `
  const resData = await commonModule.mainDB.execute(query);


  if(resData !== undefined){
    // console.log(resData);
    res.status(200).send(resData);
  }else{
    // console.log('no data');
    res.status(200).send('no data');
  }


});

temperature.post('/reportDetail', async (req, res) => {
  const query = `
    SELECT current_data as robot_info, data_id, TO_CHAR(current_start_date, 'YYYY-MM-DD') as start_date , TO_CHAR(current_end_date, 'YYYY-MM-DD') as end_date, comment FROM public.his_report_detail
    WHERE report_type = 1 AND report_id = ${req.body.report_id} AND factory_id = ${req.body.factory_id} AND booth_id = ${req.body.booth_id} AND zone_id = ${req.body.zone_id}
    ORDER BY robot_id
  `
  const resData = await commonModule.mainDB.execute(query);

  res.status(200).send(resData);
});

temperature.post('/reports', async (req, res) => {
  const query = `
    SELECT DISTINCT
      a.report_id,
      a.report_name as name
    FROM public.his_report as a
    LEFT OUTER JOIN public.his_report_detail AS b
    ON a.report_id = b.report_id
    WHERE b.report_type=1 AND a.report_id != ${req.body.current_report_id}
    ORDER BY a.report_id
  `
  const resData = await commonModule.mainDB.execute(query);
  res.status(200).send(resData);
});

temperature.post('/isnull', async (req, res) => {
  const query = `SELECT CASE WHEN (SELECT COUNT(*) FROM public.his_report_detail WHERE report_id = ${req.body.report_id} and report_type = 1) = 0 then 'TRUE' else 'FALSE' end as isnull`
  const resData = await commonModule.mainDB.execute(query);
  return res.status(200).send(resData[0][0].toLowerCase());
});

temperature.post('/getCurrReport', async (req, res) => {
  const robot_id_list = req.body.robot_ids.join();
  const query = `SELECT json_agg(current_data) as result FROM public.his_report_detail WHERE report_id = ${req.body.report_id} and report_type = 1 and robot_id in (${robot_id_list}) `
  const resData = await commonModule.mainDB.execute(query);
  res.send(resData[0][0]).status(200);
});

/*
select case when (select count(*) from public.his_report_detail where report_id = 2 and report_type = 1) = 1 then 'TRUE' else 'FALSE' end as isDataNull
*/


temperature.post('/analyzeHasReport', async (req, res) => {

    let query = `SELECT CASE WHEN (SELECT COUNT(*) FROM public.his_report_detail WHERE report_id = ${req.body.report_id} and report_type = 1) = 0 then 'TRUE' else 'FALSE' end as isnull`
    let resData = await commonModule.mainDB.execute(query);
    if(resData[0][0].toLowerCase() === 'false'){
      query = `SELECT current_data as robot_info, TO_CHAR(current_start_date, 'YYYY-MM-DD') as start_date , TO_CHAR(current_end_date, 'YYYY-MM-DD') as end_date, prev_data_id, comment  FROM public.his_report_detail
        WHERE report_type = 1 AND report_id = ${req.body.report_id} AND factory_id = ${req.body.factory_id} AND booth_id = ${req.body.booth_id} AND zone_id = ${req.body.zone_id}
        ORDER BY robot_id`;
      await commonModule.mainDB.execute(query, req.session.spsid, res);
    }else{
      res.send('no data').status(200);
    }
});

temperature.post('/analyzeNoReport', async (req, res) => {
  let query = `
  SELECT row_to_json(def_tempRobot_info) as robot_info
  FROM(
      SELECT
          public.def_robot_config.robot_id,
          (
              SELECT jsonb_agg(nested_robot)
              FROM (
                  SELECT
                    COALESCE(ROUND(AVG(a.axis1)), 0) as axis1,
                    COALESCE(ROUND(AVG(a.axis2)), 0) as axis2,
                    COALESCE(ROUND(AVG(a.axis3)), 0) as axis3,
                    COALESCE(ROUND(AVG(a.axis4)), 0) as axis4,
                    COALESCE(ROUND(AVG(a.axis5)), 0) as axis5,
                    COALESCE(ROUND(AVG(a.axis6)), 0) as axis6,
                    COALESCE(ROUND(AVG(a.axis7)), 0) as axis7
                  FROM(SELECT
                    motor_encoder[1] as axis1,
                    motor_encoder[2] as axis2,
                    motor_encoder[3] as axis3,
                    motor_encoder[4] as axis4,
                    motor_encoder[5] as axis5,
                    motor_encoder[6] as axis6,
                    motor_encoder[7] as axis7
                  FROM public.his_robot_temperature
                  WHERE factory_id = ${req.body.factory_id} AND booth_id = ${req.body.booth_id} AND zone_id = ${req.body.zone_id} AND robot_id = public.def_robot_config.robot_id
                  AND time_stamp between '${req.body.fromDate}' AND '${req.body.toDate}') as a
              )AS nested_robot
          ) AS avg_temperature,
          (
              SELECT jsonb_agg(nested_robot)
              FROM (
                  SELECT
                    (select count(*) from public.his_violation_temperature WHERE factory_id = ${req.body.factory_id} AND booth_id = ${req.body.booth_id} AND zone_id = ${req.body.zone_id} AND robot_id = public.def_robot_config.robot_id AND update_time between '${req.body.fromDate}' AND '${req.body.toDate}' AND axis = 1) as axis1,
                    (select count(*) from public.his_violation_temperature WHERE factory_id = ${req.body.factory_id} AND booth_id = ${req.body.booth_id} AND zone_id = ${req.body.zone_id} AND robot_id = public.def_robot_config.robot_id AND update_time between '${req.body.fromDate}' AND '${req.body.toDate}' AND axis = 2) as axis2,
                    (select count(*) from public.his_violation_temperature WHERE factory_id = ${req.body.factory_id} AND booth_id = ${req.body.booth_id} AND zone_id = ${req.body.zone_id} AND robot_id = public.def_robot_config.robot_id AND update_time between '${req.body.fromDate}' AND '${req.body.toDate}' AND axis = 3) as axis3,
                    (select count(*) from public.his_violation_temperature WHERE factory_id = ${req.body.factory_id} AND booth_id = ${req.body.booth_id} AND zone_id = ${req.body.zone_id} AND robot_id = public.def_robot_config.robot_id AND update_time between '${req.body.fromDate}' AND '${req.body.toDate}' AND axis = 4) as axis4,
                    (select count(*) from public.his_violation_temperature WHERE factory_id = ${req.body.factory_id} AND booth_id = ${req.body.booth_id} AND zone_id = ${req.body.zone_id} AND robot_id = public.def_robot_config.robot_id AND update_time between '${req.body.fromDate}' AND '${req.body.toDate}' AND axis = 5) as axis5,
                    (select count(*) from public.his_violation_temperature WHERE factory_id = ${req.body.factory_id} AND booth_id = ${req.body.booth_id} AND zone_id = ${req.body.zone_id} AND robot_id = public.def_robot_config.robot_id AND update_time between '${req.body.fromDate}' AND '${req.body.toDate}' AND axis = 6) as axis6,
                    (select count(*) from public.his_violation_temperature WHERE factory_id = ${req.body.factory_id} AND booth_id = ${req.body.booth_id} AND zone_id = ${req.body.zone_id} AND robot_id = public.def_robot_config.robot_id AND update_time between '${req.body.fromDate}' AND '${req.body.toDate}' AND axis = 7) as axis7
              )AS nested_robot
          ) AS violation,
          (SELECT null) as severity,
        (SELECT null) as comment
      FROM public.def_robot_config WHERE factory_id = ${req.body.factory_id} AND booth_id = ${req.body.booth_id} AND zone_id = ${req.body.zone_id}
  ) AS def_tempRobot_info`
  ;

  commonModule.mainDB.execute(query, req.session.spsid, res);
});


temperature.get('/quick/getYearsMonthes', async (req, res) => {
    const query = `
      SELECT row_to_json(years) as dates
      FROM(
        SELECT DISTINCT
          a.year,
          (
            SELECT ARRAY(
              SELECT
                substring(c.relname::varchar,29,2) as month
              FROM pg_inherits i
              JOIN pg_class p
              ON i.inhparent = p.oid
              JOIN pg_class c
              ON i.inhrelid = c.oid
              WHERE p.relname='his_robot_temperature' AND a.year = substring(c.relname::varchar,24,4)
            )
          )as monthes

        FROM (
          SELECT
            substring(c.relname::varchar,24,4) as year
          FROM pg_inherits i
          JOIN pg_class p
          ON i.inhparent = p.oid
          JOIN pg_class c
          ON i.inhrelid = c.oid
          WHERE p.relname='his_robot_temperature'
        )as a
      )as years;
    `;
    commonModule.mainDB.execute(query, req.session.spsid, res);
});

temperature.get('/quick/getYears', (req, res) => {
  const query = `
      SELECT DISTINCT
          to_char(date_trunc('year', time_stamp), 'YYYY') as years
      FROM public.his_robot_temperature;
  `;
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

temperature.get('/quick/getMonthes/:selectedYear', (req, res) => {
  const query = `
  SELECT DISTINCT
      to_char(date_trunc('month', time_stamp), 'MM') as monthes
  FROM public.his_robot_temperature
  WHERE cast(time_stamp as date) between '${req.params.selectedYear}-01-01' and '${req.params.selectedYear}-12-31';
      ;
  `;
  commonModule.mainDB.execute(query, req.session.spsid, res);
});


temperature.get('/factoryInfo', (req, res) => {
  const query = `
    SELECT row_to_json(def_factory_info) as booth
    FROM(
        SELECT
            public.def_booth_config.booth_id,
            public.def_booth_config.booth_name,
            (
                SELECT jsonb_agg(nested_zones)
                FROM (
                    SELECT
                        public.def_zone_config.zone_id,
                        public.def_zone_config.zone_name
                    FROM public.def_zone_config
                    WHERE factory_id = 2 AND booth_id = def_booth_config.booth_id
                    Order By zone_id asc
                )AS nested_zones
            ) AS zones
        FROM public.def_booth_config
    ) AS def_factory_info
  `;
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

temperature.get('/robotInfo/booth_id/:booth_id/zone_id/:zone_id', (req, res) => {

    const query = `
    SELECT row_to_json(def_robot_info) as robot_info
	FROM(
		SELECT
			public.def_robot_config.robot_id,
			public.def_robot_config.robot_name colName,
			(
				SELECT jsonb_agg(nested_robot_detail)
				FROM (
					SELECT
						a.model_name,
						b.company_name
					FROM public.def_model_config as a
					LEFT OUTER JOIN public.def_company_config AS b
					ON a.company_id = b.company_id
					WHERE a.model_id = public.def_robot_config.robot_model_id
				)AS nested_robot_detail
			) AS robot_detail
		FROM public.def_robot_config
		WHERE factory_id = 2 AND booth_id = ${req.params.booth_id} AND zone_id = ${req.params.zone_id}
    order by robot_id asc
	) AS def_robot_info
    `;
    commonModule.mainDB.execute(query, req.session.spsid, res);
  });

