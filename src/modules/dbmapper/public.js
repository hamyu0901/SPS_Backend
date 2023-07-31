export const seq = require('sequelize');
const opts = {
    timestamps: false,
    freezeTableName: true
}
const publicTable = require('../dbMapper.js');

// export const def_company_config = publicTable.sequelize.define('def_company_config', {
//     company_id: { type: seq.INTEGER, primaryKey: true },
//     company_name: { type: seq.STRING, allowNull: true },
//     bcustomer: { type: seq.BOOLEAN, allowNull: true }
// }, opts);
// export const def_factory_config = publicTable.sequelize.define('def_factory_config', {
//     factory_id: { type: seq.INTEGER, primaryKey: true },
//     company_id: { type: seq.INTEGER, foreignKey: true, allowNull: true },
//     factory_name: { type: seq.STRING, allowNull: true },
//     bdomestic: { type: seq.BOOLEAN, allowNull: true },
//     db_addr: { type: seq.STRING },
//     delete: { type: seq.BOOLEAN, allowNull: true },
//     drawing_id: { type: seq.ARRAY(seq.INTEGER) }
// }, opts);
// export const def_booth_config = publicTable.sequelize.define('def_booth_config', {
//     factory_id : { type: seq.INTEGER, primaryKey: true, foreignKey: true },
//     booth_id : { type: seq.INTEGER, primaryKey: true },
//     booth_name: { type: seq.STRING, allowNull: true },
//     booth_length: { type: seq.STRING },
//     booth_upg: { type: seq.STRING },
//     show: { type: seq.INTEGER, allowNull: true },
//     delete: { type: seq.BOOLEAN, allowNull: true },
//     drawing_id: { type: seq.ARRAY(seq.INTEGER) }
// }, opts);
// export const def_zone_config = publicTable.sequelize.define('def_zone_config', {
//     factory_id: { type: seq.INTEGER, primaryKey: true, foreignKey: true },
//     booth_id: { type: seq.INTEGER, primaryKey: true, foreignKey: true },
//     zone_id: { type: seq.INTEGER, primaryKey: true },
//     zone_name: { type: seq.STRING },
//     bconnect_op: { type: seq.BOOLEAN },
//     op_db_addr: { type: seq.STRING },
//     op_last_update_time: { type: seq.DATE },
//     bconnect_plc: { type: seq.BOOLEAN },
//     plc_type: { type: seq.INTEGER },
//     plc_ip: { type: seq.STRING },
//     show: { type: seq.INTEGER, allowNull: true },
//     delete: { type: seq.BOOLEAN, allowNull: true },
//     drawing_id: { type: seq.ARRAY(seq.INTEGER) },
//     start_count: { type: seq.SMALLINT },
//     end_count: { type: seq.SMALLINT },
//     conveyor_id: { type: seq.SMALLINT },
//     zone_type: { type: seq.SMALLINT }
// }, opts);
// export const def_robot_config = publicTable.sequelize.define('def_robot_config', {
//     factory_id: { type: seq.INTEGER, primaryKey: true, foreignKey: true },
//     booth_id: { type: seq.INTEGER, primaryKey: true, foreignKey: true },
//     zone_id: { type: seq.INTEGER, primaryKey: true, foreignKey: true },
//     robot_id: { type: seq.INTEGER, primaryKey: true },
//     robot_name: { type: seq.STRING },
//     robot_model_id: { type: seq.INTEGER, allowNull: true },
//     robot_serial: { type: seq.STRING },
//     atom_model_id: { type: seq.INTEGER, allowNull: true },
//     rc_model_id: { type: seq.INTEGER, allowNull: true },
//     robot_no: { type: seq.INTEGER, allowNull: true },
//     controller_serial: { type: seq.STRING },
//     install_date: { type: seq.STRING },
//     bdoolim: { type: seq.BOOLEAN, allowNull: true },
//     buse: { type: seq.BOOLEAN, allowNull: true },
//     axes: { type: seq.INTEGER },
//     robot_type: { type: seq.INTEGER },
//     spray_option: { type: seq.SMALLINT },
//     bcart: { type: seq.BOOLEAN },
//     ip_addr: { type: seq.STRING },
//     left_right: { type: seq.INTEGER },
//     robotjob_monitor_no: { type: seq.INTEGER },
//     show: { type: seq.INTEGER, allowNull: true },
//     delete: { type: seq.BOOLEAN, allowNull: true },
//     drawing_id: { type: seq.ARRAY(seq.INTEGER) }
// }, opts);
// export const def_zonetype_config = publicTable.sequelize.define('def_zonetype_config', {
//     type_id: { type: seq.SMALLINT, primaryKey: true },
//     type_name_kr: { type: seq.STRING },
//     type_name_en: { type: seq.STRING },
//     type_name_cn: { type: seq.STRING }
// }, opts);
// export const def_spare_list = publicTable.sequelize.define('def_spare_list', {
//     part_no: { type: seq.STRING, primaryKey: true },
//     part_name: { type: seq.STRING, allowNull: true },
//     product_no: { type: seq.STRING },
//     remain_amount: { type: seq.INTEGER },
//     btime: { type: seq.BOOLEAN, allowNull: true },
//     check_cycle: { type: seq.INTEGER },
//     replacement_cycle: { type: seq.INTEGER },
//     image_id: { type: seq.INTEGER, foreignKey: true },
//     remarks: { type: seq.STRING },
//     drawing_id: { type: seq.STRING }
// }, opts);
// export const def_model_spare = publicTable.sequelize.define('def_model_spare', {
//     model_id: { type: seq.INTEGER, primaryKey: true, foreignKey: true },
//     part_no: { type: seq.STRING, primaryKey: true, foreignKey: true }
// }, opts);
// export const def_model_config = publicTable.sequelize.define('def_model_config', {
//     model_id: { type: seq.INTEGER, primaryKey: true },
//     sub_id: { type: seq.INTEGER, foreignKey: true },
//     model_name: { type: seq.STRING },
//     company_id: { type: seq.INTEGER },
//     image_id: { type: seq.INTEGER, foreignKey: true },
//     option: { type: seq.SMALLINT }
// }, opts);
// export const def_image_list = publicTable.sequelize.define('def_image_list', {
//     image_id: { type: seq.INTEGER, primaryKey: true },
//     image_data: { type: seq.TEXT },
//     image_name: { type: seq.STRING }
// }, opts);
// export const def_spare_main_group = publicTable.sequelize.define('def_spare_main_group', {
//     main_id: { type: seq.INTEGER, primaryKey: true },
//     main_name: { type: seq.STRING }
// }, opts);
// export const def_spare_sub_group = publicTable.sequelize.define('def_spare_sub_group', {
//     sub_id: { type: seq.INTEGER, primaryKey: true },
//     main_id: { type: seq.INTEGER, foreignKey: true },
//     sub_name: { type: seq.STRING }
// }, opts);
// export const def_rms_version = publicTable.sequelize.define('def_rms_version', {
//     rms_version: { type: seq.STRING, primaryKey: true },
//     update_date: { type: seq.DATE }
// }, opts);
// export const def_license_list = publicTable.sequelize.define('def_license_list', {
//     license_id: { type: seq.BIGINT, primaryKey: true },
//     pc_ip: { type: seq.STRING, allowNull: true },
//     pc_nickname: { type: seq.STRING },
//     limit_data: { type: seq.DATE }
// }, opts);
// export const his_skid_data = publicTable.sequelize.define('his_skid_data', {
//     skid_id: { type: seq.SMALLINT, primaryKey: true },
//     update_time: { type: seq.DATE, primaryKey: true },
//     conveyor_id: { type: seq.SMALLINT },
//     body: { type: seq.SMALLINT },
//     color: { type: seq.SMALLINT },
//     option: { type: seq.SMALLINT },
//     count: { type: seq.SMALLINT },
//     vin: { type: seq.STRING }
// }, opts);
// export const cur_skid_data = publicTable.sequelize.define('cur_skid_data', {
//     skid_id: { type: seq.SMALLINT, primaryKey: true },
//     conveyor_id: { type: seq.SMALLINT },
//     body: { type: seq.SMALLINT },
//     color: { type: seq.SMALLINT },
//     option: { type: seq.SMALLINT },
//     count: { type: seq.SMALLINT },
//     vin: { type: seq.STRING },
//     update_time: { type: seq.DATE }
// }, opts);
// export const his_modify_list = publicTable.sequelize.define('his_modify_list', {
//     modify_id: { type: seq.SMALLINT, primaryKey: true },
//     factory_id: { type: seq.SMALLINT },
//     booth_id: { type: seq.SMALLINT },
//     zone_id: { type: seq.SMALLINT },
//     robot_id: { type: seq.SMALLINT },
//     time_stamp: { type: seq.DATE },
//     target: { type: seq.STRING },
//     prev_value: { type: seq.SMALLINT },
//     cur_value: { type: seq.SMALLINT },
//     comment: { type: seq.STRING },
//     user_id: { type: seq.SMALLINT },
//     user_name: { type: seq.STRING }
// }, opts);
// export const def_robot_maint = publicTable.sequelize.define('def_robot_maint', {
//     factory_id: { type: seq.INTEGER, primaryKey: true },
//     booth_id: { type: seq.INTEGER, primaryKey: true },
//     zone_id: { type: seq.INTEGER, primaryKey: true },
//     robot_id: { type: seq.INTEGER, primaryKey: true },
//     maint_code: { type: seq.STRING, primaryKey: true },
//     expect_time: { type: seq.DATE },
//     registration_time: { type: seq.DATE },
//     playback_time: { type: seq.INTEGER },
//     operate_time: { type: seq.INTEGER }
// }, opts);
// export const def_maint_list = publicTable.sequelize.define('def_maint_list', {
//     maint_code: { type: seq.STRING, primaryKey: true },
//     lang_type: { type: seq.SMALLINT, primaryKey: true },
//     unit_id: { type: seq.INTEGER },
//     maint_point: { type: seq.STRING },
//     maint_name: { type: seq.STRING, allowNull: true },
//     time_type: { type: seq.SMALLINT, allowNull: true },
//     standard: { type: seq.STRING },
//     maint_way: { type: seq.STRING },
//     maint_cycle: { type: seq.INTEGER },
//     grease_type: { type: seq.STRING },
//     grease_amount: { type: seq.INTEGER },
//     grease_inlet: { type: seq.STRING },
//     grease_outlet: { type: seq.STRING },
//     valve_attribute: { type: seq.STRING }
// }, opts);
// export const his_maint_list = publicTable.sequelize.define('his_maint_list', {
//     factory_id: { type: seq.SMALLINT },
//     booth_id: { type: seq.SMALLINT, primaryKey: true },
//     zone_id: { type: seq.SMALLINT, primaryKey: true },
//     robot_id: { type: seq.SMALLINT, primaryKey: true },
//     time_stamp: { type: seq.DATE, primaryKey: true },
//     axis: { type: seq.SMALLINT, primaryKey: true },
//     maint_code: { type: seq.STRING, allowNull: true },
//     action_type: { type: seq.SMALLINT, allowNull: true },
//     etc: { type: seq.STRING },
//     user_id: { type: seq.STRING }
// }, opts);
// export const def_torquepredict_type = publicTable.sequelize.define('def_torquepredict_type', {
//     predict_type: { type: seq.SMALLINT, primaryKey: true },
//     type_name: { type: seq.STRING },
//     type_description: { type: seq.STRING }
// }, opts);
// export const his_robotpredict_point = publicTable.sequelize.define('his_robotpredict_point', {
//     factory_id: { type: seq.SMALLINT, primaryKey: true },
//     booth_id: { type: seq.SMALLINT, primaryKey: true },
//     zone_id: { type: seq.SMALLINT, primaryKey: true },
//     robot_id: { type: seq.SMALLINT, primaryKey: true },
//     check_date: { type: seq.DATE, primaryKey: true },
//     job_name: { type: seq.SMALLINT, primaryKey: true },
//     axis: { type: seq.SMALLINT, primaryKey: true },
//     predict_type: { type: seq.SMALLINT, primaryKey: true, foreignKey: true },
//     time_stamp: { type: seq.DATE, primaryKey: true },
//     end_time: { type: seq.DATE, primaryKey: true },
//     motor_torque_min: { type: seq.ARRAY(seq.SMALLINT) },
//     motor_torque_max: { type: seq.ARRAY(seq.SMALLINT) },
//     step_no: { type: seq.ARRAY(seq.SMALLINT) },
//     violation_step: { type: seq.ARRAY(seq.SMALLINT) }
// }, opts);
// export const his_robot_torque = publicTable.sequelize.define('his_robot_torque', {
//     time_stamp: { type: seq.DATE, primaryKey: true }, 
//     factory_id: { type: seq.SMALLINT },
//     booth_id: { type: seq.SMALLINT, primaryKey: true },
//     zone_id: { type: seq.SMALLINT, primaryKey: true },
//     robot_id: { type: seq.SMALLINT, primaryKey: true },
//     motor_torque: { type: seq.ARRAY(seq.SMALLINT) },
//     job_name: { type: seq.SMALLINT },
//     line_no: { type: seq.SMALLINT },
//     step_no: { type: seq.SMALLINT },
//     paint_path: { type: seq.SMALLINT },
// }, opts);
// export const his_robot_torque_violationjob = publicTable.sequelize.define('his_robot_torque_violationjob', {
//     factory_id: { type: seq.SMALLINT, primaryKey: true },
//     booth_id: { type: seq.SMALLINT, primaryKey: true },
//     zone_id: { type: seq.SMALLINT, primaryKey: true },
//     robot_id: { type: seq.SMALLINT, primaryKey: true },
//     job_name: { type: seq.STRING, primaryKey: true },
//     axis: { type: seq.SMALLINT, primaryKey: true },
//     time_stamp: { type: seq.DATE, primaryKey: true },
//     end_time: { type: seq.DATE, primaryKey: true },
//     motor_torque: { type: seq.ARRAY(seq.SMALLINT) },
//     step_no: { type: seq.ARRAY(seq.SMALLINT) },
//     violation_step: { type: seq.ARRAY(seq.SMALLINT) },
//     config_torquemax: { type: seq.ARRAY(seq.SMALLINT) },
//     config_torquemin: { type: seq.ARRAY(seq.SMALLINT) },
//     config_stepno: { type: seq.ARRAY(seq.SMALLINT) }
// }, opts);
// export const def_torquelimit_config = publicTable.sequelize.define('def_torquelimit_config', {
//     factory_id: { type: seq.SMALLINT, primaryKey: true },
//     booth_id: { type: seq.SMALLINT, primaryKey: true },
//     zone_id: { type: seq.SMALLINT, primaryKey: true },
//     robot_id: { type: seq.SMALLINT, primaryKey: true },
//     axis: { type: seq.SMALLINT, primaryKey: true },
//     job_name: { type: seq.STRING, primaryKey: true },
//     update_timestamp: { type: seq.DATE },
//     step_no: { type: seq.ARRAY(seq.SMALLINT) },
//     min_val: { type: seq.ARRAY(seq.SMALLINT) },
//     max_val: { type: seq.ARRAY(seq.SMALLINT) }
// }, opts);
// export const his_torquelimit_config = publicTable.sequelize.define('his_torquelimit_config', {
//     factory_id: { type: seq.SMALLINT, primaryKey: true },
//     booth_id: { type: seq.SMALLINT, primaryKey: true },
//     zone_id: { type: seq.SMALLINT, primaryKey: true },
//     robot_id: { type: seq.SMALLINT, primaryKey: true },
//     axis: { type: seq.SMALLINT, primaryKey: true },
//     modify_timestamp: { type: seq.DATE, primaryKey: true },
//     job_name: { type: seq.STRING, primaryKey: true },
//     step_no: { type: seq.ARRAY(seq.SMALLINT) },
//     min_val: { type: seq.ARRAY(seq.SMALLINT) },
//     max_val: { type: seq.ARRAY(seq.SMALLINT) }
// }, opts);
// export const def_accumtype_list = publicTable.sequelize.define('def_accumtype_list', {
//     accum_type: { type: seq.SMALLINT, primaryKey: true },
//     type_name: { type: seq.STRING },
//     type_description: { type: seq.STRING }
// }, opts);
// export const his_violationjob_accum = publicTable.sequelize.define('his_violationjob_accum', {
//     factory_id: { type: seq.SMALLINT, primaryKey: true },
//     booth_id: { type: seq.SMALLINT, primaryKey: true },
//     zone_id: { type: seq.SMALLINT, primaryKey: true },
//     robot_id: { type: seq.SMALLINT, primaryKey: true },
//     job_name: { type: seq.STRING, primaryKey: true },
//     axis: { type: seq.SMALLINT, primaryKey: true },
//     workingtime: { type: seq.SMALLINT },
//     config_data: { type: seq.JSONB }
// }, opts);
// export const cur_job_list = publicTable.sequelize.define('cur_job_list', {
//     factory_id: { type: seq.SMALLINT, primaryKey: true },
//     booth_id: { type: seq.SMALLINT, primaryKey: true },
//     zone_id: { type: seq.SMALLINT, primaryKey: true },
//     robot_id: { type: seq.SMALLINT, primaryKey: true },
//     update_timestamp: { type: seq.DATE },
//     job_list: { type: seq.ARRAY(seq.STRING) }
// }, opts);
// export const def_mserver_config = publicTable.sequelize.define('def_mserver_config', {
//     factory_id: { type: seq.INTEGER, primaryKey: true },
//     mserver_id: { type: seq.INTEGER, primaryKey: true },
//     ip_addr: { type: seq.STRING, allowNull: true },
//     name: { type: seq.STRING, allowNull: true },
//     status: { type: seq.INTEGER, allowNull: true },
//     monitor_booth_id: { type: seq.ARRAY(seq.INTEGER) }
// }, opts);
// export const def_user_config = publicTable.sequelize.define('def_user_config', {
//     factory_id: { type: seq.INTEGER, primaryKey: true },
//     user_id: { type: seq.STRING, primaryKey: true },
//     booth_id: { type: seq.INTEGER },
//     zone_id: { type: seq.INTEGER },
//     user_name: { type: seq.STRING, allowNull: true },
//     user_password: { type: seq.STRING, allowNull: true },
//     user_authority: { type: seq.INTEGER, allowNull: true },
//     phone_no: { type: seq.STRING },
//     phone_noti: { type: seq.BOOLEAN },
//     email: { type: seq.STRING },
//     email_noti: { type: seq.BOOLEAN },
//     noti_no: { type: seq.ARRAY(seq.INTEGER) },
//     security_code: { type: seq.STRING }
// }, opts);
// export const his_product_count = publicTable.sequelize.define('his_product_count', {
//     factory_id: { type: seq.SMALLINT },
//     booth_id: { type: seq.SMALLINT, primaryKey: true },
//     zone_id: { type: seq.SMALLINT, primaryKey: true },
//     time_stamp: { type: seq.DATE, primaryKey: true },
//     product_count: { type: seq.INTEGER }
// }, opts);
// export const his_backup_list = publicTable.sequelize.define('his_backup_list', {
//     robot_id: { type: seq.INTEGER, primaryKey: true },
//     file_name: { type: seq.STRING, primaryKey: true },
//     time_stamp: { type: seq.DATE, primaryKey: true },
//     factory_id: { type: seq.INTEGER },
//     booth_id: { type: seq.INTEGER },
//     zone_id: { type: seq.INTEGER },
//     backup_id: { type: seq.BIGINT },
//     validation: { type: seq.BOOLEAN },
//     error: { type: seq.STRING },
//     file_content: { type: seq.TEXT },
//     file_type: { type: seq.SMALLINT }
// }, opts);
// export const cur_dcserver_status = publicTable.sequelize.define('cur_dcserver_status', {
//     dcserver_id: { type: seq.SMALLINT, primaryKey: true },
//     status: { type: seq.SMALLINT }
// }, opts);
// export const ROBOT_FAILURE_HISTORY = publicTable.sequelize.define('ROBOT_FAILURE_HISTORY', {
//     history_id: { type: seq.INTEGER, primaryKey: true },
//     factory_id: { type: seq.INTEGER },
//     booth_id: { type: seq.INTEGER },
//     zone_id: { type: seq.INTEGER },
//     robot_id: { type: seq.INTEGER },
//     used_part: { type: seq.ARRAY(seq.STRING) },
//     date: { type: seq.DATE },
//     occur_time: { type: seq.TIME },
//     clear_time: { type: seq.TIME },
//     dead_time: { type: seq.INTEGER },
//     cause: { type: seq.STRING },
//     clear_action: { type: seq.STRING },
//     alarm_code: { type: seq.STRING },
//     user_id: { type: seq.STRING },
//     type: { type: seq.SMALLINT, allowNull: true }  
// }, opts);
// export const rel_useraction_useful = publicTable.sequelize.define('rel_useraction_useful', {
//     action_id: { type: seq.RANGE(seq.BIGINT), primaryKey: true },
//     alarm_id: { type: seq.RANGE(seq.BIGINT), primaryKey: true }
// }, opts);
export const his_alarm_list = publicTable.sequelize.define('his_alarm_list', {
    alarm_id: { type: seq.BIGINT, primaryKey: true },
    alarm_code: { type: seq.STRING },
    time_stamp: { type: seq.DATE },
    factory_id: { type: seq.INTEGER },
    booth_id: { type: seq.INTEGER },
    zone_id: { type: seq.INTEGER },
    robot_id: { type: seq.INTEGER },
    update_time: { type: seq.DATE },
    alarm_sub_code: { type: seq.STRING },
    sub_code_info: { type: seq.STRING },
    sub_code_info_vary: { type: seq.SMALLINT },
    alarm_name: { type: seq.STRING },
    additional_info: { type: seq.ARRAY(seq.STRING) },
    sub_code_reverse_display_info: { type: seq.ARRAY(seq.STRING) },
    alarm_type: { type: seq.INTEGER, foreignKey: true, allowNull: true },
    alarm_level: { type: seq.INTEGER, allowNull: true },
    alarm_status: { type: seq.INTEGER, allowNull: true },
    alarm_content: { type: seq.TEXT },
    job_name: { type: seq.STRING },
    line_no: { type: seq.SMALLINT },
    step_no: { type: seq.SMALLINT },
    schedule_id: { type: seq.INTEGER }
}, opts);
// export const def_predictalarm_list = publicTable.sequelize.define('def_predictalarm_list', {
//     alarm_code: { type: seq.STRING, primaryKey: true },
//     predict_id: { type: seq.SMALLINT },
//     alarm_comment_kr: { type: seq.STRING },
//     alarm_comment_en: { type: seq.STRING },
//     alarm_comment_cn: { type: seq.STRING }
// }, opts);
// export const def_alarm_type = publicTable.sequelize.define('def_alarm_type', {
//     type_no: { type: seq.INTEGER, primaryKey: true },
//     type_name_kr: { type: seq.STRING },
//     type_name_en: { type: seq.STRING },
//     type_name_cn: { type: seq.STRING }
// }, opts);
// export const def_alarm_status = publicTable.sequelize.define('def_alarm_status', {
//     status_no: { type: seq.INTEGER, primaryKey: true },
//     status_name: { type: seq.STRING }
// }, opts);
// export const def_alarm_level = publicTable.sequelize.define('def_alarm_level', { 
//     level_no: { type: seq.INTEGER, primaryKey: true },
//     level_name: { type: seq.STRING }
// }, opts);
// export const def_trouble_manual = publicTable.sequelize.define('def_trouble_manual', {
//     manual_id: { type: seq.BIGINT, primaryKey: true },
//     alarm_code: { type: seq.STRING },
//     alarm_sub_code: { type: seq.STRING },
//     rc_id: { type: seq.INTEGER },
//     message_kr: { type: seq.TEXT },
//     cause_kr: { type: seq.TEXT },
//     remedy_kr: { type: seq.TEXT },
//     message_en: { type: seq.TEXT },
//     cause_en: { type: seq.TEXT },
//     remedy_en: { type: seq.TEXT },
//     file_manual: { type: seq.STRING }
// }, opts);
// export const def_common_config = publicTable.sequelize.define('def_common_config', {
//     common_no: { type: seq.INTEGER, primaryKey: true },
//     factory_id: { type: seq.INTEGER, allowNull: true },
//     bauto_backup: { type: seq.BOOLEAN },
//     auto_backup_day: { type: seq.INTEGER },
//     auto_backup_time: { type: seq.INTEGER },
//     auto_backup_dayofweek: { type: seq.SMALLINT },
//     bauto_del: { type: seq.BOOLEAN },
//     auto_del_day: { type: seq.INTEGER },
//     auto_del_time: { type: seq.INTEGER },
//     is_changed: { type: seq.BOOLEAN },
//     encoder_tmp_warning: { type: seq.INTEGER },
//     bauto_param_del: { type: seq.BOOLEAN },
//     auto_param_del_day: { type: seq.INTEGER },
//     torquelimit_rule: { type: seq.BOOLEAN },
//     torquelimit_joblimit: { type: seq.BOOLEAN },
//     torquelimit_jobcount: { type: seq.SMALLINT },
//     torquelimit_margin: { type: seq.SMALLINT },
//     torquelimit_steplimit: { type: seq.SMALLINT },
//     torquelimit_checkcount: { type: seq.SMALLINT },
//     torquelimit_alarmlimit: { type: seq.SMALLINT },
//     warning_condition: { type: seq.SMALLINT },
//     similarpoint_rule: { type: seq.BOOLEAN },
//     similarpoint_joblist: { type: seq.BOOLEAN },
//     similarpoint_jobcount: { type: seq.SMALLINT },
//     similarpoint_standard: { type: seq.SMALLINT },
//     similarpoint_datacount: { type: seq.SMALLINT },
//     similarpoint_checkcount: { type: seq.SMALLINT },
//     similarpoint_alarmlimit: { type: seq.SMALLINT },
//     bworkgroup1: { type: seq.BOOLEAN },
//     group_start_time1: { type: seq.STRING },
//     group_working_time1: { type: seq.SMALLINT },
//     bworkgroup2: { type: seq.BOOLEAN },
//     group_start_time2: { type: seq.STRING },
//     group_working_time2: { type: seq.SMALLINT },
//     bworkgroup3: { type: seq.BOOLEAN },
//     group_start_time3: { type: seq.STRING },
//     group_working_time3: { type: seq.SMALLINT },
//     product_goal_count: { type: seq.SMALLINT },
//     batomizer_delete: { type: seq.BOOLEAN },
//     atomizer_delete_option: { type: seq.SMALLINT },
//     atomizer_delete_dayofweek: { type: seq.SMALLINT }
// }, opts);
// export const def_filemanual = publicTable.sequelize.define('def_filemanual', {
//     uid: { type: seq.INTEGER, primaryKey: true },
//     manual_categories: { type: seq.INTEGER },
//     display_name_ko_kr: { type: seq.ARRAY(seq.STRING) },
//     file_name: { type: seq.ARRAY(seq.STRING) },
//     file_format: { type: seq.ARRAY(seq.STRING) },
//     display_name_en_us: { type: seq.ARRAY(seq.STRING) },
//     display_name_zh_en: { type: seq.ARRAY(seq.STRING) }
// }, opts);
// export const def_useraction_type = publicTable.sequelize.define('def_useraction_type', {
//     type_no: { type: seq.SMALLINT, primaryKey: true },
//     type_name_kr: { type: seq.STRING },
//     type_name_en: { type: seq.STRING },
//     type_name_cn: { type: seq.STRING }
// }, opts);
// export const his_user_action = publicTable.sequelize.define('his_user_action', {
//     action_id: { type: seq.BIGINT, primaryKey: true },
//     action_title: { type: seq.STRING },
//     time_stamp: { type: seq.DATE },
//     ref_alarm_code: { type: seq.STRING },
//     user_id: { type: seq.STRING },
//     action_type: { type: seq.SMALLINT, foreignKey: true },
//     remedy_message: { type: seq.TEXT },
//     start_deadtime: { type: seq.DATE },
//     end_deadtime: { type: seq.DATE },
//     deadtime: { type: seq.INTEGER },
//     cause_message: { type: seq.TEXT },
//     factory_id: { type: seq.SMALLINT },
//     booth_id: { type: seq.SMALLINT },
//     zone_id: { type: seq.SMALLINT },
//     robot_id: { type: seq.SMALLINT }
// }, opts);
// export const rel_useraction_tags = publicTable.sequelize.define('rel_useraction_tags', {
//     action_id: { type: seq.BIGINT, primaryKey: true, foreignKey: true },
//     tag_id: { type: seq.BIGINT, primaryKey: true, foreignKey: true }
// }, opts);
// export const hashtags = publicTable.sequelize.define('hashtags', {
//     tag_id: { type: seq.BIGINT, primaryKey: true },
//     tag: { type: seq.STRING, unique: true }
// }, opts);
// export const his_history_list = publicTable.sequelize.define('his_history_list', {
//     history_id: { type: seq.BIGINT, primaryKey: true },
//     factory_id: { type: seq.INTEGER },
//     booth_id: { type: seq.INTEGER },
//     zone_id: { type: seq.INTEGER },
//     robot_id: { type: seq.INTEGER },
//     used_part: { type: seq.ARRAY(seq.STRING) },
//     date: { type: seq.DATE },
//     occur_time: { type: seq.TIME },
//     clear_time: { type: seq.TIME },
//     dead_time: { type: seq.INTEGER },
//     cause: { type: seq.STRING },
//     clear_action: { type: seq.STRING },
//     alarm_code: { type: seq.STRING },
//     user_id: { type: seq.STRING },
//     type: { type: seq.SMALLINT, allowNull: true }
// }, opts);
// export const cur_plc_data = publicTable.sequelize.define('cur_plc_data', {
//     factory_id: { type: seq.SMALLINT },
//     booth_id: { type: seq.SMALLINT, primaryKey: true },
//     zone_id : { type: seq.SMALLINT, primaryKey: true },
//     robot_id: { type: seq.SMALLINT, primaryKey: true },
//     update_timestamp: { type: seq.TIME },
//     atomizer_alarm: { type: seq.SMALLINT },
//     spray_onoff: { type: seq.INTEGER },
//     spray_enable: { type: seq.SMALLINT },
//     hv_enable: { type: seq. SMALLINT },
//     flow_cmd: { type: seq.SMALLINT },
//     hv_cmd: { type: seq.SMALLINT },
//     turbine_speed_cmd: { type: seq.SMALLINT },
//     sa_s_cmd: { type: seq.SMALLINT },
//     sa_v_cmd: { type: seq.SMALLINT },
//     flow_feedback: { type: seq.SMALLINT },
//     hv_feedback: { type: seq.SMALLINT },
//     turbine_speed_feedback: { type: seq.SMALLINT },
//     sa_s_feedback: { type: seq.SMALLINT },
//     sa_v_feedback: { type: seq.SMALLINT },
//     main_air: { type: seq.SMALLINT },
//     fgps_input_pressure: { type: seq.ARRAY(seq.SMALLINT) },
//     fgps_output_pressure: { type: seq.ARRAY(seq.SMALLINT) },
//     paint_path: { type: seq.SMALLINT },
//     robot_mode_home: { type: seq.SMALLINT },
//     robot_mode_auto: { type: seq.SMALLINT },
//     robot_mode_teach: { type: seq.SMALLINT },
//     robot_mode_run: { type: seq.SMALLINT },
//     robot_mode_rins: { type: seq.SMALLINT },
//     robot_mode_bypass: { type: seq.SMALLINT },
//     job_start: { type: seq.SMALLINT },
//     job_end: { type: seq.SMALLINT },
//     fgp_torque: { type: seq.ARRAY(seq.SMALLINT) },
//     hvc_feedback: { type: seq.SMALLINT },
//     hv_onoff: { type: seq.SMALLINT },
//     nano_air: { type: seq.SMALLINT },
//     baring_air: { type: seq.SMALLINT },
//     bellcup_air: { type: seq.SMALLINT }
// }, opts);
// export const cur_valve_data = publicTable.sequelize.define('cur_valve_data', {
//     factory_id: { type: seq.SMALLINT },
//     booth_id: { type: seq.SMALLINT, primaryKey: true },
//     zone_id: { type: seq.SMALLINT, primaryKey: true },
//     robot_id: { type: seq.SMALLINT, primaryKey: true },
//     time_stamp: { type: seq.TIME },
//     valve1: { type: seq.BIGINT },
//     valve2: { type: seq.BIGINT },
//     valve3: { type: seq.BIGINT },
//     valve4: { type: seq.BIGINT },
//     valve5: { type: seq.BIGINT },
//     valve6: { type: seq.BIGINT },
//     valve7: { type: seq.BIGINT },
//     valve8: { type: seq.BIGINT },
//     valve9: { type: seq.BIGINT },
//     valve10: { type: seq.BIGINT },
//     valve11: { type: seq.BIGINT },
//     valve12: { type: seq.BIGINT },
//     valve13: { type: seq.BIGINT },
//     valve14: { type: seq.BIGINT },
//     valve15: { type: seq.BIGINT },
//     valve16: { type: seq.BIGINT },
//     valve17: { type: seq.BIGINT },
//     valve18: { type: seq.BIGINT },
//     valve19: { type: seq.BIGINT },
//     valve20: { type: seq.BIGINT },
//     valve21: { type: seq.BIGINT },
//     valve22: { type: seq.BIGINT },
//     valve23: { type: seq.BIGINT },
//     valve24: { type: seq.BIGINT },
//     valve25: { type: seq.BIGINT },
//     valve26: { type: seq.BIGINT },
//     valve27: { type: seq.BIGINT },
//     valve28: { type: seq.BIGINT },
//     valve29: { type: seq.BIGINT },
//     valve30: { type: seq.BIGINT },
//     valve31: { type: seq.BIGINT },
//     valve32: { type: seq.BIGINT },
//     valve33: { type: seq.BIGINT },
//     valve34: { type: seq.BIGINT },
//     valve35: { type: seq.BIGINT },
//     valve36: { type: seq.BIGINT },
//     valve37: { type: seq.BIGINT },
//     valve38: { type: seq.BIGINT },
//     valve39: { type: seq.BIGINT },
//     valve40: { type: seq.BIGINT }
// }, opts);
// export const cur_sealer_data = publicTable.sequelize.define('cur_sealer_data', {
//     factory_id: { type: seq.SMALLINT },
//     booth_id: { type: seq.SMALLINT, primaryKey: true },
//     zone_id: { type: seq.SMALLINT, primaryKey: true },
//     robot_id: { type: seq.SMALLINT, primaryKey: true },
//     update_timestamp: { type: seq.TIME },
//     trigger1: { type: seq.SMALLINT },
//     trigger2: { type: seq.SMALLINT },
//     trigger3: { type: seq.SMALLINT },
//     flow_cmd: { type: seq.SMALLINT },
//     swirl_cmd: { type: seq.SMALLINT },
//     masking_unit_speed_cmd: { type :seq.SMALLINT },
//     flow_feedback: { type: seq.SMALLINT },
//     swirl_feedback: { type: seq.SMALLINT },
//     pressure_feedback: { type: seq.SMALLINT }
// }, opts);